-- Correct tenant foundation: Units are organizations, Teams are customer groups inside Units.
-- This migration is additive and preserves existing production data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  logo_url text,
  cover_image_url text,
  contact_phone text,
  accent_color text,
  enabled_modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id) ON DELETE RESTRICT;

DO $$
DECLARE
  original_unit_id uuid;
BEGIN
  SELECT id INTO original_unit_id
  FROM public.units
  WHERE code = 'ORIGINAL'
  LIMIT 1;

  IF original_unit_id IS NULL THEN
    INSERT INTO public.units(name, code, active)
    VALUES ('היחידה המקורית', 'ORIGINAL', true)
    RETURNING id INTO original_unit_id;
  END IF;

  UPDATE public.teams
  SET unit_id = original_unit_id
  WHERE unit_id IS NULL;
END $$;

ALTER TABLE public.teams
  ALTER COLUMN unit_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS teams_unit_id_idx ON public.teams(unit_id);
CREATE INDEX IF NOT EXISTS teams_unit_active_idx ON public.teams(unit_id, active, name);

CREATE TABLE IF NOT EXISTS public.unit_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('PLATFORM_OWNER', 'UNIT_OWNER', 'WORK_MANAGER', 'LOGISTICS_NCO', 'UNIT_ADMIN', 'UNIT_USER', 'OWNER', 'ADMIN', 'USER')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, unit_id)
);

CREATE INDEX IF NOT EXISTS unit_memberships_user_active_idx
  ON public.unit_memberships(user_id, is_active);
CREATE INDEX IF NOT EXISTS unit_memberships_unit_role_idx
  ON public.unit_memberships(unit_id, role, is_active);

CREATE TABLE IF NOT EXISTS public.team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'TEAM_MEMBER' CHECK (role IN ('TEAM_MANAGER', 'TEAM_MEMBER', 'RASP', 'USER')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_id)
);

CREATE INDEX IF NOT EXISTS team_memberships_user_active_idx
  ON public.team_memberships(user_id, is_active);
CREATE INDEX IF NOT EXISTS team_memberships_unit_team_idx
  ON public.team_memberships(unit_id, team_id, is_active);

CREATE OR REPLACE FUNCTION public.assert_team_membership_unit_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actual_unit_id uuid;
BEGIN
  SELECT unit_id INTO actual_unit_id FROM public.teams WHERE id = NEW.team_id;
  IF actual_unit_id IS NULL THEN
    RAISE EXCEPTION 'Team % does not exist', NEW.team_id;
  END IF;
  IF actual_unit_id IS DISTINCT FROM NEW.unit_id THEN
    RAISE EXCEPTION 'Team % does not belong to unit %', NEW.team_id, NEW.unit_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS team_memberships_unit_match_trg ON public.team_memberships;
CREATE TRIGGER team_memberships_unit_match_trg
BEFORE INSERT OR UPDATE OF unit_id, team_id ON public.team_memberships
FOR EACH ROW EXECUTE FUNCTION public.assert_team_membership_unit_match();

CREATE TABLE IF NOT EXISTS public.user_active_contexts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  active_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill unit memberships from existing global roles and legacy team_members.
INSERT INTO public.unit_memberships(user_id, unit_id, role, is_active)
SELECT DISTINCT ur.user_id, u.id, 'PLATFORM_OWNER', true
FROM public.user_roles ur
CROSS JOIN public.units u
WHERE ur.is_active = true
  AND upper(ur.role::text) = 'OWNER'
ON CONFLICT (user_id, unit_id) DO UPDATE
SET role = EXCLUDED.role, is_active = true, updated_at = now();

INSERT INTO public.unit_memberships(user_id, unit_id, role, is_active)
SELECT DISTINCT tm.user_id, t.unit_id,
  CASE
    WHEN upper(coalesce(tm.role::text, '')) = 'WORK_MANAGER' THEN 'WORK_MANAGER'
    WHEN upper(coalesce(tm.role::text, '')) IN ('ADMIN', 'STAFF') THEN 'LOGISTICS_NCO'
    ELSE 'UNIT_USER'
  END,
  coalesce(tm.is_active, true)
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
ON CONFLICT (user_id, unit_id) DO UPDATE
SET role = EXCLUDED.role, is_active = EXCLUDED.is_active, updated_at = now();

