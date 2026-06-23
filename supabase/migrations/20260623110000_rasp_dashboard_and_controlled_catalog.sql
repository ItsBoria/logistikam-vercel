-- Controlled catalog and team-scoped replacement-item ledger for the RASP dashboard.
-- Existing products, orders, budgets and replacement-request history are preserved.

CREATE TABLE IF NOT EXISTS public.item_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Za-z0-9_-]{1,50}$'),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  icon text,
  color text CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.item_categories(code, name, display_order)
SELECT
  'legacy_' || substr(md5(COALESCE(NULLIF(btrim(category), ''), '×œ×œ× ×§×˜×’×•×¨×™×”')), 1, 12),
  COALESCE(NULLIF(btrim(category), ''), '×œ×œ× ×§×˜×’×•×¨×™×”'),
  row_number() OVER (ORDER BY COALESCE(NULLIF(btrim(category), ''), '×œ×œ× ×§×˜×’×•×¨×™×”'))
FROM public.products
GROUP BY COALESCE(NULLIF(btrim(category), ''), '×œ×œ× ×§×˜×’×•×¨×™×”')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.item_categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS item_code text,
  ADD COLUMN IF NOT EXISTS unit_of_measure text NOT NULL DEFAULT '×™×—×™×“×”',
  ADD COLUMN IF NOT EXISTS can_be_ordered boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_be_replacement boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS maximum_quantity integer CHECK (maximum_quantity IS NULL OR maximum_quantity > 0);

UPDATE public.products p
SET category_id = c.id
FROM public.item_categories c
WHERE p.category_id IS NULL
  AND c.name = COALESCE(NULLIF(btrim(p.category), ''), '×œ×œ× ×§×˜×’×•×¨×™×”');

ALTER TABLE public.products ALTER COLUMN category_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_item_code_uniq
  ON public.products(lower(item_code)) WHERE item_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_category_active_idx
  ON public.products(category_id, active, can_be_ordered);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.item_categories(id) ON DELETE RESTRICT;
UPDATE public.order_items oi
SET category_id = p.category_id
FROM public.products p
WHERE oi.category_id IS NULL AND oi.product_id = p.id;

CREATE TYPE public.team_replacement_status AS ENUM (
  'held',
  'awaiting_return',
  'returned',
  'overdue',
  'lost_or_damaged'
);

CREATE TABLE IF NOT EXISTS public.team_replacement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 9999),
  received_from_name text NOT NULL CHECK (length(btrim(received_from_name)) BETWEEN 1 AND 150),
  received_from_phone text,
  received_from_unit text,
  received_date date NOT NULL,
  expected_return_date date,
  actual_return_date date,
  returned_to_name text,
  condition_received text,
  condition_returned text,
  status public.team_replacement_status NOT NULL DEFAULT 'held',
  serial_number text,
  notes text,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  returned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (expected_return_date IS NULL OR expected_return_date >= received_date),
  CHECK (actual_return_date IS NULL OR actual_return_date >= received_date),
  CHECK (
    (status = 'returned' AND actual_return_date IS NOT NULL AND returned_to_name IS NOT NULL)
    OR status <> 'returned'
  )
);

CREATE INDEX IF NOT EXISTS team_replacement_items_team_status_idx
  ON public.team_replacement_items(team_id, status, expected_return_date);
CREATE INDEX IF NOT EXISTS team_replacement_items_search_idx
  ON public.team_replacement_items(team_id, received_from_name, serial_number);

