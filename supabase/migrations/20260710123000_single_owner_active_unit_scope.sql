-- Role model refinement:
-- 1. OWNER is the single global app owner.
-- 2. ADMIN / WORK_MANAGER are unit admin roles.
-- 3. USER/RASP is the client/unit user level.
--
-- Owner can list all units, but admin data screens must operate through the
-- selected active unit stored in public.team_members for the signed-in user.

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_active_owner_idx
  ON public.user_roles ((true))
  WHERE role = 'OWNER'::public.app_role
    AND is_active = true;

ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (upper(role) IN ('OWNER', 'WORK_MANAGER', 'ADMIN', 'STAFF', 'USER', 'RASP'));

UPDATE public.team_members
SET role = CASE
  WHEN upper(role) IN ('OWNER', 'WORK_MANAGER', 'ADMIN', 'STAFF', 'USER', 'RASP') THEN upper(role)
  ELSE 'USER'
END,
is_active = COALESCE(is_active, true),
updated_at = now()
WHERE role IS NULL
   OR role <> upper(role)
   OR is_active IS NULL;
