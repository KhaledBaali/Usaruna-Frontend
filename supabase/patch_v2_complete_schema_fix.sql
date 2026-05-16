-- ============================================================
-- PATCH v2: Complete Schema Fix for Product Insertion Regression
-- Run in: Supabase Dashboard → SQL Editor
--         (Dashboard → project → SQL Editor → New Query → paste → Run)
-- Safe to run multiple times — all statements are idempotent.
-- ============================================================

-- ── 1. Add all missing text/numeric columns ───────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_en        text;           -- English product name

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description_en text;           -- English description (was causing 400)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight         numeric(10, 3); -- Weight in kg (e.g. 0.500)

-- ── 2. Add JSONB variant columns ──────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sizes  jsonb;                  -- [{label_ar, label_en, price_adj}]

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS colors jsonb;                  -- [{label_ar, label_en, hex}]

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS specs  jsonb;                  -- [{key, value}]

-- ── 3. Force PostgREST schema cache reload ────────────────────
--    Without this, the API may still serve stale column info
--    even after the ALTER TABLE succeeds.
NOTIFY pgrst, 'reload schema';

-- ── 4. Verify all columns now exist ──────────────────────────
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'products'
ORDER BY ordinal_position;
