-- ============================================================
-- PATCH v3: Fix RLS Policies + Verify FK Architecture
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- ROOT CAUSE (confirmed by error 42501):
--   products.producer_id is a FK → producer_profiles.id
--   The INSERT policy was: WITH CHECK (auth.uid() = producer_id)
--   But producer_id holds a producer_profiles.id UUID, NOT an auth UID.
--   These are two different UUID namespaces.
--
-- THE CORRECT MODEL:
--   auth.uid()  →  producer_profiles.user_id  →  producer_profiles.id  →  products.producer_id
--   (session)       (FK back to auth.users)       (profile PK)              (FK to profile)
--
-- SOLUTION: All RLS policies must use a subquery to bridge the gap.
-- ============================================================

-- ── Step 1: Verify the FK constraint ─────────────────────────
-- This confirms producer_id → producer_profiles.id (NOT auth.users)
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name  AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name = 'products';

-- ── Step 2: Show all existing RLS policies on products ────────
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products';

-- ── Step 3: Drop ALL existing policies (clean slate) ─────────
DROP POLICY IF EXISTS "products: public can view active products"   ON public.products;
DROP POLICY IF EXISTS "products: producers can view own products"   ON public.products;
DROP POLICY IF EXISTS "products: producers can insert own products" ON public.products;
DROP POLICY IF EXISTS "products: producers can update own products" ON public.products;
DROP POLICY IF EXISTS "products: producers can delete own products" ON public.products;

-- ── Step 4: Recreate ALL policies using the subquery model ────
-- The subquery bridges auth.uid() → producer_profiles.id

-- Anyone (incl. guests) can see active products
CREATE POLICY "products: public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Producers can always see their own products (incl. inactive)
CREATE POLICY "products: producers can view own products"
  ON public.products FOR SELECT TO authenticated
  USING (
    producer_id IN (
      SELECT id FROM public.producer_profiles WHERE user_id = auth.uid()
    )
  );

-- Producers can insert products that belong to their profile
CREATE POLICY "products: producers can insert own products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (
    producer_id IN (
      SELECT id FROM public.producer_profiles WHERE user_id = auth.uid()
    )
  );

-- Producers can update their own products
CREATE POLICY "products: producers can update own products"
  ON public.products FOR UPDATE TO authenticated
  USING (
    producer_id IN (
      SELECT id FROM public.producer_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    producer_id IN (
      SELECT id FROM public.producer_profiles WHERE user_id = auth.uid()
    )
  );

-- Producers can delete their own products
CREATE POLICY "products: producers can delete own products"
  ON public.products FOR DELETE TO authenticated
  USING (
    producer_id IN (
      SELECT id FROM public.producer_profiles WHERE user_id = auth.uid()
    )
  );

-- ── Step 5: Force PostgREST schema cache reload ───────────────
NOTIFY pgrst, 'reload schema';

-- ── Step 6: Verify the new policies ──────────────────────────
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'products'
ORDER BY cmd;