INSERT INTO public.team_memberships(user_id, unit_id, team_id, role, is_active)
SELECT DISTINCT tm.user_id, t.unit_id, tm.team_id,
  CASE
    WHEN upper(coalesce(tm.role::text, '')) IN ('USER', '') THEN 'RASP'
    ELSE 'TEAM_MANAGER'
  END,
  coalesce(tm.is_active, true)
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id
ON CONFLICT (user_id, team_id) DO UPDATE
SET unit_id = EXCLUDED.unit_id, role = EXCLUDED.role, is_active = EXCLUDED.is_active, updated_at = now();

-- Add unit_id to existing Unit-owned and Unit+Team-owned tables. Dynamic SQL keeps
-- the migration safe when older customer databases are missing optional modules.
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'products',
    'item_categories',
    'replacement_products',
    'orders',
    'replacement_requests',
    'team_replacement_items',
    'team_replacement_item_history',
    'item_catalog_requests',
    'budget_periods',
    'team_budget_alerts',
    'push_subscriptions',
    'mission_weeks',
    'missions',
    'construction_faults',
    'admin_push_subscriptions',
    'audit_log'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id) ON DELETE RESTRICT', tbl);
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.products') IS NOT NULL THEN
    UPDATE public.products p SET unit_id = t.unit_id FROM public.teams t WHERE p.team_id = t.id AND p.unit_id IS NULL;
    CREATE INDEX IF NOT EXISTS products_unit_active_idx ON public.products(unit_id, active, name);
  END IF;

  IF to_regclass('public.item_categories') IS NOT NULL THEN
    UPDATE public.item_categories c SET unit_id = t.unit_id FROM public.teams t WHERE c.team_id = t.id AND c.unit_id IS NULL;
    CREATE INDEX IF NOT EXISTS item_categories_unit_active_idx ON public.item_categories(unit_id, is_active, display_order, name);
  END IF;

  IF to_regclass('public.replacement_products') IS NOT NULL THEN
    UPDATE public.replacement_products rp SET unit_id = t.unit_id FROM public.teams t WHERE rp.team_id = t.id AND rp.unit_id IS NULL;
    CREATE INDEX IF NOT EXISTS replacement_products_unit_active_idx ON public.replacement_products(unit_id, active, name);
  END IF;

  IF to_regclass('public.orders') IS NOT NULL THEN
    UPDATE public.orders o SET unit_id = t.unit_id FROM public.teams t WHERE o.team_id = t.id AND o.unit_id IS NULL;
    CREATE INDEX IF NOT EXISTS orders_unit_team_created_idx ON public.orders(unit_id, team_id, created_at DESC);
  END IF;

  IF to_regclass('public.replacement_requests') IS NOT NULL THEN
    UPDATE public.replacement_requests rr SET unit_id = t.unit_id FROM public.teams t WHERE rr.team_id = t.id AND rr.unit_id IS NULL;
    CREATE INDEX IF NOT EXISTS replacement_requests_unit_team_created_idx ON public.replacement_requests(unit_id, team_id, created_at DESC);
  END IF;

  IF to_regclass('public.budget_periods') IS NOT NULL THEN
    UPDATE public.budget_periods bp SET unit_id = t.unit_id FROM public.teams t WHERE bp.team_id = t.id AND bp.unit_id IS NULL;
    CREATE INDEX IF NOT EXISTS budget_periods_unit_team_status_idx ON public.budget_periods(unit_id, team_id, status);
  END IF;

  IF to_regclass('public.team_budget_alerts') IS NOT NULL THEN
    UPDATE public.team_budget_alerts ba SET unit_id = t.unit_id FROM public.teams t WHERE ba.team_id = t.id AND ba.unit_id IS NULL;
  END IF;

  IF to_regclass('public.push_subscriptions') IS NOT NULL THEN
    UPDATE public.push_subscriptions ps SET unit_id = t.unit_id FROM public.teams t WHERE ps.team_id = t.id AND ps.unit_id IS NULL;
  END IF;

  IF to_regclass('public.team_replacement_items') IS NOT NULL THEN
    UPDATE public.team_replacement_items tri SET unit_id = t.unit_id FROM public.teams t WHERE tri.team_id = t.id AND tri.unit_id IS NULL;
  END IF;

  IF to_regclass('public.team_replacement_item_history') IS NOT NULL THEN
    UPDATE public.team_replacement_item_history h
    SET unit_id = tri.unit_id
    FROM public.team_replacement_items tri
    WHERE h.replacement_item_id = tri.id AND h.unit_id IS NULL;
  END IF;

  IF to_regclass('public.item_catalog_requests') IS NOT NULL THEN
    UPDATE public.item_catalog_requests icr SET unit_id = t.unit_id FROM public.teams t WHERE icr.team_id = t.id AND icr.unit_id IS NULL;
  END IF;

  IF to_regclass('public.mission_weeks') IS NOT NULL THEN
    UPDATE public.mission_weeks mw
    SET unit_id = (SELECT id FROM public.units WHERE code = 'ORIGINAL' LIMIT 1)
    WHERE mw.unit_id IS NULL;
    CREATE INDEX IF NOT EXISTS mission_weeks_unit_week_idx ON public.mission_weeks(unit_id, year, week);
  END IF;

  IF to_regclass('public.missions') IS NOT NULL THEN
    UPDATE public.missions m
    SET unit_id = mw.unit_id
    FROM public.mission_weeks mw
    WHERE m.week_id = mw.id AND m.unit_id IS NULL;
    CREATE INDEX IF NOT EXISTS missions_unit_week_idx ON public.missions(unit_id, week_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.team_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT true,
  stock integer,
  maximum_quantity integer,
  price_override numeric,
  monthly_limit integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, product_id)
);

