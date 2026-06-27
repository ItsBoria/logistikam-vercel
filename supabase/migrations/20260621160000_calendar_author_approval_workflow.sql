-- Two-step weekly calendar workflow:
-- ADMIN authors manage/sign their own calendar; OWNER/WORK_MANAGER approve afterward.

DROP POLICY IF EXISTS "work managers read mission weeks" ON public.mission_weeks;
DROP POLICY IF EXISTS "work managers create own mission weeks" ON public.mission_weeks;
DROP POLICY IF EXISTS "work managers update owned or approvable mission weeks" ON public.mission_weeks;
DROP POLICY IF EXISTS "work managers delete own mission weeks" ON public.mission_weeks;
DROP POLICY IF EXISTS "Admins manage mission_weeks" ON public.mission_weeks;
DROP POLICY IF EXISTS "mission_weeks_select" ON public.mission_weeks;
DROP POLICY IF EXISTS "mission_weeks_insert" ON public.mission_weeks;
DROP POLICY IF EXISTS "mission_weeks_update" ON public.mission_weeks;
DROP POLICY IF EXISTS "mission_weeks_delete" ON public.mission_weeks;

CREATE POLICY "privileged users read mission weeks" ON public.mission_weeks
FOR SELECT TO authenticated
USING (
  public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER')
  OR (
    public.has_min_role(auth.uid(), 'ADMIN')
    AND owner_user_id::text = auth.uid()::text
  )
);

CREATE POLICY "calendar authors create own weeks" ON public.mission_weeks
FOR INSERT TO authenticated
WITH CHECK (
  public.has_min_role(auth.uid(), 'ADMIN')
  AND owner_user_id::text = auth.uid()::text
);

CREATE POLICY "calendar authors and approvers update weeks" ON public.mission_weeks
FOR UPDATE TO authenticated
USING (
  public.has_min_role(auth.uid(), 'ADMIN')
  AND (
    owner_user_id::text = auth.uid()::text
    OR public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER')
  )
)
WITH CHECK (public.has_min_role(auth.uid(), 'ADMIN'));

CREATE POLICY "calendar authors delete own weeks" ON public.mission_weeks
FOR DELETE TO authenticated
USING (
  public.has_min_role(auth.uid(), 'ADMIN')
  AND owner_user_id::text = auth.uid()::text
);

DROP POLICY IF EXISTS "work managers read missions" ON public.missions;
DROP POLICY IF EXISTS "work managers edit owned missions" ON public.missions;
DROP POLICY IF EXISTS "Admins manage missions" ON public.missions;
DROP POLICY IF EXISTS "missions_select" ON public.missions;
DROP POLICY IF EXISTS "missions_write" ON public.missions;

CREATE POLICY "privileged users read missions" ON public.missions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mission_weeks week
    WHERE week.id::text = missions.week_id::text
      AND (
        public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER')
        OR week.owner_user_id::text = auth.uid()::text
      )
  )
);

CREATE POLICY "calendar authors edit own missions" ON public.missions
FOR ALL TO authenticated
USING (
  public.has_min_role(auth.uid(), 'ADMIN')
  AND EXISTS (
    SELECT 1 FROM public.mission_weeks week
    WHERE week.id::text = missions.week_id::text
      AND week.owner_user_id::text = auth.uid()::text
      AND week.locked = false
      AND week.author_signed_at IS NULL
  )
)
WITH CHECK (
  public.has_min_role(auth.uid(), 'ADMIN')
  AND EXISTS (
    SELECT 1 FROM public.mission_weeks week
    WHERE week.id::text = missions.week_id::text
      AND week.owner_user_id::text = auth.uid()::text
      AND week.locked = false
      AND week.author_signed_at IS NULL
  )
);

DROP POLICY IF EXISTS "work managers read day notes" ON public.mission_day_notes;
DROP POLICY IF EXISTS "work managers edit owned day notes" ON public.mission_day_notes;
DROP POLICY IF EXISTS "admins read day notes" ON public.mission_day_notes;
DROP POLICY IF EXISTS "owner edits day notes" ON public.mission_day_notes;

CREATE POLICY "privileged users read day notes" ON public.mission_day_notes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.mission_weeks week
    WHERE week.id::text = mission_day_notes.week_id::text
      AND (
        public.current_role_code(auth.uid()) IN ('OWNER','WORK_MANAGER')
        OR week.owner_user_id::text = auth.uid()::text
      )
  )
);

CREATE POLICY "calendar authors edit own day notes" ON public.mission_day_notes
FOR ALL TO authenticated
USING (
  public.has_min_role(auth.uid(), 'ADMIN')
  AND EXISTS (
    SELECT 1 FROM public.mission_weeks week
    WHERE week.id::text = mission_day_notes.week_id::text
      AND week.owner_user_id::text = auth.uid()::text
      AND week.locked = false
      AND week.author_signed_at IS NULL
  )
)
WITH CHECK (
  public.has_min_role(auth.uid(), 'ADMIN')
  AND EXISTS (
    SELECT 1 FROM public.mission_weeks week
    WHERE week.id::text = mission_day_notes.week_id::text
      AND week.owner_user_id::text = auth.uid()::text
      AND week.locked = false
      AND week.author_signed_at IS NULL
  )
);

CREATE OR REPLACE FUNCTION public.validate_calendar_signature_transition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid := auth.uid(); actor_role text := public.current_role_code(auth.uid());
BEGIN
  IF OLD.author_signed_at IS NOT NULL AND (
    NEW.notes IS DISTINCT FROM OLD.notes
    OR NEW.owner_user_id::text IS DISTINCT FROM OLD.owner_user_id::text
  ) THEN
    RAISE EXCEPTION 'Signed calendar content cannot be edited before reopening';
  END IF;

  IF NEW.author_signed_at IS NULL
     AND NEW.approver_signed_at IS NULL
     AND (OLD.author_signed_at IS NOT NULL OR OLD.approver_signed_at IS NOT NULL)
     AND (
       NEW.owner_user_id::text = actor::text
       OR actor_role IN ('OWNER','WORK_MANAGER')
     ) THEN
    RETURN NEW;
  END IF;

  IF NEW.author_signed_at IS DISTINCT FROM OLD.author_signed_at
     OR NEW.author_signature_name IS DISTINCT FROM OLD.author_signature_name THEN
    IF actor IS NULL OR NEW.owner_user_id::text <> actor::text
       OR public.role_level(actor_role) < public.role_level('ADMIN') THEN
      RAISE EXCEPTION 'Only the calendar author may apply the author signature';
    END IF;
  END IF;

  IF NEW.approver_signed_at IS DISTINCT FROM OLD.approver_signed_at
     OR NEW.approver_signature_name IS DISTINCT FROM OLD.approver_signature_name
     OR NEW.approver_user_id::text IS DISTINCT FROM OLD.approver_user_id::text THEN
    IF actor IS NULL OR actor_role NOT IN ('OWNER','WORK_MANAGER') THEN
      RAISE EXCEPTION 'Only OWNER or WORK_MANAGER may approve a calendar';
    END IF;
    IF NEW.owner_user_id::text = actor::text THEN
      RAISE EXCEPTION 'A calendar author cannot approve their own calendar';
    END IF;
    IF NEW.author_signed_at IS NULL THEN
      RAISE EXCEPTION 'Author signature is required before approval';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS validate_calendar_signature_transition_trigger ON public.mission_weeks;
CREATE TRIGGER validate_calendar_signature_transition_trigger
BEFORE UPDATE ON public.mission_weeks
FOR EACH ROW EXECUTE FUNCTION public.validate_calendar_signature_transition();
