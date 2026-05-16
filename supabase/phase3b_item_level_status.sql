-- ============================================================
-- Phase 3b: Order-Items Item-Level Status (Order Splitting)
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run All
--
-- SECTIONS:
--   1.  Add status column to order_items
--   2.  Update place_order() RPC — init item status = 'confirmed'
--   3.  RLS UPDATE policy — producer updates own item status only
--   4.  DROP old order-level update policy (producers no longer need it)
--   5.  Schema cache reload
--   6.  Verification
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- SECTION 1: Add status column to order_items
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled'));

-- Backfill: set existing rows to 'confirmed' (they were already paid)
UPDATE public.order_items
  SET status = 'confirmed'
  WHERE status = 'pending';


-- ══════════════════════════════════════════════════════════════
-- SECTION 2: Update place_order() RPC to initialize item status
-- ══════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.place_order(uuid, text, numeric, numeric, text, jsonb);

CREATE OR REPLACE FUNCTION public.place_order(
  p_user_id        uuid,
  p_order_number   text,
  p_total          numeric,
  p_delivery_total numeric,
  p_pay_method     text,
  p_items          jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id  uuid;
  v_item      jsonb;
  v_product   record;
  v_qty       int;
  v_pid       uuid;
BEGIN

  -- ── 0. Caller must be the authenticated user ──────────────
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED: caller uid does not match p_user_id'
      USING ERRCODE = '42501';
  END IF;

  -- ── 1. Validate: cart must not be empty ───────────────────
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_CART: no items provided'
      USING ERRCODE = 'P0001';
  END IF;

  -- ── 2. Stock check (SELECT FOR UPDATE → row-level lock) ───
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;

    SELECT * INTO v_product
      FROM public.products
      WHERE id = v_pid
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND: product % does not exist', v_pid
        USING ERRCODE = 'P0002';
    END IF;

    IF v_product.stock < v_qty THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: product "%" has only % units left (requested %)',
        COALESCE(v_product.name_ar, v_pid::text),
        v_product.stock,
        v_qty
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  -- ── 3. Insert order header ────────────────────────────────
  INSERT INTO public.orders (
    user_id, order_number, total_amount, delivery_total, pay_method, status
  )
  VALUES (
    p_user_id, p_order_number, p_total, p_delivery_total, p_pay_method, 'confirmed'
  )
  RETURNING id INTO v_order_id;

  -- ── 4. Insert order items (with item-level status) ────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;

    SELECT producer_id INTO v_product FROM public.products WHERE id = v_pid;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      producer_id,
      name_ar,
      name_en,
      price_at_purchase,
      quantity,
      emoji,
      gradient,
      delivery_option,
      delivery_price,
      status           -- ← item-level status: each item starts as 'confirmed'
    ) VALUES (
      v_order_id,
      v_pid,
      v_product.producer_id,
      v_item->>'name_ar',
      v_item->>'name_en',
      (v_item->>'price')::numeric,
      v_qty,
      v_item->>'emoji',
      v_item->>'gradient',
      v_item->>'delivery_option',
      COALESCE((v_item->>'delivery_price')::numeric, 0),
      'confirmed'      -- ← initialize every item as 'confirmed' on checkout
    );

    -- Atomic stock decrement
    UPDATE public.products
      SET stock = stock - v_qty
      WHERE id = v_pid;
  END LOOP;

  -- ── 5. Clear the user's cart ──────────────────────────────
  DELETE FROM public.cart_items
    WHERE user_id = p_user_id;

  -- ── 6. Return ─────────────────────────────────────────────
  RETURN jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', p_order_number,
    'status',       'confirmed'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(uuid, text, numeric, numeric, text, jsonb)
  TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- SECTION 3: Item-level UPDATE RLS — producers update own items
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "order_items: producers update own item status" ON public.order_items;

CREATE POLICY "order_items: producers update own item status"
  ON public.order_items FOR UPDATE TO authenticated
  USING  (producer_id = auth.uid())
  WITH CHECK (producer_id = auth.uid());

GRANT UPDATE ON public.order_items TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- SECTION 4: Drop the old order-HEADER update policy
--   (producers no longer need to touch orders.status directly;
--    item-level status is the new source of truth)
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "orders: producers update status" ON public.orders;


-- ══════════════════════════════════════════════════════════════
-- SECTION 5: Reload PostgREST schema cache
-- ══════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';


-- ══════════════════════════════════════════════════════════════
-- SECTION 6: Verification
-- ══════════════════════════════════════════════════════════════

-- Check new column exists
SELECT column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'order_items' AND column_name = 'status';

-- Check RLS policies
SELECT tablename, policyname, cmd
  FROM pg_policies
  WHERE tablename IN ('orders', 'order_items')
  ORDER BY tablename, cmd;

-- Preview existing order_items with new status
SELECT id, order_id, name_ar, quantity, price_at_purchase, status
  FROM public.order_items
  ORDER BY created_at DESC
  LIMIT 10;
