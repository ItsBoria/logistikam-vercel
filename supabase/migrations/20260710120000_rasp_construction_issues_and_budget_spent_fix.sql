-- RASP construction issues + corrected current-month approved spending.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'construction_issue_status'
  ) THEN
    CREATE TYPE public.construction_issue_status AS ENUM ('new', 'in_progress', 'resolved');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.construction_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  location_type text NOT NULL CHECK (location_type IN ('container','room','other')),
  location_label text NOT NULL CHECK (length(btrim(location_label)) BETWEEN 1 AND 150),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 3 AND 2000),
  opened_at date NOT NULL DEFAULT CURRENT_DATE,
  status public.construction_issue_status NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS construction_issues_team_status_idx
  ON public.construction_issues(team_id, status, opened_at DESC);

DROP TRIGGER IF EXISTS construction_issues_touch ON public.construction_issues;
CREATE TRIGGER construction_issues_touch
  BEFORE UPDATE ON public.construction_issues
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.construction_issues ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.construction_issues TO authenticated;
GRANT ALL ON public.construction_issues TO service_role;

DROP POLICY IF EXISTS "members read own team construction issues" ON public.construction_issues;
CREATE POLICY "members read own team construction issues"
  ON public.construction_issues FOR SELECT TO authenticated
  USING (
    team_id = public.current_user_team_id()
    OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN')
  );

DROP POLICY IF EXISTS "members create own team construction issues" ON public.construction_issues;
CREATE POLICY "members create own team construction issues"
  ON public.construction_issues FOR INSERT TO authenticated
  WITH CHECK (team_id = public.current_user_team_id() AND created_by = auth.uid());

DROP POLICY IF EXISTS "members update own team construction issues" ON public.construction_issues;
CREATE POLICY "members update own team construction issues"
  ON public.construction_issues FOR UPDATE TO authenticated
  USING (
    team_id = public.current_user_team_id()
    OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN')
  )
  WITH CHECK (
    team_id = public.current_user_team_id()
    OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER','ADMIN')
  );

CREATE OR REPLACE FUNCTION public.team_month_spent(_team_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total), 0)::numeric
  FROM public.orders
  WHERE team_id = _team_id
    AND status IN ('approved','preparing','ready','completed')
    AND created_at >= date_trunc('month', now())
    AND created_at < date_trunc('month', now()) + interval '1 month'
$$;

REVOKE EXECUTE ON FUNCTION public.team_month_spent(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.team_month_spent(uuid) TO service_role;