CREATE TABLE IF NOT EXISTS public.team_replacement_item_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replacement_item_id uuid NOT NULL REFERENCES public.team_replacement_items(id) ON DELETE RESTRICT,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('created','updated','returned','return_undone','marked_lost_or_damaged')),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.item_catalog_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  suggested_name text NOT NULL CHECK (length(btrim(suggested_name)) BETWEEN 2 AND 150),
  suggested_category_id uuid REFERENCES public.item_categories(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 3 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','added_to_catalog')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.current_user_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.validate_catalog_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE category_active boolean;
BEGIN
  SELECT is_active INTO category_active FROM public.item_categories WHERE id = NEW.category_id;
  IF category_active IS NULL OR (NEW.active AND category_active IS DISTINCT FROM true) THEN
    RAISE EXCEPTION 'Product category must be active';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS products_validate_catalog ON public.products;
CREATE TRIGGER products_validate_catalog
  BEFORE INSERT OR UPDATE OF category_id, active ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.validate_catalog_product();

DROP TRIGGER IF EXISTS item_categories_touch ON public.item_categories;
CREATE TRIGGER item_categories_touch
  BEFORE UPDATE ON public.item_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS team_replacement_items_touch ON public.team_replacement_items;
CREATE TRIGGER team_replacement_items_touch
  BEFORE UPDATE ON public.team_replacement_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_replacement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_replacement_item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_catalog_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.item_categories TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.team_replacement_items TO authenticated;
GRANT SELECT, INSERT ON public.team_replacement_item_history TO authenticated;
GRANT SELECT, INSERT ON public.item_catalog_requests TO authenticated;
GRANT ALL ON public.item_categories, public.team_replacement_items,
  public.team_replacement_item_history, public.item_catalog_requests TO service_role;

DROP POLICY IF EXISTS "members read active item categories" ON public.item_categories;
CREATE POLICY "members read active item categories"
  ON public.item_categories FOR SELECT TO authenticated
  USING (is_active OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN'));
DROP POLICY IF EXISTS "catalog managers manage item categories" ON public.item_categories;
CREATE POLICY "catalog managers manage item categories"
  ON public.item_categories FOR ALL TO authenticated
  USING (public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN'))
  WITH CHECK (public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN'));

DROP POLICY IF EXISTS "members read own team replacement items" ON public.team_replacement_items;
CREATE POLICY "members read own team replacement items"
  ON public.team_replacement_items FOR SELECT TO authenticated
  USING (team_id = public.current_user_team_id() OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN'));
DROP POLICY IF EXISTS "members create own team replacement items" ON public.team_replacement_items;
CREATE POLICY "members create own team replacement items"
  ON public.team_replacement_items FOR INSERT TO authenticated
  WITH CHECK (team_id = public.current_user_team_id() AND user_id = auth.uid());
DROP POLICY IF EXISTS "members update own team replacement items" ON public.team_replacement_items;
CREATE POLICY "members update own team replacement items"
  ON public.team_replacement_items FOR UPDATE TO authenticated
  USING (team_id = public.current_user_team_id())
  WITH CHECK (team_id = public.current_user_team_id());

DROP POLICY IF EXISTS "members read own team replacement history" ON public.team_replacement_item_history;
CREATE POLICY "members read own team replacement history"
  ON public.team_replacement_item_history FOR SELECT TO authenticated
  USING (team_id = public.current_user_team_id() OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN'));
DROP POLICY IF EXISTS "members append own team replacement history" ON public.team_replacement_item_history;
CREATE POLICY "members append own team replacement history"
  ON public.team_replacement_item_history FOR INSERT TO authenticated
  WITH CHECK (team_id = public.current_user_team_id() AND actor_user_id = auth.uid());

DROP POLICY IF EXISTS "members manage own catalog requests" ON public.item_catalog_requests;
CREATE POLICY "members manage own catalog requests"
  ON public.item_catalog_requests FOR SELECT TO authenticated
  USING (team_id = public.current_user_team_id() OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN'));
DROP POLICY IF EXISTS "members create own catalog requests" ON public.item_catalog_requests;
CREATE POLICY "members create own catalog requests"
  ON public.item_catalog_requests FOR INSERT TO authenticated
  WITH CHECK (
    team_id = public.current_user_team_id()
    AND requested_by = auth.uid()
    AND status = 'pending'
  );
DROP POLICY IF EXISTS "catalog managers review requests" ON public.item_catalog_requests;
CREATE POLICY "catalog managers review requests"
  ON public.item_catalog_requests FOR UPDATE TO authenticated
  USING (public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN'))
  WITH CHECK (public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN'));

INSERT INTO storage.buckets(id, name, public)
VALUES ('replacement-attachments', 'replacement-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "members upload replacement attachments" ON storage.objects;
CREATE POLICY "members upload replacement attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'replacement-attachments'
    AND (storage.foldername(name))[1] = public.current_user_team_id()::text
  );
DROP POLICY IF EXISTS "members read own replacement attachments" ON storage.objects;
CREATE POLICY "members read own replacement attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'replacement-attachments'
    AND (
      (storage.foldername(name))[1] = public.current_user_team_id()::text
      OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN')
    )
  );

