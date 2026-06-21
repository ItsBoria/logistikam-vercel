-- Protected role hierarchy, immutable audit trail, and historical budget periods.
-- This migration preserves existing users, roles, teams, orders, and budgets.

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS assigned_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deactivated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Preserve legacy assignments while moving to the requested hierarchy.
UPDATE public.user_roles SET role = 'ADMIN'::public.app_role
WHERE role::text IN ('admin', 'staff');

CREATE UNIQUE INDEX IF NOT EXISTS one_active_owner_systemwide
  ON public.user_roles ((1))
  WHERE role = 'OWNER'::public.app_role AND is_active = true;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  previous_value jsonb,
  new_value jsonb,
  performed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  performer_role text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_target_idx ON public.audit_log(target_type, target_id);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

CREATE OR REPLACE FUNCTION public.role_level(_role text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE upper(_role)
    WHEN 'OWNER' THEN 100
    WHEN 'WORK_MANAGER' THEN 80
    WHEN 'ADMIN' THEN 50
    WHEN 'STAFF' THEN 50
    WHEN 'USER' THEN 10
    ELSE 0
  END
$$;

CREATE OR REPLACE FUNCTION public.current_role_level(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(MAX(public.role_level(role::text)), 10)
  FROM public.user_roles
  WHERE user_id = _user_id AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.current_role_code(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles
     WHERE user_id = _user_id AND is_active = true
     ORDER BY public.role_level(role::text) DESC LIMIT 1),
    'USER'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_min_role(_user_id uuid, _minimum text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_role_level(_user_id) >= public.role_level(_minimum)
$$;

-- Replace permissive legacy policies with the requested hierarchy.
DROP POLICY IF EXISTS "admins manage teams" ON public.teams;
CREATE POLICY "work managers manage teams" ON public.teams FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'))
WITH CHECK (public.has_min_role(auth.uid(), 'WORK_MANAGER'));

DROP POLICY IF EXISTS "admins manage memberships" ON public.team_members;
CREATE POLICY "owner manages memberships" ON public.team_members FOR ALL TO authenticated
USING (public.current_role_code(auth.uid()) = 'OWNER')
WITH CHECK (public.current_role_code(auth.uid()) = 'OWNER');

DO $calendar_policies$
BEGIN
  IF to_regclass('public.mission_weeks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage mission_weeks" ON public.mission_weeks';
    EXECUTE 'DROP POLICY IF EXISTS "mission_weeks_select" ON public.mission_weeks';
    EXECUTE 'DROP POLICY IF EXISTS "mission_weeks_insert" ON public.mission_weeks';
    EXECUTE 'DROP POLICY IF EXISTS "mission_weeks_update" ON public.mission_weeks';
    EXECUTE 'DROP POLICY IF EXISTS "mission_weeks_delete" ON public.mission_weeks';
    EXECUTE 'CREATE POLICY "work managers read mission weeks" ON public.mission_weeks FOR SELECT TO authenticated
      USING (public.has_min_role(auth.uid(), ''WORK_MANAGER''))';
    EXECUTE 'CREATE POLICY "work managers create own mission weeks" ON public.mission_weeks FOR INSERT TO authenticated
      WITH CHECK (public.has_min_role(auth.uid(), ''WORK_MANAGER'') AND owner_user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "work managers update owned or approvable mission weeks" ON public.mission_weeks FOR UPDATE TO authenticated
      USING (public.has_min_role(auth.uid(), ''WORK_MANAGER'') AND
        (owner_user_id = auth.uid() OR public.current_role_code(auth.uid()) IN (''OWNER'', ''WORK_MANAGER'')))
      WITH CHECK (public.has_min_role(auth.uid(), ''WORK_MANAGER''))';
    EXECUTE 'CREATE POLICY "work managers delete own mission weeks" ON public.mission_weeks FOR DELETE TO authenticated
      USING (public.has_min_role(auth.uid(), ''WORK_MANAGER'') AND owner_user_id = auth.uid())';
  END IF;

  IF to_regclass('public.missions') IS NOT NULL AND to_regclass('public.mission_weeks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage missions" ON public.missions';
    EXECUTE 'DROP POLICY IF EXISTS "missions_select" ON public.missions';
    EXECUTE 'DROP POLICY IF EXISTS "missions_write" ON public.missions';
    EXECUTE 'CREATE POLICY "work managers read missions" ON public.missions FOR SELECT TO authenticated
      USING (public.has_min_role(auth.uid(), ''WORK_MANAGER''))';
    EXECUTE 'CREATE POLICY "work managers edit owned missions" ON public.missions FOR ALL TO authenticated
      USING (public.has_min_role(auth.uid(), ''WORK_MANAGER'') AND EXISTS
        (SELECT 1 FROM public.mission_weeks w WHERE w.id = missions.week_id AND w.owner_user_id = auth.uid()))
      WITH CHECK (public.has_min_role(auth.uid(), ''WORK_MANAGER'') AND EXISTS
        (SELECT 1 FROM public.mission_weeks w WHERE w.id = missions.week_id AND w.owner_user_id = auth.uid()))';
  END IF;

  IF to_regclass('public.mission_day_notes') IS NOT NULL AND to_regclass('public.mission_weeks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "admins read day notes" ON public.mission_day_notes';
    EXECUTE 'DROP POLICY IF EXISTS "owner edits day notes" ON public.mission_day_notes';
    EXECUTE 'CREATE POLICY "work managers read day notes" ON public.mission_day_notes FOR SELECT TO authenticated
      USING (public.has_min_role(auth.uid(), ''WORK_MANAGER''))';
    EXECUTE 'CREATE POLICY "work managers edit owned day notes" ON public.mission_day_notes FOR ALL TO authenticated
      USING (public.has_min_role(auth.uid(), ''WORK_MANAGER'') AND EXISTS
        (SELECT 1 FROM public.mission_weeks w WHERE w.id = mission_day_notes.week_id
          AND w.owner_user_id = auth.uid() AND w.locked = false))
      WITH CHECK (public.has_min_role(auth.uid(), ''WORK_MANAGER'') AND EXISTS
        (SELECT 1 FROM public.mission_weeks w WHERE w.id = mission_day_notes.week_id
          AND w.owner_user_id = auth.uid() AND w.locked = false))';
  END IF;
END
$calendar_policies$;

-- Compatibility for existing policies/server code while hierarchy migration rolls out.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE lower(_role::text)
    WHEN 'admin' THEN public.has_min_role(_user_id, 'ADMIN')
    WHEN 'staff' THEN public.has_min_role(_user_id, 'ADMIN')
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role AND is_active = true
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND public.current_role_code(auth.uid()) <> 'OWNER' THEN
    NEW.is_active := OLD.is_active;
    NEW.deactivated_at := OLD.deactivated_at;
    NEW.deactivated_by := OLD.deactivated_by;
    NEW.is_approver := OLD.is_approver;
  END IF;
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS protect_profile_security_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_security_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();

CREATE OR REPLACE FUNCTION public.validate_protected_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE target_email text;
BEGIN
  IF NEW.role::text = 'OWNER' AND NEW.is_active THEN
    SELECT lower(trim(email)) INTO target_email FROM auth.users WHERE id = NEW.user_id;
    IF target_email IS DISTINCT FROM 'davidpanasik.dp@gmail.com' THEN
      RAISE EXCEPTION 'OWNER may only be assigned to the protected verified account';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = NEW.user_id AND email_confirmed_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'OWNER account must be email verified';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS validate_protected_role_trigger ON public.user_roles;
CREATE TRIGGER validate_protected_role_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_protected_role();

CREATE OR REPLACE FUNCTION public.assign_protected_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF lower(trim(NEW.email)) = 'davidpanasik.dp@gmail.com'
     AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role, assigned_by_user_id, assigned_at, is_active)
    VALUES (NEW.id, 'OWNER'::public.app_role, NULL, now(), true)
    ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS assign_protected_owner_trigger ON auth.users;
CREATE TRIGGER assign_protected_owner_trigger
  AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_protected_owner();

INSERT INTO public.user_roles(user_id, role, assigned_by_user_id, assigned_at, is_active)
SELECT id, 'OWNER'::public.app_role, NULL, now(), true
FROM auth.users
WHERE lower(trim(email)) = 'davidpanasik.dp@gmail.com'
  AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;

-- The protected Owner account has one effective role; retire migrated legacy roles.
UPDATE public.user_roles ur
SET is_active = false
FROM auth.users au
WHERE au.id = ur.user_id
  AND lower(trim(au.email)) = 'davidpanasik.dp@gmail.com'
  AND ur.role <> 'OWNER'::public.app_role
  AND ur.is_active = true;

CREATE OR REPLACE FUNCTION public.write_audit(
  _action_type text, _target_type text, _target_id text,
  _previous jsonb, _new jsonb, _reason text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result_id uuid;
BEGIN
  INSERT INTO public.audit_log(
    action_type, target_type, target_id, previous_value, new_value,
    performed_by_user_id, performer_role, reason, metadata
  ) VALUES (
    _action_type, _target_type, _target_id, _previous, _new,
    auth.uid(), public.current_role_code(auth.uid()), _reason, COALESCE(_metadata, '{}'::jsonb)
  ) RETURNING id INTO result_id;
  RETURN result_id;
END
$$;

DROP POLICY IF EXISTS "owner reads full audit log" ON public.audit_log;
CREATE POLICY "owner reads full audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.current_role_code(auth.uid()) = 'OWNER');

-- Budget policy hierarchy: user > team > global.
CREATE TABLE IF NOT EXISTS public.budget_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('global','team','user')),
  scope_id uuid,
  reset_mode text NOT NULL DEFAULT 'monthly' CHECK (reset_mode IN ('monthly','manual','none','custom')),
  reset_day integer CHECK (reset_day BETWEEN 1 AND 28),
  reset_time time,
  timezone text NOT NULL DEFAULT 'Asia/Jerusalem',
  frequency text CHECK (frequency IN ('monthly','quarterly','yearly','one_time')),
  carry_over_mode text NOT NULL DEFAULT 'none' CHECK (carry_over_mode IN ('none','full','limited')),
  carry_over_limit numeric(12,2),
  default_budget_amount numeric(12,2) NOT NULL DEFAULT 0,
  next_reset_at timestamptz,
  schedule_end_at timestamptz,
  work_manager_can_manage boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS budget_policy_scope_active_uniq
  ON public.budget_policies(scope_type, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.budget_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  policy_id uuid REFERENCES public.budget_policies(id) ON DELETE SET NULL,
  starting_budget numeric(12,2) NOT NULL,
  carry_over_amount numeric(12,2) NOT NULL DEFAULT 0,
  used_amount numeric(12,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(12,2) NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  reset_type text NOT NULL CHECK (reset_type IN ('automatic','manual','initial')),
  reset_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reset_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reset_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','scheduled'))
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_team_budget_period
  ON public.budget_periods(team_id) WHERE status = 'active' AND team_id IS NOT NULL AND user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS one_active_user_budget_period
  ON public.budget_periods(user_id) WHERE status = 'active' AND user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.budget_reset_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.budget_policies(id) ON DELETE CASCADE,
  scope_key text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(policy_id, scope_key, scheduled_for)
);

CREATE OR REPLACE FUNCTION public.team_month_spent(_team_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(total), 0)
  FROM public.orders
  WHERE team_id = _team_id
    AND status IN ('pending','approved','preparing','ready','completed')
    AND created_at >= COALESCE(
      (SELECT starts_at FROM public.budget_periods
       WHERE team_id = _team_id AND status = 'active'
       ORDER BY starts_at DESC LIMIT 1),
      date_trunc('month', now())
    )
$$;

ALTER TABLE public.budget_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_reset_jobs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.budget_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.budget_periods TO authenticated;
GRANT SELECT ON public.budget_reset_jobs TO authenticated;
GRANT ALL ON public.budget_policies, public.budget_periods, public.budget_reset_jobs TO service_role;

DROP POLICY IF EXISTS "privileged read budget policies" ON public.budget_policies;
CREATE POLICY "privileged read budget policies" ON public.budget_policies FOR SELECT TO authenticated
USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'));
DROP POLICY IF EXISTS "owner manages global policies" ON public.budget_policies;
CREATE POLICY "owner manages global policies" ON public.budget_policies FOR ALL TO authenticated
USING (
  public.current_role_code(auth.uid()) = 'OWNER'
  OR (scope_type <> 'global' AND public.current_role_code(auth.uid()) = 'WORK_MANAGER' AND work_manager_can_manage)
)
WITH CHECK (
  public.current_role_code(auth.uid()) = 'OWNER'
  OR (scope_type <> 'global' AND public.current_role_code(auth.uid()) = 'WORK_MANAGER' AND work_manager_can_manage)
);
DROP POLICY IF EXISTS "privileged read budget history" ON public.budget_periods;
CREATE POLICY "privileged read budget history" ON public.budget_periods FOR SELECT TO authenticated
USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'));

-- Initial global policy retains the current monthly behavior.
INSERT INTO public.budget_policies(
  scope_type, reset_mode, reset_day, reset_time, timezone,
  frequency, carry_over_mode, default_budget_amount, is_active
) SELECT 'global', 'monthly', 1, '00:00', 'Asia/Jerusalem',
         'monthly', 'none', 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.budget_policies WHERE scope_type = 'global' AND is_active
);

-- Preserve every team's current allocation as its initial historical period.
INSERT INTO public.budget_periods(
  team_id, policy_id, starting_budget, carry_over_amount, used_amount,
  remaining_amount, starts_at, reset_type, reset_reason, status
)
SELECT
  t.id,
  (SELECT id FROM public.budget_policies WHERE scope_type = 'global' AND is_active LIMIT 1),
  t.monthly_limit,
  0,
  public.team_month_spent(t.id),
  GREATEST(0, t.monthly_limit - public.team_month_spent(t.id)),
  date_trunc('month', now()),
  'initial',
  'Migrated from existing team monthly allocation',
  'active'
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1 FROM public.budget_periods p WHERE p.team_id = t.id AND p.status = 'active'
);

CREATE OR REPLACE FUNCTION public.reset_team_budget(
  _team_id uuid,
  _new_budget numeric,
  _reason text,
  _apply_carry_over boolean DEFAULT true
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid := auth.uid();
  actor_role text;
  old_period public.budget_periods%ROWTYPE;
  policy public.budget_policies%ROWTYPE;
  carry numeric(12,2) := 0;
  new_period_id uuid;
BEGIN
  actor_role := public.current_role_code(actor);
  IF actor_role NOT IN ('OWNER','WORK_MANAGER') THEN
    RAISE EXCEPTION 'Only OWNER or WORK_MANAGER may reset budgets';
  END IF;
  IF trim(COALESCE(_reason,'')) = '' THEN
    RAISE EXCEPTION 'Reset reason is required';
  END IF;
  IF _new_budget < 0 THEN RAISE EXCEPTION 'Budget cannot be negative'; END IF;

  SELECT * INTO old_period FROM public.budget_periods
  WHERE team_id = _team_id AND status = 'active'
  FOR UPDATE;
  SELECT * INTO policy FROM public.budget_policies
  WHERE is_active AND (
    (scope_type = 'team' AND scope_id = _team_id)
    OR scope_type = 'global'
  )
  ORDER BY CASE scope_type WHEN 'team' THEN 1 ELSE 2 END LIMIT 1;

  IF old_period.id IS NOT NULL THEN
    IF _apply_carry_over THEN
      carry := CASE policy.carry_over_mode
        WHEN 'full' THEN GREATEST(0, old_period.starting_budget + old_period.carry_over_amount - old_period.used_amount)
        WHEN 'limited' THEN LEAST(
          GREATEST(0, old_period.starting_budget + old_period.carry_over_amount - old_period.used_amount),
          COALESCE(policy.carry_over_limit,0)
        )
        ELSE 0
      END;
    END IF;
    UPDATE public.budget_periods SET
      status = 'closed', ends_at = now(), reset_at = now(),
      remaining_amount = GREATEST(0, starting_budget + carry_over_amount - used_amount)
    WHERE id = old_period.id;
  END IF;

  INSERT INTO public.budget_periods(
    team_id, policy_id, starting_budget, carry_over_amount, used_amount,
    remaining_amount, starts_at, reset_type, reset_reason,
    created_by, reset_by_user_id, reset_at, status
  ) VALUES (
    _team_id, policy.id, _new_budget, carry, 0,
    _new_budget + carry, now(), 'manual', _reason,
    actor, actor, now(), 'active'
  ) RETURNING id INTO new_period_id;

  UPDATE public.teams SET monthly_limit = _new_budget + carry WHERE id = _team_id;
  PERFORM public.write_audit(
    'BUDGET_RESET','team',_team_id::text,to_jsonb(old_period),
    jsonb_build_object('period_id',new_period_id,'starting_budget',_new_budget,'carry_over',carry),
    _reason,jsonb_build_object('method','manual')
  );
  RETURN new_period_id;
END
$$;
REVOKE ALL ON FUNCTION public.reset_team_budget(uuid,numeric,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_team_budget(uuid,numeric,text,boolean) TO authenticated;

-- Calendar history is installed only when the optional calendar module exists.
DO $calendar_history$
BEGIN
  IF to_regclass('public.mission_weeks') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.calendar_approval_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      calendar_entry_id uuid NOT NULL REFERENCES public.mission_weeks(id) ON DELETE RESTRICT,
      signer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      signer_name text NOT NULL,
      signer_role text NOT NULL,
      previous_status text,
      new_status text NOT NULL,
      action text NOT NULL CHECK (action IN (''sign'',''approve'',''reject'',''reopen'')),
      comment text,
      reason text,
      created_at timestamptz NOT NULL DEFAULT now()
    )';
    EXECUTE 'ALTER TABLE public.calendar_approval_history ENABLE ROW LEVEL SECURITY';
    EXECUTE 'GRANT SELECT, INSERT ON public.calendar_approval_history TO authenticated';
    EXECUTE 'GRANT ALL ON public.calendar_approval_history TO service_role';
    EXECUTE 'DROP POLICY IF EXISTS "work managers read calendar approval history" ON public.calendar_approval_history';
    EXECUTE 'CREATE POLICY "work managers read calendar approval history" ON public.calendar_approval_history
      FOR SELECT TO authenticated USING (public.has_min_role(auth.uid(), ''WORK_MANAGER''))';
  END IF;
END
$calendar_history$;

-- New notification categories.
ALTER TABLE public.admin_notification_prefs DROP CONSTRAINT IF EXISTS admin_notification_prefs_event_type_check;
ALTER TABLE public.admin_notification_prefs ADD CONSTRAINT admin_notification_prefs_event_type_check CHECK (
  event_type IN (
    'order_created','order_awaiting_approval','order_approved','order_rejected',
    'order_ready','order_cancelled','budget_low','budget_reset_completed',
    'budget_reset_failed','budget_exceeded','low_stock','out_of_stock','replacement_request',
    'calendar_awaiting_signature','calendar_approved','calendar_rejected','system_alert'
  )
);

-- Owner-only role management RPC. Frontends cannot forge the actor.
CREATE OR REPLACE FUNCTION public.owner_set_user_role(
  _target_user_id uuid, _role text, _active boolean, _reason text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE old_rows jsonb; normalized text := upper(_role);
BEGIN
  IF public.current_role_code(auth.uid()) <> 'OWNER' THEN
    RAISE EXCEPTION 'Only OWNER may manage privileged roles';
  END IF;
  IF normalized NOT IN ('WORK_MANAGER','ADMIN','USER') THEN
    RAISE EXCEPTION 'Protected or invalid role';
  END IF;
  SELECT jsonb_agg(to_jsonb(r)) INTO old_rows FROM public.user_roles r WHERE user_id = _target_user_id;
  UPDATE public.user_roles SET is_active = false
    WHERE user_id = _target_user_id AND role::text IN ('WORK_MANAGER','ADMIN','USER','admin','staff');
  IF _active THEN
    INSERT INTO public.user_roles(user_id, role, assigned_by_user_id, assigned_at, is_active)
    VALUES (_target_user_id, normalized::public.app_role, auth.uid(), now(), true)
    ON CONFLICT (user_id, role) DO UPDATE SET
      assigned_by_user_id = auth.uid(), assigned_at = now(), is_active = true;
  END IF;
  PERFORM public.write_audit('ROLE_CHANGED','user',_target_user_id::text,old_rows,
    jsonb_build_object('role',normalized,'active',_active),_reason,'{}'::jsonb);
END
$$;
REVOKE ALL ON FUNCTION public.owner_set_user_role(uuid,text,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owner_set_user_role(uuid,text,boolean,text) TO authenticated;
