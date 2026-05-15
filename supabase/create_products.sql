-- ============================================================
-- Products Table + RLS + Storage Bucket
-- Run in: Supabase Dashboard → SQL Editor
-- Project: boaamuwgwtmcrxwyezwx
-- ============================================================

-- ── 1. Products Table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.products (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ar        text        NOT NULL CHECK (char_length(name_ar) BETWEEN 2 AND 200),
  description_ar text,
  price          numeric(10, 2) NOT NULL CHECK (price >= 0),
  category_id    int         REFERENCES public.categories(id),
  city_id        int         REFERENCES public.cities(id),
  image_url      text,
  stock          int         NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_perishable  boolean     NOT NULL DEFAULT false,
  delivery_type  text        NOT NULL DEFAULT 'nationwide'
                             CHECK (delivery_type IN ('nationwide', 'local')),
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Grant table-level access ──────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT                         ON public.products TO anon;

-- ── 3. Enable RLS ────────────────────────────────────────────

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies ──────────────────────────────────────────

-- Drop existing policies first (idempotent re-run safety)
DROP POLICY IF EXISTS "products: public can view active products"   ON public.products;
DROP POLICY IF EXISTS "products: producers can view own products"   ON public.products;
DROP POLICY IF EXISTS "products: producers can insert own products" ON public.products;
DROP POLICY IF EXISTS "products: producers can update own products" ON public.products;
DROP POLICY IF EXISTS "products: producers can delete own products" ON public.products;

-- Anyone (incl. guests) can see active products
CREATE POLICY "products: public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- Producers can always see their own products (incl. inactive)
CREATE POLICY "products: producers can view own products"
  ON public.products FOR SELECT TO authenticated
  USING (auth.uid() = producer_id);

-- Producers can insert their own products only
CREATE POLICY "products: producers can insert own products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = producer_id);

-- Producers can update their own products only
CREATE POLICY "products: producers can update own products"
  ON public.products FOR UPDATE TO authenticated
  USING     (auth.uid() = producer_id)
  WITH CHECK (auth.uid() = producer_id);

-- Producers can delete their own products only
CREATE POLICY "products: producers can delete own products"
  ON public.products FOR DELETE TO authenticated
  USING (auth.uid() = producer_id);

-- ── 5. Storage Bucket ────────────────────────────────────────
-- NOTE: Supabase does not support CREATE BUCKET via SQL.
-- Run this block to register the bucket metadata directly.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,                                          -- public bucket (images are readable by all)
  5242880,                                       -- 5 MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── 6. Storage RLS Policies ──────────────────────────────────

-- Drop existing storage policies first (idempotent re-run safety)
DROP POLICY IF EXISTS "storage: public read product images"            ON storage.objects;
DROP POLICY IF EXISTS "storage: authenticated producers upload images" ON storage.objects;
DROP POLICY IF EXISTS "storage: producers update own images"           ON storage.objects;
DROP POLICY IF EXISTS "storage: producers delete own images"           ON storage.objects;

-- Anyone can read images from this bucket (CDN-style public read)
CREATE POLICY "storage: public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated users can upload to the bucket
-- The path MUST start with their own user ID (enforced by upload logic in the client)
CREATE POLICY "storage: authenticated producers upload images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Producers can update (replace) only their own images
CREATE POLICY "storage: producers update own images"
  ON storage.objects FOR UPDATE TO authenticated
  USING     (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Producers can delete only their own images
CREATE POLICY "storage: producers delete own images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
