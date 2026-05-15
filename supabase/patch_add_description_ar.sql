-- ============================================================
-- ADD MISSING COLUMN: description_ar
-- Run this if the products table already exists but is missing
-- the description_ar column (e.g. from an older migration).
-- Safe to run multiple times — uses IF NOT EXISTS guard.
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description_ar text;
