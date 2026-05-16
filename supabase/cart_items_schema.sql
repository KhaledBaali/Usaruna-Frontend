-- ============================================================
-- CART TABLE DDL — Hybrid Cart Architecture
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- This table stores authenticated users' persistent cart items.
-- Guest carts live in localStorage (key: 'usaruna_guest_cart').
-- On login, CartContext.jsx merges guest items into this table
-- and clears localStorage. No stale product data is stored —
-- only product_id + quantity. Full product objects are always
-- rehydrated from the live products catalogue on load.
-- ============================================================

-- ── 1. Create the table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity    integer     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- One row per user+product combination
  CONSTRAINT cart_items_user_product_key UNIQUE (user_id, product_id)
);

-- ── 2. Index for fast user lookups ───────────────────────────
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items (user_id);

-- ── 3. Enable Row-Level Security ─────────────────────────────
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies — users own their own rows ───────────────
-- Drop any stale policies first (idempotent)
DROP POLICY IF EXISTS "cart: users can view own items"   ON public.cart_items;
DROP POLICY IF EXISTS "cart: users can insert own items" ON public.cart_items;
DROP POLICY IF EXISTS "cart: users can update own items" ON public.cart_items;
DROP POLICY IF EXISTS "cart: users can delete own items" ON public.cart_items;

-- SELECT: only your own cart rows
CREATE POLICY "cart: users can view own items"
  ON public.cart_items FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT: can only insert rows with your own user_id
CREATE POLICY "cart: users can insert own items"
  ON public.cart_items FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: can only update your own rows (quantity changes)
CREATE POLICY "cart: users can update own items"
  ON public.cart_items FOR UPDATE TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: can only remove your own rows
CREATE POLICY "cart: users can delete own items"
  ON public.cart_items FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── 5. Reload PostgREST schema cache ─────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── 6. Verify ────────────────────────────────────────────────
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'cart_items' ORDER BY cmd;
