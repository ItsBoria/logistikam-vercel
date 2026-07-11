-- Multi-Unit integrity repair.
-- Safe/idempotent. This migration repairs mismatched non-null unit_id values,
-- assigns approved Unit creators as UNIT_OWNER, prevents request spam, and
-- blocks accidental removal of the final active UNIT_OWNER in a Unit.

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

  -- Team-owned tables must inherit the Unit from their Team, even when unit_id
  -- already has an incorrect non-null value.
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
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'unit_id'
      ) INTO has_unit_id;

      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
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

  -- Replacement history has had different FK names across versions.
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
        AND h.unit_id IS DISTINCT FROM tri.unit_id;
    END IF;

    IF has_team_replacement_item_id THEN
      UPDATE public.team_replacement_item_history h
      SET unit_id = tri.unit_id
      FROM public.team_replacement_items tri
      WHERE h.team_replacement_item_id = tri.id
        AND h.unit_id IS DISTINCT FROM tri.unit_id;
    END IF;

    UPDATE public.team_replacement_item_history
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  -- Missions inherit from mission_weeks where the schema supports it.
  IF to_regclass('public.mission_weeks') IS NOT NULL THEN
    UPDATE public.mission_weeks
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  IF to_regclass('public.missions') IS NOT NULL
     AND to_regclass('public.mission_weeks') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'missions' AND column_name = 'week_id'
     ) THEN
    UPDATE public.missions m
    SET unit_id = mw.unit_id
    FROM public.mission_weeks mw
    WHERE m.week_id = mw.id
      AND m.unit_id IS DISTINCT FROM mw.unit_id;
  END IF;

  IF to_regclass('public.missions') IS NOT NULL THEN
    UPDATE public.missions
    SET unit_id = original_unit_id
    WHERE unit_id IS NULL;
  END IF;

  -- Repair approved Unit-registration requests whose nominated admin did not
  -- receive Unit ownership.
  IF to_regclass('public.unit_registration_requests') IS NOT NULL THEN
    WITH ranked AS (
      SELECT
        id,
        row_number() OVER (
          PARTITION BY requested_admin_user_id
          ORDER BY created_at ASC, id ASC
        ) AS rn
      FROM public.unit_registration_requests
      WHERE status = 'pending'
        AND requested_admin_user_id IS NOT NULL
    )
    UPDATE public.unit_registration_requests r
    SET status = 'cancelled',
        review_notes = concat_ws(E'\n', nullif(r.review_notes, ''), 'Cancelled by integrity repair: duplicate pending request for the same admin user.'),
        updated_at = now()
    FROM ranked
    WHERE r.id = ranked.id
      AND ranked.rn > 1;

    WITH ranked AS (
      SELECT
        id,
        row_number() OVER (
          PARTITION BY lower(requested_admin_email)
          ORDER BY created_at ASC, id ASC
        ) AS rn
      FROM public.unit_registration_requests
      WHERE status = 'pending'
        AND requested_admin_email IS NOT NULL
    )
    UPDATE public.unit_registration_requests r
    SET status = 'cancelled',
        review_notes = concat_ws(E'\n', nullif(r.review_notes, ''), 'Cancelled by integrity repair: duplicate pending request for the same admin email.'),
        updated_at = now()
    FROM ranked
    WHERE r.id = ranked.id
      AND ranked.rn > 1;

    WITH ranked AS (
      SELECT
        id,
        row_number() OVER (
          PARTITION BY lower(requested_unit_code)
          ORDER BY created_at ASC, id ASC
        ) AS rn
      FROM public.unit_registration_requests
      WHERE status = 'pending'
        AND requested_unit_code IS NOT NULL
    )
    UPDATE public.unit_registration_requests r
    SET status = 'cancelled',
        review_notes = concat_ws(E'\n', nullif(r.review_notes, ''), 'Cancelled by integrity repair: duplicate pending request for the same unit code.'),
        updated_at = now()
    FROM ranked
    WHERE r.id = ranked.id
      AND ranked.rn > 1;

    WITH ranked AS (
      SELECT
        id,
        row_number() OVER (
          PARTITION BY lower(requested_unit_name)
          ORDER BY created_at ASC, id ASC
        ) AS rn
      FROM public.unit_registration_requests
      WHERE status = 'pending'
        AND requested_unit_name IS NOT NULL
    )
    UPDATE public.unit_registration_requests r
    SET status = 'cancelled',
        review_notes = concat_ws(E'\n', nullif(r.review_notes, ''), 'Cancelled by integrity repair: duplicate pending request for the same unit name.'),
        updated_at = now()
    FROM ranked
    WHERE r.id = ranked.id
      AND ranked.rn > 1;

    INSERT INTO public.unit_memberships(user_id, unit_id, role, is_active, updated_at)
    SELECT requested_admin_user_id, created_unit_id, 'UNIT_OWNER', true, now()
    FROM public.unit_registration_requests
    WHERE status = 'approved'
      AND requested_admin_user_id IS NOT NULL
      AND created_unit_id IS NOT NULL
    ON CONFLICT (user_id, unit_id)
    DO UPDATE SET role = 'UNIT_OWNER', is_active = true, updated_at = now();
  END IF;

  IF to_regclass('public.audit_log') IS NOT NULL THEN
    INSERT INTO public.audit_log(action_type, target_type, performed_by_user_id, new_value, created_at)
    VALUES ('ORIGINAL_UNIT_DATA_REPAIR', 'migration', NULL, jsonb_build_object('migration', '20260711190000_unit_integrity_repair_and_constraints'), now());
  END IF;
