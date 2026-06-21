-- Logistikam full schema repair
-- Safe to rerun. Creates missing application objects without deleting business data.
-- Run after:
--   20260621115900_role_enum_values.sql
--   20260621120000_role_budget_audit_foundation.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers and enum types
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'OWNER', 'WORK_MANAGER', 'ADMIN', 'USER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM (
      'pending','approved','preparing','ready','completed','cancelled','awaiting_approval'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'replacement_status') THEN
    CREATE TYPE public.replacement_status AS ENUM ('preparing','ready','done','cancelled');
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

-- ---------------------------------------------------------------------------
-- Core users, teams, products and orders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  assigned_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS assigned_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pin text NOT NULL UNIQUE,
  monthly_limit numeric(12,2) NOT NULL DEFAULT 0,
  contact_phone text,
  active boolean NOT NULL DEFAULT true,
  is_admin_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS monthly_limit numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_admin_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS teams_pin_unique_idx ON public.teams(pin);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  category text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  low_stock_threshold integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS price numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  notes text,
  admin_notes text,
  contact_phone text,
  ordered_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS ordered_by_name text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id
  ON public.order_status_history(order_id, created_at DESC);

DROP TRIGGER IF EXISTS orders_touch ON public.orders;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Profiles and team membership
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  is_approver boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  deactivated_at timestamptz,
  deactivated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS is_approver boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deactivated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.team_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON public.team_members(team_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);
  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles(id, email, display_name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(COALESCE(email,''),'@',1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Application settings and replacement inventory
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings(key, value)
VALUES ('default_low_stock_threshold', '5'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.replacement_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  takin_stock integer NOT NULL DEFAULT 0,
  balai_stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.replacement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status public.replacement_status NOT NULL DEFAULT 'preparing',
  ordered_by_name text,
  contact_phone text,
  notes text,
  decided_at timestamptz,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.replacement_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.replacement_requests(id) ON DELETE CASCADE,
  replacement_product_id uuid REFERENCES public.replacement_products(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS replacement_request_items_request_idx
  ON public.replacement_request_items(request_id);

DROP TRIGGER IF EXISTS trg_replacement_products_updated ON public.replacement_products;
CREATE TRIGGER trg_replacement_products_updated BEFORE UPDATE ON public.replacement_products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_replacement_requests_updated ON public.replacement_requests;
CREATE TRIGGER trg_replacement_requests_updated BEFORE UPDATE ON public.replacement_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Push subscriptions and administrator personalization
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_team ON public.push_subscriptions(team_id);

CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_push_subscriptions_user_id_idx
  ON public.admin_push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS public.admin_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_section text NOT NULL DEFAULT '/admin',
  visible_widgets jsonb NOT NULL DEFAULT '["kpis","attention","budgets","stock","recent_orders"]'::jsonb,
  widget_order jsonb NOT NULL DEFAULT '["kpis","attention","budgets","stock","recent_orders"]'::jsonb,
  pinned_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  saved_filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  compact_mode boolean NOT NULL DEFAULT false,
  reduced_animations boolean NOT NULL DEFAULT false,
  appearance text NOT NULL DEFAULT 'system',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_notification_prefs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  in_app_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_type)
);
ALTER TABLE public.admin_notification_prefs
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS in_app_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.team_budget_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  threshold integer NOT NULL,
  month date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, threshold, month)
);

-- ---------------------------------------------------------------------------
-- Operational calendar
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mission_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  week integer NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  author_signed_at timestamptz,
  author_signature_name text,
  approver_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_signed_at timestamptz,
  approver_signature_name text,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mission_weeks
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name text,
  ADD COLUMN IF NOT EXISTS author_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS author_signature_name text,
  ADD COLUMN IF NOT EXISTS approver_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approver_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS approver_signature_name text,
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.mission_weeks
SET owner_user_id = COALESCE(owner_user_id, created_by)
WHERE owner_user_id IS NULL AND created_by IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS mission_weeks_owner_week_uniq
  ON public.mission_weeks(owner_user_id, year, week);

