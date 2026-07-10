-- Unit-scoped catalog and inventory.
-- Uses the existing public.teams table as the unit/tenant boundary.

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (upper(role) IN ('OWNER', 'WORK_MANAGER', 'ADMIN', 'STAFF', 'USER', 'RASP'));

CREATE INDEX IF NOT EXISTS team_members_user_active_idx
  ON public.team_members(user_id, is_active);

ALTER TABLE public.item_categories
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE RESTRICT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE RESTRICT;

ALTER TABLE public.replacement_products
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE RESTRICT;

DO $$
DECLARE
  default_team_id uuid;
BEGIN
  SELECT id INTO default_team_id
  FROM public.teams
  ORDER BY active DESC, created_at ASC NULLS LAST, id ASC
  LIMIT 1;

  IF default_team_id IS NULL THEN
    INSERT INTO public.teams(name, pin, monthly_limit, active)
    VALUES ('Default Unit', '000000', 0, true)
    RETURNING id INTO default_team_id;
  END IF;

  UPDATE public.team_members
  SET role = CASE
    WHEN upper(role) IN ('OWNER', 'WORK_MANAGER', 'ADMIN', 'STAFF', 'USER', 'RASP') THEN upper(role)
    ELSE 'USER'
  END,
  is_active = COALESCE(is_active, true)
  WHERE role IS NULL OR role <> upper(role) OR is_active IS NULL;

  UPDATE public.item_categories
  SET team_id = default_team_id
  WHERE team_id IS NULL;

  UPDATE public.products
  SET team_id = default_team_id
  WHERE team_id IS NULL;

  UPDATE public.replacement_products
  SET team_id = default_team_id
  WHERE team_id IS NULL;
END
$$;

ALTER TABLE public.item_categories
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.products
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.replacement_products
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.item_categories
  DROP CONSTRAINT IF EXISTS item_categories_code_key;

DROP INDEX IF EXISTS products_item_code_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS item_categories_team_code_uniq
  ON public.item_categories(team_id, lower(code));

CREATE INDEX IF NOT EXISTS item_categories_team_active_idx
  ON public.item_categories(team_id, is_active, display_order, name);

CREATE UNIQUE INDEX IF NOT EXISTS products_team_item_code_uniq
  ON public.products(team_id, lower(item_code))
  WHERE item_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS products_team_active_idx
  ON public.products(team_id, active, can_be_ordered, name);

CREATE INDEX IF NOT EXISTS products_team_category_idx
  ON public.products(team_id, category_id, active);

CREATE INDEX IF NOT EXISTS replacement_products_team_active_idx
  ON public.replacement_products(team_id, active, name);

CREATE OR REPLACE FUNCTION public.current_user_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id
  FROM public.team_members
  WHERE user_id = auth.uid()
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.validate_catalog_product()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  category_active boolean;
  category_team_id uuid;
BEGIN
  SELECT is_active, team_id
  INTO category_active, category_team_id
  FROM public.item_categories
  WHERE id = NEW.category_id;

  IF NEW.team_id IS NULL THEN
    RAISE EXCEPTION 'Product must belong to a unit';
  END IF;

  IF category_active IS NULL THEN
    RAISE EXCEPTION 'Product category was not found';
  END IF;

  IF category_team_id IS DISTINCT FROM NEW.team_id THEN
    RAISE EXCEPTION 'Product category must belong to the same unit';
  END IF;

  IF NEW.active AND category_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Product category must be active';
  END IF;

  RETURN NEW;
END
$$;

