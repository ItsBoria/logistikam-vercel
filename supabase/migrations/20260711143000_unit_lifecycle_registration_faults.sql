-- Unit lifecycle, registration requests, construction faults, and validation checks.
-- Additive only: preserves existing production data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS setup_status text NOT NULL DEFAULT 'pending_setup',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'units_status_check'
  ) THEN
    ALTER TABLE public.units
      ADD CONSTRAINT units_status_check
      CHECK (status IN ('pending', 'pending_setup', 'ready', 'active', 'inactive', 'deleted', 'rejected'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'units_setup_status_check'
  ) THEN
    ALTER TABLE public.units
      ADD CONSTRAINT units_setup_status_check
      CHECK (setup_status IN ('pending_setup', 'ready', 'active', 'inactive'));
  END IF;
END $$;

UPDATE public.units
SET status = CASE WHEN active = false THEN 'inactive' ELSE coalesce(status, 'active') END,
    setup_status = coalesce(setup_status, 'pending_setup')
WHERE status IS NULL OR setup_status IS NULL;

CREATE INDEX IF NOT EXISTS units_visible_idx
  ON public.units(active, status, deleted_at, name);

CREATE TABLE IF NOT EXISTS public.unit_registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_unit_name text NOT NULL,
  requested_unit_code text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  requested_admin_name text,
  requested_admin_email text NOT NULL,
  requested_admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  description text,
  logo_url text,
  accepted_terms boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS unit_registration_requests_status_created_idx
  ON public.unit_registration_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS unit_registration_requests_email_idx
  ON public.unit_registration_requests(lower(contact_email), lower(requested_admin_email));

CREATE TABLE IF NOT EXISTS public.unit_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL DEFAULT 'UNIT_USER' CHECK (requested_role IN ('UNIT_USER', 'LOGISTICS_NCO', 'WORK_MANAGER')),
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  review_notes text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(unit_id, user_id)
);