CREATE TABLE IF NOT EXISTS public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.mission_weeks(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  details text,
  done boolean NOT NULL DEFAULT false,
  due_time time,
  reminder_at timestamptz,
  reminder_sent_at timestamptz,
  carried_from_id uuid REFERENCES public.missions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS due_time time,
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS carried_from_id uuid REFERENCES public.missions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS missions_week_id_idx ON public.missions(week_id);

CREATE TABLE IF NOT EXISTS public.mission_day_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES public.mission_weeks(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  influencers text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.calendar_approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_entry_id uuid NOT NULL REFERENCES public.mission_weeks(id) ON DELETE RESTRICT,
  signer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  signer_name text NOT NULL,
  signer_role text NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  action text NOT NULL CHECK (action IN ('sign','approve','reject','reopen')),
  comment text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS mission_weeks_touch_updated_at ON public.mission_weeks;
CREATE TRIGGER mission_weeks_touch_updated_at BEFORE UPDATE ON public.mission_weeks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS missions_touch_updated_at ON public.missions;
CREATE TRIGGER missions_touch_updated_at BEFORE UPDATE ON public.missions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS mission_day_notes_touch ON public.mission_day_notes;
CREATE TRIGGER mission_day_notes_touch BEFORE UPDATE ON public.mission_day_notes
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Budget and audit tables (created here as a fallback if foundation was partial)
-- ---------------------------------------------------------------------------

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

CREATE TABLE IF NOT EXISTS public.budget_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL,
  scope_id uuid,
  reset_mode text NOT NULL DEFAULT 'monthly',
  reset_day integer,
  reset_time time,
  timezone text NOT NULL DEFAULT 'Asia/Jerusalem',
  frequency text,
  carry_over_mode text NOT NULL DEFAULT 'none',
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
  reset_type text NOT NULL,
  reset_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reset_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reset_at timestamptz,
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS public.budget_reset_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.budget_policies(id) ON DELETE CASCADE,
  scope_key text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(policy_id, scope_key, scheduled_for)
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_target_idx ON public.audit_log(target_type, target_id);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_team_budget_period
  ON public.budget_periods(team_id)
  WHERE status = 'active' AND team_id IS NOT NULL AND user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS one_active_user_budget_period
  ON public.budget_periods(user_id)
  WHERE status = 'active' AND user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Security baseline
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replacement_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_day_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_reset_jobs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.teams, public.products, public.orders, public.order_items,
  public.app_settings, public.replacement_products, public.replacement_requests,
  public.replacement_request_items, public.push_subscriptions,
  public.admin_push_subscriptions, public.admin_preferences,
  public.admin_notification_prefs, public.team_budget_alerts,
  public.mission_weeks, public.missions, public.mission_day_notes
TO authenticated;
GRANT SELECT, INSERT ON public.order_status_history, public.calendar_approval_history TO authenticated;
GRANT SELECT ON public.audit_log, public.budget_reset_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles, public.budget_policies, public.budget_periods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Personal-data policies. Operational hierarchy policies are refreshed by the
-- role/budget foundation migration after this repair script.
DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users read own profile" ON public.profiles;
CREATE POLICY "users read own profile" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users read own membership" ON public.team_members;
CREATE POLICY "users read own membership" ON public.team_members
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users manage own admin push subs" ON public.admin_push_subscriptions;
CREATE POLICY "users manage own admin push subs" ON public.admin_push_subscriptions
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users manage own admin preferences" ON public.admin_preferences;
CREATE POLICY "users manage own admin preferences" ON public.admin_preferences
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users manage own notification prefs" ON public.admin_notification_prefs;
CREATE POLICY "users manage own notification prefs" ON public.admin_notification_prefs
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Operational hierarchy policies. Higher roles inherit ADMIN access through
-- has_min_role(), so OWNER and WORK_MANAGER do not need duplicate ADMIN rows.
DROP POLICY IF EXISTS "admins read all roles" ON public.user_roles;
CREATE POLICY "privileged users read roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_min_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "admins read all profiles" ON public.profiles;
CREATE POLICY "privileged users read profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.has_min_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "work managers manage teams" ON public.teams;
DROP POLICY IF EXISTS "admins manage teams" ON public.teams;
CREATE POLICY "work managers manage teams" ON public.teams
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'))
WITH CHECK (public.has_min_role(auth.uid(), 'WORK_MANAGER'));

DROP POLICY IF EXISTS "anyone reads active products" ON public.products;
CREATE POLICY "anyone reads active products" ON public.products
FOR SELECT USING (active = true OR public.has_min_role(auth.uid(), 'ADMIN'));
DROP POLICY IF EXISTS "admins manage products" ON public.products;
CREATE POLICY "privileged users manage products" ON public.products
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "admins manage orders" ON public.orders;
CREATE POLICY "privileged users manage orders" ON public.orders
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "admins manage order_items" ON public.order_items;
CREATE POLICY "privileged users manage order items" ON public.order_items
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "Admin/staff can view status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admin/staff can insert status history" ON public.order_status_history;
CREATE POLICY "privileged users read order history" ON public.order_status_history
FOR SELECT TO authenticated USING (public.has_min_role(auth.uid(), 'ADMIN'));
CREATE POLICY "privileged users add order history" ON public.order_status_history
FOR INSERT TO authenticated WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "owner manages memberships" ON public.team_members;
DROP POLICY IF EXISTS "admins manage memberships" ON public.team_members;
CREATE POLICY "owner manages memberships" ON public.team_members
FOR ALL TO authenticated
USING (public.current_role_code(auth.uid()) = 'OWNER')
WITH CHECK (public.current_role_code(auth.uid()) = 'OWNER');

DROP POLICY IF EXISTS "admins manage app_settings" ON public.app_settings;
CREATE POLICY "owner manages app settings" ON public.app_settings
FOR ALL TO authenticated
USING (public.current_role_code(auth.uid()) = 'OWNER')
WITH CHECK (public.current_role_code(auth.uid()) = 'OWNER');

DROP POLICY IF EXISTS "admins manage replacement_products" ON public.replacement_products;
DROP POLICY IF EXISTS "admins manage replacement_requests" ON public.replacement_requests;
DROP POLICY IF EXISTS "admins manage replacement_request_items" ON public.replacement_request_items;
CREATE POLICY "privileged users manage replacement products" ON public.replacement_products
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));
CREATE POLICY "privileged users manage replacement requests" ON public.replacement_requests
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));
CREATE POLICY "privileged users manage replacement request items" ON public.replacement_request_items
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "admins manage push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "privileged users manage push subscriptions" ON public.push_subscriptions
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "admins manage team_budget_alerts" ON public.team_budget_alerts;
CREATE POLICY "work managers manage budget alerts" ON public.team_budget_alerts
FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'))
WITH CHECK (public.has_min_role(auth.uid(), 'WORK_MANAGER'));

