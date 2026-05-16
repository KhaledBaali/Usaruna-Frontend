-- ============================================================
-- Phase 3: Orders Schema + place_order RPC
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run All
--
-- SECTIONS:
--   1.  orders table + RLS
--   2.  order_items table + RLS
--   3.  place_order() RPC (ACID transaction)
--   4.  Permissions
--   5.  Schema reload
--   6.  Verification
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- SECTION 1: orders table
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.orders (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number   text        NOT NULL UNIQUE,       -- human-readable ref e.g. "847291"
  total_amount   numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  delivery_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (delivery_total >= 0),
  pay_method     text        NOT NULL DEFAULT 'cod',
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop stale policies
DROP POLICY IF EXISTS "orders: customers view own"   ON public.orders;
DROP POLICY IF EXISTS "orders: system insert"        ON public.orders;

-- Customers can only see their own orders
CREATE POLICY "orders: customers view own"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Only the service role / RPC (SECURITY DEFINER) can insert
-- Customers never insert directly — the RPC does it on their behalf
-- (No direct INSERT policy needed for anon/authenticated role)


-- ══════════════════════════════════════════════════════════════
-- SECTION 2: order_items table
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.order_items (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id        uuid        REFERENCES public.products(id) ON DELETE SET NULL,
  -- producer_id = products.producer_id at time of purchase (auth.users FK)
  -- We store it here so producers can query their own sales even if the product is deleted
  producer_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name_ar           text,
  name_en           text,
  price_at_purchase numeric(10,2) NOT NULL CHECK (price_at_purchase >= 0),
  quantity          int          NOT NULL CHECK (quantity > 0),
  emoji             text,
  gradient          text,
  delivery_option   text,
  delivery_price    numeric(10,2) NOT NULL DEFAULT 0,
  created_at        timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx    ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_producer_id_idx ON public.order_items (producer_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop stale policies
DROP POLICY IF EXISTS "order_items: customers view own"  ON public.order_items;
DROP POLICY IF EXISTS "order_items: producers view sales" ON public.order_items;

-- Customers can see their own order's items (via order_id → orders.user_id join)
CREATE POLICY "order_items: customers view own"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Producers can see order_items where they are the producer
CREATE POLICY "order_items: producers view sales"
  ON public.order_items FOR SELECT TO authenticated
  USING (producer_id = auth.uid());


-- ══════════════════════════════════════════════════════════════
-- SECTION 3: place_order() RPC — The Core Transaction Engine
-- ══════════════════════════════════════════════════════════════
--
-- Called from the frontend as:
--   supabase.rpc('place_order', {
--     p_user_id, p_order_number, p_total, p_delivery_total, p_pay_method,
--     p_items: [{ product_id, name_ar, name_en, price, qty, emoji,
--                  gradient, delivery_option, delivery_price }]
--   })
--
-- ACID guarantees:
--   • Stock check + stock decrement happen in the same serializable transaction
--   • Any failure at any step rolls back ALL changes atomically
--   • SECURITY DEFINER lets it bypass row-level insert policies on orders/order_items
--     while still reading auth.uid() for validation
-- ══════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.place_order(
  uuid, text, numeric, numeric, text, jsonb
);

CREATE OR REPLACE FUNCTION public.place_order(
  p_user_id        uuid,
  p_order_number   text,
  p_total          numeric,
  p_delivery_total numeric,
  p_pay_method     text,
  p_items          jsonb          -- array of item objects
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER                  -- executes with owner privileges (bypasses RLS on insert)
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

  -- ── 2. Stock check (loop, with advisory lock per product) ─
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;

    -- Lock the product row for the duration of this transaction
    SELECT * INTO v_product
      FROM public.products
      WHERE id = v_pid
      FOR UPDATE;           -- serializable row-level lock

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

  -- ── 4. Insert order items + decrement stock ───────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;

    -- Fetch current producer_id to lock into the order item
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
      delivery_price
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
      COALESCE((v_item->>'delivery_price')::numeric, 0)
    );

    -- CRITICAL: Decrement stock atomically
    UPDATE public.products
      SET stock = stock - v_qty
      WHERE id = v_pid;
  END LOOP;

  -- ── 5. Clear the user's cart ──────────────────────────────
  DELETE FROM public.cart_items
    WHERE user_id = p_user_id;

  -- ── 6. Return the new order id ────────────────────────────
  RETURN jsonb_build_object(
    'order_id',     v_order_id,
    'order_number', p_order_number,
    'status',       'confirmed'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with the original SQLSTATE so the frontend can read ERRCODE
    RAISE;
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- SECTION 4: Permissions
-- ══════════════════════════════════════════════════════════════

-- Allow authenticated users to call the RPC
GRANT EXECUTE ON FUNCTION public.place_order(uuid, text, numeric, numeric, text, jsonb)
  TO authenticated;

-- Table-level grants (RLS restricts row access; these allow the table to be reached)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders      TO authenticated;
GRANT SELECT, INSERT                 ON public.order_items TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- SECTION 5: Reload PostgREST schema cache
-- ══════════════════════════════════════════════════════════════

NOTIFY pgrst, 'reload schema';


-- ══════════════════════════════════════════════════════════════
-- SECTION 6: Verification queries
-- ══════════════════════════════════════════════════════════════

-- Check tables exist
SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('orders', 'order_items')
  ORDER BY table_name;

-- Check RPC exists
SELECT routine_name, routine_type FROM information_schema.routines
  WHERE routine_schema = 'public' AND routine_name = 'place_order';

-- Check RLS policies
SELECT tablename, policyname, cmd
  FROM pg_policies
  WHERE tablename IN ('orders', 'order_items')
  ORDER BY tablename, cmd;