CREATE INDEX IF NOT EXISTS unit_access_requests_unit_status_idx
  ON public.unit_access_requests(unit_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS unit_access_requests_user_idx
  ON public.unit_access_requests(user_id, status);

CREATE TABLE IF NOT EXISTS public.construction_faults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  location_type text NOT NULL CHECK (location_type IN ('container', 'room', 'other')),
  location_name text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'חדשה' CHECK (status IN ('חדשה', 'בטיפול', 'טופלה')),
  notes text,
  opened_at date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS construction_faults_unit_status_idx
  ON public.construction_faults(unit_id, status, opened_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS construction_faults_unit_team_idx
  ON public.construction_faults(unit_id, team_id)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.assert_construction_fault_unit_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actual_unit_id uuid;
BEGIN
  IF NEW.team_id IS NOT NULL THEN
    SELECT unit_id INTO actual_unit_id FROM public.teams WHERE id = NEW.team_id;
    IF actual_unit_id IS NULL THEN
      RAISE EXCEPTION 'Team % does not exist', NEW.team_id;
    END IF;
    IF actual_unit_id IS DISTINCT FROM NEW.unit_id THEN
      RAISE EXCEPTION 'Team % does not belong to unit %', NEW.team_id, NEW.unit_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS construction_faults_unit_match_trg ON public.construction_faults;
CREATE TRIGGER construction_faults_unit_match_trg
BEFORE INSERT OR UPDATE OF unit_id, team_id ON public.construction_faults
FOR EACH ROW EXECUTE FUNCTION public.assert_construction_fault_unit_match();

CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND upper(ur.role::text) = 'OWNER'
  );
$$;

ALTER TABLE public.unit_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_faults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform owner reads all units" ON public.units;
CREATE POLICY "platform owner reads all units" ON public.units
FOR SELECT TO authenticated
USING (public.is_platform_owner());

DROP POLICY IF EXISTS "platform owner manages units" ON public.units;
CREATE POLICY "platform owner manages units" ON public.units
FOR ALL TO authenticated
USING (public.is_platform_owner())
WITH CHECK (public.is_platform_owner());

DROP POLICY IF EXISTS "any authenticated user creates unit request" ON public.unit_registration_requests;
CREATE POLICY "any authenticated user creates unit request" ON public.unit_registration_requests
FOR INSERT TO authenticated
WITH CHECK (
  status = 'pending'
  AND (
    requested_admin_user_id IS NULL
    OR requested_admin_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "requester reads own unit requests" ON public.unit_registration_requests;
CREATE POLICY "requester reads own unit requests" ON public.unit_registration_requests
FOR SELECT TO authenticated
USING (
  requested_admin_user_id = auth.uid()
  OR lower(contact_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  OR lower(requested_admin_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  OR public.is_platform_owner()
);

DROP POLICY IF EXISTS "platform owner manages unit requests" ON public.unit_registration_requests;
CREATE POLICY "platform owner manages unit requests" ON public.unit_registration_requests
FOR ALL TO authenticated
USING (public.is_platform_owner())
WITH CHECK (public.is_platform_owner());

DROP POLICY IF EXISTS "users create own unit access requests" ON public.unit_access_requests;
CREATE POLICY "users create own unit access requests" ON public.unit_access_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "users read own unit access requests" ON public.unit_access_requests;
CREATE POLICY "users read own unit access requests" ON public.unit_access_requests
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_platform_owner()
  OR EXISTS (
    SELECT 1 FROM public.unit_memberships um
    WHERE um.unit_id = unit_access_requests.unit_id
      AND um.user_id = auth.uid()
      AND um.is_active = true
      AND um.role IN ('PLATFORM_OWNER', 'UNIT_OWNER', 'UNIT_ADMIN', 'WORK_MANAGER', 'LOGISTICS_NCO')
  )
);

DROP POLICY IF EXISTS "unit admins manage unit access requests" ON public.unit_access_requests;
CREATE POLICY "unit admins manage unit access requests" ON public.unit_access_requests
FOR UPDATE TO authenticated
USING (
  public.is_platform_owner()
  OR EXISTS (
    SELECT 1 FROM public.unit_memberships um
    WHERE um.unit_id = unit_access_requests.unit_id
      AND um.user_id = auth.uid()
      AND um.is_active = true
      AND um.role IN ('PLATFORM_OWNER', 'UNIT_OWNER', 'UNIT_ADMIN', 'WORK_MANAGER', 'LOGISTICS_NCO')
  )
)
WITH CHECK (
  public.is_platform_owner()
  OR EXISTS (
    SELECT 1 FROM public.unit_memberships um
    WHERE um.unit_id = unit_access_requests.unit_id
      AND um.user_id = auth.uid()
      AND um.is_active = true
      AND um.role IN ('PLATFORM_OWNER', 'UNIT_OWNER', 'UNIT_ADMIN', 'WORK_MANAGER', 'LOGISTICS_NCO')
  )
);

DROP POLICY IF EXISTS "unit members read construction faults" ON public.construction_faults;
CREATE POLICY "unit members read construction faults" ON public.construction_faults
FOR SELECT TO authenticated
USING (
  deleted_at IS NULL
  AND (
    public.is_platform_owner()
    OR EXISTS (
      SELECT 1 FROM public.unit_memberships um
      WHERE um.unit_id = construction_faults.unit_id
        AND um.user_id = auth.uid()
        AND um.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.unit_id = construction_faults.unit_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  )
);

DROP POLICY IF EXISTS "unit admins manage construction faults" ON public.construction_faults;
CREATE POLICY "unit admins manage construction faults" ON public.construction_faults
FOR ALL TO authenticated
USING (
  public.is_platform_owner()
  OR EXISTS (
    SELECT 1 FROM public.unit_memberships um
    WHERE um.unit_id = construction_faults.unit_id
      AND um.user_id = auth.uid()
      AND um.is_active = true
      AND um.role IN ('UNIT_OWNER', 'UNIT_ADMIN', 'WORK_MANAGER', 'LOGISTICS_NCO', 'PLATFORM_OWNER')
  )
)
WITH CHECK (
  public.is_platform_owner()
  OR EXISTS (
    SELECT 1 FROM public.unit_memberships um
    WHERE um.unit_id = construction_faults.unit_id
      AND um.user_id = auth.uid()
      AND um.is_active = true
      AND um.role IN ('UNIT_OWNER', 'UNIT_ADMIN', 'WORK_MANAGER', 'LOGISTICS_NCO', 'PLATFORM_OWNER')
  )
);

CREATE OR REPLACE VIEW public.unit_integrity_validation AS
SELECT 'unit_without_admin' AS issue, u.id::text AS entity_id, u.name AS details
FROM public.units u
WHERE u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.unit_memberships um
    WHERE um.unit_id = u.id
      AND um.is_active = true
      AND um.role IN ('PLATFORM_OWNER', 'UNIT_OWNER', 'UNIT_ADMIN', 'WORK_MANAGER', 'LOGISTICS_NCO')
  )
UNION ALL
SELECT 'team_without_unit', t.id::text, t.name
FROM public.teams t
WHERE t.unit_id IS NULL
UNION ALL
SELECT 'product_without_unit', p.id::text, p.name
FROM public.products p
WHERE p.unit_id IS NULL
UNION ALL
SELECT 'category_without_unit', c.id::text, c.name
FROM public.item_categories c
WHERE c.unit_id IS NULL
UNION ALL
SELECT 'order_unit_team_mismatch', o.id::text, o.status::text
FROM public.orders o
JOIN public.teams t ON t.id = o.team_id
WHERE o.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'replacement_request_unit_team_mismatch', rr.id::text, rr.status::text
FROM public.replacement_requests rr
JOIN public.teams t ON t.id = rr.team_id
WHERE rr.unit_id IS DISTINCT FROM t.unit_id
UNION ALL
SELECT 'duplicate_unit_membership', user_id::text, unit_id::text
FROM public.unit_memberships
GROUP BY user_id, unit_id
HAVING count(*) > 1
UNION ALL
SELECT 'duplicate_team_membership', user_id::text, team_id::text
FROM public.team_memberships
GROUP BY user_id, team_id
HAVING count(*) > 1;

GRANT SELECT ON public.unit_registration_requests, public.unit_access_requests, public.construction_faults, public.unit_integrity_validation TO authenticated;
GRANT INSERT ON public.unit_access_requests TO authenticated;
GRANT ALL ON public.unit_registration_requests, public.unit_access_requests, public.construction_faults TO service_role;