DROP POLICY IF EXISTS "work managers read mission weeks" ON public.mission_weeks;
DROP POLICY IF EXISTS "Admins manage mission_weeks" ON public.mission_weeks;
DROP POLICY IF EXISTS "mission_weeks_select" ON public.mission_weeks;
DROP POLICY IF EXISTS "mission_weeks_insert" ON public.mission_weeks;
DROP POLICY IF EXISTS "mission_weeks_update" ON public.mission_weeks;
DROP POLICY IF EXISTS "mission_weeks_delete" ON public.mission_weeks;
CREATE POLICY "work managers read mission weeks" ON public.mission_weeks
FOR SELECT TO authenticated USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'));
DROP POLICY IF EXISTS "work managers create own mission weeks" ON public.mission_weeks;
CREATE POLICY "work managers create own mission weeks" ON public.mission_weeks
FOR INSERT TO authenticated
WITH CHECK (public.has_min_role(auth.uid(), 'WORK_MANAGER') AND owner_user_id = auth.uid());
DROP POLICY IF EXISTS "work managers update owned or approvable mission weeks" ON public.mission_weeks;
CREATE POLICY "work managers update owned or approvable mission weeks" ON public.mission_weeks
FOR UPDATE TO authenticated
USING (
  public.has_min_role(auth.uid(), 'WORK_MANAGER')
  AND (owner_user_id = auth.uid() OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER'))
)
WITH CHECK (public.has_min_role(auth.uid(), 'WORK_MANAGER'));
DROP POLICY IF EXISTS "work managers delete own mission weeks" ON public.mission_weeks;
CREATE POLICY "work managers delete own mission weeks" ON public.mission_weeks
FOR DELETE TO authenticated
USING (public.has_min_role(auth.uid(), 'WORK_MANAGER') AND owner_user_id = auth.uid());

DROP POLICY IF EXISTS "work managers read missions" ON public.missions;
DROP POLICY IF EXISTS "Admins manage missions" ON public.missions;
DROP POLICY IF EXISTS "missions_select" ON public.missions;
DROP POLICY IF EXISTS "missions_write" ON public.missions;
CREATE POLICY "work managers read missions" ON public.missions
FOR SELECT TO authenticated USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'));
DROP POLICY IF EXISTS "work managers edit owned missions" ON public.missions;
CREATE POLICY "work managers edit owned missions" ON public.missions
FOR ALL TO authenticated
USING (
  public.has_min_role(auth.uid(), 'WORK_MANAGER')
  AND EXISTS (
    SELECT 1 FROM public.mission_weeks w
    WHERE w.id = missions.week_id AND w.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  public.has_min_role(auth.uid(), 'WORK_MANAGER')
  AND EXISTS (
    SELECT 1 FROM public.mission_weeks w
    WHERE w.id = missions.week_id AND w.owner_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "work managers read day notes" ON public.mission_day_notes;
DROP POLICY IF EXISTS "admins read day notes" ON public.mission_day_notes;
DROP POLICY IF EXISTS "owner edits day notes" ON public.mission_day_notes;
CREATE POLICY "work managers read day notes" ON public.mission_day_notes
FOR SELECT TO authenticated USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'));
DROP POLICY IF EXISTS "work managers edit owned day notes" ON public.mission_day_notes;
CREATE POLICY "work managers edit owned day notes" ON public.mission_day_notes
FOR ALL TO authenticated
USING (
  public.has_min_role(auth.uid(), 'WORK_MANAGER')
  AND EXISTS (
    SELECT 1 FROM public.mission_weeks w
    WHERE w.id = mission_day_notes.week_id
      AND w.owner_user_id = auth.uid()
      AND w.locked = false
  )
)
WITH CHECK (
  public.has_min_role(auth.uid(), 'WORK_MANAGER')
  AND EXISTS (
    SELECT 1 FROM public.mission_weeks w
    WHERE w.id = mission_day_notes.week_id
      AND w.owner_user_id = auth.uid()
      AND w.locked = false
  )
);

DROP POLICY IF EXISTS "work managers read calendar approval history" ON public.calendar_approval_history;
CREATE POLICY "work managers read calendar approval history" ON public.calendar_approval_history
FOR SELECT TO authenticated USING (public.has_min_role(auth.uid(), 'WORK_MANAGER'));

-- Report any expected tables that are still missing. A successful repair
-- returns zero rows from this final query.
WITH expected(table_name) AS (
  VALUES
    ('user_roles'), ('profiles'), ('teams'), ('team_members'),
    ('products'), ('orders'), ('order_items'), ('order_status_history'),
    ('app_settings'), ('replacement_products'), ('replacement_requests'),
    ('replacement_request_items'), ('push_subscriptions'),
    ('admin_push_subscriptions'), ('admin_preferences'),
    ('admin_notification_prefs'), ('team_budget_alerts'),
    ('mission_weeks'), ('missions'), ('mission_day_notes'),
    ('calendar_approval_history'), ('audit_log'), ('budget_policies'),
    ('budget_periods'), ('budget_reset_jobs')
)
SELECT expected.table_name AS missing_table
FROM expected
LEFT JOIN information_schema.tables actual
  ON actual.table_schema = 'public'
 AND actual.table_name = expected.table_name
WHERE actual.table_name IS NULL
ORDER BY expected.table_name;
