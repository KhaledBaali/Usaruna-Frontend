-- ============================================================
-- Phase 3 RLS Patch: Producer order status updates + 
--                    Customer order_items visibility
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run All
-- ============================================================

-- ── 1. Allow producers to UPDATE order status ────────────────
--   Producers need to be able to UPDATE the orders.status field.
--   We scope this to only their own orders (via order_items join).
--   NOTE: Since SECURITY DEFINER was used for place_order, we need
--   a separate UPDATE policy for direct client-side updates.

DROP POLICY IF EXISTS "orders: producers update status" ON public.orders;

CREATE POLICY "orders: producers update status"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    -- Producer can update an order if they have at least one item in it
    EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = orders.id
        AND oi.producer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.order_items oi
      WHERE oi.order_id = orders.id
        AND oi.producer_id = auth.uid()
    )
  );

-- ── 2. Ensure order_items are fully readable for nested selects ─
--   The existing policy uses EXISTS which works for direct queries.
--   Supabase PostgREST nested selects (orders → order_items) require
--   the order_items SELECT policy to fire independently when embedded.
--   The existing policy handles this correctly, but let's verify the
--   grants are in place.

GRANT SELECT ON public.order_items TO authenticated;
GRANT UPDATE ON public.orders TO authenticated;

-- ── 3. Reload schema cache ───────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ── 4. Verify policies ───────────────────────────────────────
SELECT tablename, policyname, cmd
  FROM pg_policies
  WHERE tablename IN ('orders', 'order_items')
  ORDER BY tablename, cmd;