CREATE OR REPLACE FUNCTION public.assert_team_product_unit_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  team_unit_id uuid;
  product_unit_id uuid;
BEGIN
  SELECT unit_id INTO team_unit_id FROM public.teams WHERE id = NEW.team_id;
  SELECT unit_id INTO product_unit_id FROM public.products WHERE id = NEW.product_id;
  IF team_unit_id IS DISTINCT FROM NEW.unit_id OR product_unit_id IS DISTINCT FROM NEW.unit_id THEN
    RAISE EXCEPTION 'Team/product/unit mismatch';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS team_products_unit_match_trg ON public.team_products;
CREATE TRIGGER team_products_unit_match_trg
BEFORE INSERT OR UPDATE OF unit_id, team_id, product_id ON public.team_products
FOR EACH ROW EXECUTE FUNCTION public.assert_team_product_unit_match();

-- Compatibility validation helpers for manual checks after CSV/migration work.
CREATE OR REPLACE VIEW public.unit_team_integrity_issues AS
SELECT 'team_without_unit' AS issue, t.id::text AS entity_id, t.name AS details
FROM public.teams t
WHERE t.unit_id IS NULL
UNION ALL
SELECT 'product_unit_mismatch', p.id::text, p.name
FROM public.products p
JOIN public.teams t ON t.id = p.team_id
WHERE p.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'order_unit_mismatch', o.id::text, o.status::text
FROM public.orders o
JOIN public.teams t ON t.id = o.team_id
WHERE o.unit_id IS DISTINCT FROM t.unit_id;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read their units" ON public.units;
CREATE POLICY "members read their units" ON public.units
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unit_memberships um
    WHERE um.unit_id = units.id
      AND um.user_id = auth.uid()
      AND um.is_active = true
  )
);

DROP POLICY IF EXISTS "users read own unit memberships" ON public.unit_memberships;
CREATE POLICY "users read own unit memberships" ON public.unit_memberships
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users read own team memberships" ON public.team_memberships;
CREATE POLICY "users read own team memberships" ON public.team_memberships
FOR SELECT TO authenticated
USING (user_id = auth.uid());

GRANT SELECT ON public.units, public.unit_memberships, public.team_memberships TO authenticated;
GRANT ALL ON public.units, public.unit_memberships, public.team_memberships, public.team_products TO service_role;
