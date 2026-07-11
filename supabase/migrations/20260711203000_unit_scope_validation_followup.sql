-- Follow-up multi-Unit validation and repair.
-- Safe/idempotent. Repairs non-null mismatches through parent Team/Order/Request
-- ownership and provides validation/count reports for the ORIGINAL Unit.

DO $$
DECLARE
  original_unit_id uuid;
  tbl text;
  has_unit_id boolean;
  has_team_id boolean;
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

  UPDATE public.teams
  SET unit_id = original_unit_id
  WHERE unit_id IS NULL;

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
    'construction_faults',
    'team_products'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'unit_id'
      ) INTO has_unit_id;

      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'team_id'
      ) INTO has_team_id;

      IF has_unit_id AND has_team_id THEN
        EXECUTE format(
          'UPDATE public.%I x
           SET unit_id = t.unit_id
           FROM public.teams t
           WHERE x.team_id = t.id
             AND t.unit_id IS NOT NULL
             AND x.unit_id IS DISTINCT FROM t.unit_id',
          tbl
        );
      END IF;

      IF has_unit_id THEN
        EXECUTE format('UPDATE public.%I SET unit_id = $1 WHERE unit_id IS NULL', tbl)
        USING original_unit_id;
      END IF;
    END IF;
  END LOOP;

  IF to_regclass('public.order_items') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'order_items' AND column_name = 'unit_id'
     ) THEN
    UPDATE public.order_items oi
    SET unit_id = o.unit_id
    FROM public.orders o
    WHERE oi.order_id = o.id
      AND oi.unit_id IS DISTINCT FROM o.unit_id;

    UPDATE public.order_items
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  IF to_regclass('public.replacement_request_items') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'replacement_request_items' AND column_name = 'unit_id'
     ) THEN
    UPDATE public.replacement_request_items ri
    SET unit_id = rr.unit_id
    FROM public.replacement_requests rr
    WHERE ri.request_id = rr.id
      AND ri.unit_id IS DISTINCT FROM rr.unit_id;

    UPDATE public.replacement_request_items
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  IF to_regclass('public.budget_policies') IS NOT NULL THEN
    ALTER TABLE public.budget_policies
      ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;

    UPDATE public.budget_policies
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  IF to_regclass('public.audit_log') IS NOT NULL THEN
    INSERT INTO public.audit_log(action_type, target_type, performed_by_user_id, new_value, created_at)
    VALUES (
      'UNIT_SCOPE_VALIDATION_FOLLOWUP',
      'migration',
      NULL,
      jsonb_build_object('migration', '20260711203000_unit_scope_validation_followup', 'original_unit_id', original_unit_id),
      now()
    );
  END IF;
END $$;

CREATE OR REPLACE VIEW public.unit_integrity_validation AS
SELECT 'team_without_unit' AS issue, id::text AS entity_id, name AS details
FROM public.teams
WHERE unit_id IS NULL
UNION ALL
SELECT 'product_without_unit', id::text, name
FROM public.products
WHERE unit_id IS NULL
UNION ALL
SELECT 'product_team_unit_mismatch', p.id::text, p.name
FROM public.products p
JOIN public.teams t ON t.id = p.team_id
WHERE p.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'category_without_unit', id::text, name
FROM public.item_categories
WHERE unit_id IS NULL
UNION ALL
SELECT 'category_team_unit_mismatch', c.id::text, c.name
FROM public.item_categories c
JOIN public.teams t ON t.id = c.team_id
WHERE c.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'replacement_product_without_unit', id::text, name
FROM public.replacement_products
WHERE unit_id IS NULL
UNION ALL
SELECT 'replacement_product_team_unit_mismatch', rp.id::text, rp.name
FROM public.replacement_products rp
JOIN public.teams t ON t.id = rp.team_id
WHERE rp.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'order_without_unit', id::text, status::text
FROM public.orders
WHERE unit_id IS NULL
UNION ALL
SELECT 'order_team_unit_mismatch', o.id::text, o.status::text
FROM public.orders o
JOIN public.teams t ON t.id = o.team_id
WHERE o.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'order_item_missing_parent', oi.id::text, oi.name
FROM public.order_items oi
LEFT JOIN public.orders o ON o.id = oi.order_id
WHERE o.id IS NULL
UNION ALL
SELECT 'budget_period_team_unit_mismatch', bp.id::text, bp.team_id::text
FROM public.budget_periods bp
JOIN public.teams t ON t.id = bp.team_id
WHERE bp.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'replacement_request_without_unit', rr.id::text, rr.status::text
FROM public.replacement_requests rr
WHERE rr.unit_id IS NULL
UNION ALL
SELECT 'replacement_request_team_unit_mismatch', rr.id::text, rr.status::text
FROM public.replacement_requests rr
JOIN public.teams t ON t.id = rr.team_id
WHERE rr.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'team_replacement_item_team_unit_mismatch', tri.id::text, tri.id::text
FROM public.team_replacement_items tri
JOIN public.teams t ON t.id = tri.team_id
WHERE tri.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'team_membership_unit_mismatch', tm.id::text, tm.user_id::text
FROM public.team_memberships tm
JOIN public.teams t ON t.id = tm.team_id
WHERE tm.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'unit_without_active_owner', u.id::text, u.name
FROM public.units u
WHERE u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.unit_memberships um
    WHERE um.unit_id = u.id
      AND um.role = 'UNIT_OWNER'
      AND um.is_active = true
  );

CREATE OR REPLACE VIEW public.original_unit_data_counts AS
WITH original AS (
  SELECT id
  FROM public.units
  WHERE code = 'ORIGINAL'
  ORDER BY created_at
  LIMIT 1
)
SELECT 'teams' AS entity, count(*)::bigint AS count
FROM public.teams, original
WHERE teams.unit_id = original.id
UNION ALL
SELECT 'products', count(*)::bigint
FROM public.products, original
WHERE products.unit_id = original.id
UNION ALL
SELECT 'item_categories', count(*)::bigint
FROM public.item_categories, original
WHERE item_categories.unit_id = original.id
UNION ALL
SELECT 'replacement_products', count(*)::bigint
FROM public.replacement_products, original
WHERE replacement_products.unit_id = original.id
UNION ALL
SELECT 'orders', count(*)::bigint
FROM public.orders, original
WHERE orders.unit_id = original.id
UNION ALL
SELECT 'replacement_requests', count(*)::bigint
FROM public.replacement_requests, original
WHERE replacement_requests.unit_id = original.id
UNION ALL
SELECT 'budget_periods', count(*)::bigint
FROM public.budget_periods, original
WHERE budget_periods.unit_id = original.id
UNION ALL
SELECT 'team_replacement_items', count(*)::bigint
FROM public.team_replacement_items, original
WHERE team_replacement_items.unit_id = original.id
UNION ALL
SELECT 'active_unit_owners', count(*)::bigint
FROM public.unit_memberships, original
WHERE unit_memberships.unit_id = original.id
  AND unit_memberships.role = 'UNIT_OWNER'
  AND unit_memberships.is_active = true;

GRANT SELECT ON public.unit_integrity_validation TO authenticated;
GRANT SELECT ON public.original_unit_data_counts TO authenticated;
