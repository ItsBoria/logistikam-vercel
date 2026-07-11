-- Attach all pre-multitenant legacy data to the original unit.
-- Safe/idempotent: rows with a valid team inherit that team's unit; orphaned legacy
-- rows fall back to the ORIGINAL unit so the first/original admin can see them.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  original_unit_id uuid;
  tbl text;
  has_unit_id boolean;
  has_team_id boolean;
  has_replacement_item_id boolean;
  has_team_replacement_item_id boolean;
BEGIN
  SELECT id INTO original_unit_id
  FROM public.units
  WHERE code = 'ORIGINAL'
  ORDER BY created_at
  LIMIT 1;

  IF original_unit_id IS NULL THEN
    INSERT INTO public.units(name, code, active, status, setup_status)
    VALUES ('היחידה המקורית', 'ORIGINAL', true, 'active', 'active')
    RETURNING id INTO original_unit_id;
  END IF;

  IF to_regclass('public.teams') IS NOT NULL THEN
    UPDATE public.teams
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  -- Add unit_id where optional legacy module tables exist but were created before Units.
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
    'audit_log',
    'team_products'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'unit_id'
      ) INTO has_unit_id;

      IF NOT has_unit_id THEN
        EXECUTE format(
          'ALTER TABLE public.%I ADD COLUMN unit_id uuid REFERENCES public.units(id) ON DELETE RESTRICT',
          tbl
        );
      END IF;
    END IF;
  END LOOP;

  -- Team-owned legacy tables: derive unit from team when possible, otherwise ORIGINAL.
  FOREACH tbl IN ARRAY ARRAY[
    'products',
    'item_categories',
    'replacement_products',
    'orders',
    'replacement_requests',
    'team_replacement_items',
    'item_catalog_requests',
    'budget_periods',
    'team_budget_alerts',
    'push_subscriptions',
    'construction_faults'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'team_id'
      ) INTO has_team_id;

      IF has_team_id THEN
        EXECUTE format(
          'UPDATE public.%I x SET unit_id = t.unit_id FROM public.teams t WHERE x.team_id = t.id AND x.unit_id IS NULL',
          tbl
        );
      END IF;

      EXECUTE format(
        'UPDATE public.%I SET unit_id = $1 WHERE unit_id IS NULL',
        tbl
      ) USING original_unit_id;
    END IF;
  END LOOP;

  -- Replacement item history had different FK column names across versions.
  IF to_regclass('public.team_replacement_item_history') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'team_replacement_item_history' AND column_name = 'replacement_item_id'
    ) INTO has_replacement_item_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'team_replacement_item_history' AND column_name = 'team_replacement_item_id'
    ) INTO has_team_replacement_item_id;

    IF has_replacement_item_id THEN
      UPDATE public.team_replacement_item_history h
      SET unit_id = tri.unit_id
      FROM public.team_replacement_items tri
      WHERE h.replacement_item_id = tri.id
        AND h.unit_id IS NULL;
    END IF;

    IF has_team_replacement_item_id THEN
      UPDATE public.team_replacement_item_history h
      SET unit_id = tri.unit_id
      FROM public.team_replacement_items tri
      WHERE h.team_replacement_item_id = tri.id
        AND h.unit_id IS NULL;
    END IF;

    UPDATE public.team_replacement_item_history
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  -- Mission weeks are Unit-owned. Missions inherit from their week when possible.
  IF to_regclass('public.mission_weeks') IS NOT NULL THEN
    UPDATE public.mission_weeks
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  IF to_regclass('public.missions') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'week_id'
    ) AND to_regclass('public.mission_weeks') IS NOT NULL THEN
      UPDATE public.missions m
      SET unit_id = mw.unit_id
      FROM public.mission_weeks mw
      WHERE m.week_id = mw.id
        AND m.unit_id IS NULL;
    END IF;

    UPDATE public.missions
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  -- Pure Unit-owned / global legacy tables are attached to ORIGINAL.
  FOREACH tbl IN ARRAY ARRAY[
    'admin_push_subscriptions',
    'audit_log'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format(
        'UPDATE public.%I SET unit_id = $1 WHERE unit_id IS NULL',
        tbl
      ) USING original_unit_id;
    END IF;
  END LOOP;

  -- Team/product join rows must match both sides where possible.
  IF to_regclass('public.team_products') IS NOT NULL THEN
    UPDATE public.team_products tp
    SET unit_id = t.unit_id
    FROM public.teams t
    WHERE tp.team_id = t.id
      AND tp.unit_id IS NULL;

    UPDATE public.team_products tp
    SET unit_id = p.unit_id
    FROM public.products p
    WHERE tp.product_id = p.id
      AND tp.unit_id IS NULL;

    UPDATE public.team_products
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;
END $$;

CREATE OR REPLACE VIEW public.original_unit_legacy_backfill_validation AS
SELECT 'team_without_unit' AS issue, id::text AS entity_id, name AS details
FROM public.teams
WHERE unit_id IS NULL
UNION ALL
SELECT 'product_without_unit', id::text, name
FROM public.products
WHERE unit_id IS NULL
UNION ALL
SELECT 'category_without_unit', id::text, name
FROM public.item_categories
WHERE unit_id IS NULL
UNION ALL
SELECT 'replacement_product_without_unit', id::text, name
FROM public.replacement_products
WHERE unit_id IS NULL
UNION ALL
SELECT 'order_without_unit', id::text, status::text
FROM public.orders
WHERE unit_id IS NULL
UNION ALL
SELECT 'replacement_request_without_unit', id::text, status::text
FROM public.replacement_requests
WHERE unit_id IS NULL;

GRANT SELECT ON public.original_unit_legacy_backfill_validation TO authenticated;