END $$;

DO $$
DECLARE
  constraint_name text;
BEGIN
  IF to_regclass('public.unit_access_requests') IS NOT NULL THEN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'unit_access_requests'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%requested_role%';

    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.unit_access_requests DROP CONSTRAINT %I', constraint_name);
    END IF;

    ALTER TABLE public.unit_access_requests
      ADD CONSTRAINT unit_access_requests_requested_role_check
      CHECK (requested_role IN ('UNIT_USER', 'LOGISTICS_NCO', 'WORK_MANAGER', 'UNIT_ADMIN'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS unit_memberships_user_unit_unique
  ON public.unit_memberships(user_id, unit_id);

CREATE UNIQUE INDEX IF NOT EXISTS team_memberships_user_team_unique
  ON public.team_memberships(user_id, team_id);

CREATE UNIQUE INDEX IF NOT EXISTS unit_access_requests_pending_unique
  ON public.unit_access_requests(user_id, unit_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS unit_registration_pending_admin_user_unique
  ON public.unit_registration_requests(requested_admin_user_id)
  WHERE status = 'pending' AND requested_admin_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unit_registration_pending_admin_email_unique
  ON public.unit_registration_requests(lower(requested_admin_email))
  WHERE status = 'pending' AND requested_admin_email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unit_registration_pending_unit_code_unique
  ON public.unit_registration_requests(lower(requested_unit_code))
  WHERE status = 'pending' AND requested_unit_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unit_registration_pending_unit_name_unique
  ON public.unit_registration_requests(lower(requested_unit_name))
  WHERE status = 'pending' AND requested_unit_name IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_final_unit_owner_removal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  remaining_owner_count integer;
  checked_unit_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    checked_unit_id := OLD.unit_id;
    IF OLD.role <> 'UNIT_OWNER' OR OLD.is_active IS DISTINCT FROM true THEN
      RETURN OLD;
    END IF;
  ELSE
    checked_unit_id := OLD.unit_id;
    IF OLD.role <> 'UNIT_OWNER'
       OR OLD.is_active IS DISTINCT FROM true
       OR (NEW.role = 'UNIT_OWNER' AND NEW.is_active IS true AND NEW.unit_id = OLD.unit_id) THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT count(*) INTO remaining_owner_count
  FROM public.unit_memberships
  WHERE unit_id = checked_unit_id
    AND role = 'UNIT_OWNER'
    AND is_active = true
    AND id <> OLD.id;

  IF remaining_owner_count = 0 THEN
    RAISE EXCEPTION 'Cannot remove the final active UNIT_OWNER for this Unit';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_final_unit_owner_removal_trigger ON public.unit_memberships;
CREATE TRIGGER prevent_final_unit_owner_removal_trigger
BEFORE UPDATE OR DELETE ON public.unit_memberships
FOR EACH ROW
EXECUTE FUNCTION public.prevent_final_unit_owner_removal();

CREATE OR REPLACE FUNCTION public.enforce_team_membership_unit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  real_unit_id uuid;
BEGIN
  SELECT unit_id INTO real_unit_id
  FROM public.teams
  WHERE id = NEW.team_id;

  IF real_unit_id IS NULL THEN
    RAISE EXCEPTION 'Team does not exist or has no Unit';
  END IF;

  NEW.unit_id := real_unit_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_team_membership_unit_trigger ON public.team_memberships;
CREATE TRIGGER enforce_team_membership_unit_trigger
BEFORE INSERT OR UPDATE ON public.team_memberships
FOR EACH ROW
EXECUTE FUNCTION public.enforce_team_membership_unit();

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

GRANT SELECT ON public.unit_integrity_validation TO authenticated;
