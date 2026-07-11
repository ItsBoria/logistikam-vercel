-- Repair Units that still have no active UNIT_OWNER after the integrity repair.
-- Safe/idempotent. This does not invent arbitrary owners:
-- 1. ORIGINAL gets the existing global OWNER / platform owner.
-- 2. Any other Unit with an active admin-like membership but no UNIT_OWNER promotes
--    the strongest existing Unit admin to UNIT_OWNER.
-- 3. Units with no candidate remain visible in public.unit_integrity_validation.

DO $$
DECLARE
  original_unit_id uuid;
BEGIN
  SELECT id INTO original_unit_id
  FROM public.units
  WHERE code = 'ORIGINAL'
  ORDER BY created_at
  LIMIT 1;

  IF original_unit_id IS NOT NULL THEN
    INSERT INTO public.unit_memberships(user_id, unit_id, role, is_active, updated_at)
    SELECT ur.user_id, original_unit_id, 'UNIT_OWNER', true, now()
    FROM public.user_roles ur
    WHERE ur.role::text = 'OWNER'
      AND ur.is_active = true
      AND NOT EXISTS (
        SELECT 1
        FROM public.unit_memberships existing
        WHERE existing.user_id = ur.user_id
          AND existing.unit_id = original_unit_id
      )
    ON CONFLICT (user_id, unit_id)
    DO UPDATE SET role = 'UNIT_OWNER', is_active = true, updated_at = now();
  END IF;

  WITH units_without_owner AS (
    SELECT u.id AS unit_id
    FROM public.units u
    WHERE u.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.unit_memberships owner_membership
        WHERE owner_membership.unit_id = u.id
          AND owner_membership.role = 'UNIT_OWNER'
          AND owner_membership.is_active = true
      )
  ),
  ranked_candidates AS (
    SELECT
      um.id,
      um.user_id,
      um.unit_id,
      row_number() OVER (
        PARTITION BY um.unit_id
        ORDER BY
          CASE um.role
            WHEN 'PLATFORM_OWNER' THEN 100
            WHEN 'WORK_MANAGER' THEN 80
            WHEN 'UNIT_ADMIN' THEN 70
            WHEN 'LOGISTICS_NCO' THEN 60
            WHEN 'ADMIN' THEN 50
            ELSE 0
          END DESC,
          um.created_at ASC,
          um.id ASC
      ) AS rn
    FROM public.unit_memberships um
    JOIN units_without_owner uwo ON uwo.unit_id = um.unit_id
    WHERE um.is_active = true
      AND um.role IN ('PLATFORM_OWNER', 'WORK_MANAGER', 'UNIT_ADMIN', 'LOGISTICS_NCO', 'ADMIN')
  )
  UPDATE public.unit_memberships um
  SET role = 'UNIT_OWNER',
      is_active = true,
      updated_at = now()
  FROM ranked_candidates rc
  WHERE um.id = rc.id
    AND rc.rn = 1;

  IF to_regclass('public.audit_log') IS NOT NULL THEN
    INSERT INTO public.audit_log(action_type, target_type, performed_by_user_id, new_value, created_at)
    VALUES (
      'MISSING_UNIT_OWNER_REPAIR',
      'migration',
      NULL,
      jsonb_build_object('migration', '20260711193000_repair_missing_unit_owners'),
      now()
    );
  END IF;
END $$;
