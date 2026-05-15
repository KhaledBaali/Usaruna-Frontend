-- ============================================================
-- Cart Items Table + RLS
-- Run in: Supabase Dashboard → SQL Editor
-- Project: boaamuwgwtmcrxwyezwx
-- ============================================================

-- 1. Create the cart_items table
CREATE TABLE IF NOT EXISTS public.cart_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text        NOT NULL,   -- matches the string id in products.js
  quantity   int         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per user+product (prevents duplicates; use quantity instead)
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_idx
  ON public.cart_items (user_id, product_id);

-- 2. Grant table-level access to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;

-- 3. Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 4. Policies — users can only touch their own rows
DROP POLICY IF EXISTS "cart: users select own items"  ON public.cart_items;
DROP POLICY IF EXISTS "cart: users insert own items"  ON public.cart_items;
DROP POLICY IF EXISTS "cart: users update own items"  ON public.cart_items;
DROP POLICY IF EXISTS "cart: users delete own items"  ON public.cart_items;

CREATE POLICY "cart: users select own items"
  ON public.cart_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cart: users insert own items"
  ON public.cart_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart: users update own items"
  ON public.cart_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart: users delete own items"
  ON public.cart_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'cart_items' ORDER BY cmd;
