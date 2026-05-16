-- ============================================================
-- PATCH: Add weight column + fix producer_id reference docs
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times — all statements are idempotent.
-- ============================================================

-- ── 1. Add weight column (numeric, optional) ─────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight numeric(10, 3);   -- kg, e.g. 0.500

-- ── 2. Add name_en column if missing ─────────────────────────
--    (some older project setups may lack it)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_en text;

-- ── 3. Add description_en column if missing ──────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description_en text;

-- ── 4. Ensure sizes / colors / specs JSONB columns exist ─────
--    These store structured variant data as JSON arrays.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sizes  jsonb;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS colors jsonb;
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS specs  jsonb;

-- ── 5. CRITICAL: producer_id must equal auth.uid() ───────────
--    The RLS INSERT policy is:
--      WITH CHECK (auth.uid() = producer_id)
--    The frontend was sending profile.id (producer_profiles PK)
--    instead of profile.user_id (the auth UID).
--    Fix is applied in the frontend payload (SellerDashboard.jsx).
--    No schema change needed here — this is a documentation note.

-- ── 6. Verify the column additions ───────────────────────────
SELECT column_name, data_type, is_nullable
FROM   information_schema.columns
WHERE  table_schema = 'public'
  AND  table_name   = 'products'
ORDER  BY ordinal_position;
