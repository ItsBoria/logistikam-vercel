-- Recurring calendar missions and idempotent selected-mission moves.
-- Existing missions and signatures are preserved unchanged.

CREATE TABLE IF NOT EXISTS public.recurring_mission_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 500),
  details text,
  due_time time,
  interval_weeks integer NOT NULL DEFAULT 1 CHECK (interval_weeks BETWEEN 1 AND 52),
  weekdays smallint[] NOT NULL CHECK (
    cardinality(weekdays) BETWEEN 1 AND 5
    AND weekdays <@ ARRAY[0,1,2,3,4]::smallint[]
  ),
  start_date date NOT NULL,
  end_date date,
  occurrence_limit integer CHECK (occurrence_limit IS NULL OR occurrence_limit BETWEEN 1 AND 1000),
  timezone text NOT NULL DEFAULT 'Asia/Jerusalem' CHECK (timezone = 'Asia/Jerusalem'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

ALTER TABLE public.recurring_mission_series ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_mission_series TO authenticated;
GRANT ALL ON public.recurring_mission_series TO service_role;

DROP POLICY IF EXISTS "owners manage recurring mission series" ON public.recurring_mission_series;
CREATE POLICY "owners manage recurring mission series"
  ON public.recurring_mission_series
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP TRIGGER IF EXISTS recurring_mission_series_touch ON public.recurring_mission_series;
CREATE TRIGGER recurring_mission_series_touch
  BEFORE UPDATE ON public.recurring_mission_series
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.recurring_mission_series(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS occurrence_date date,
  ADD COLUMN IF NOT EXISTS original_occurrence_date date,
  ADD COLUMN IF NOT EXISTS is_recurrence_exception boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_status text NOT NULL DEFAULT 'active'
    CHECK (recurrence_status IN ('active', 'moved', 'deleted')),
  ADD COLUMN IF NOT EXISTS moved_from_week_id uuid REFERENCES public.mission_weeks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moved_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS missions_series_original_occurrence_uniq
  ON public.missions(series_id, original_occurrence_date);

CREATE TABLE IF NOT EXISTS public.mission_move_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_token uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.missions(id) ON DELETE RESTRICT,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_week_id uuid NOT NULL REFERENCES public.mission_weeks(id) ON DELETE RESTRICT,
  source_day smallint NOT NULL CHECK (source_day BETWEEN 0 AND 4),
  destination_week_id uuid NOT NULL REFERENCES public.mission_weeks(id) ON DELETE RESTRICT,
  destination_day smallint NOT NULL CHECK (destination_day BETWEEN 0 AND 4),
  original_occurrence_date date,
  destination_date date NOT NULL,
  moved_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  moved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_token, mission_id)
);

ALTER TABLE public.mission_move_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.mission_move_history TO authenticated;
GRANT ALL ON public.mission_move_history TO service_role;

DROP POLICY IF EXISTS "owners read mission move history" ON public.mission_move_history;
CREATE POLICY "owners read mission move history"
  ON public.mission_move_history FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.move_selected_missions(
  p_source_week_id uuid,
  p_destination_week_id uuid,
  p_actor uuid,
  p_request_token uuid,
  p_assignments jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_week public.mission_weeks%ROWTYPE;
  destination_week public.mission_weeks%ROWTYPE;
  assignment jsonb;
  mission_row public.missions%ROWTYPE;
  destination_day integer;
  destination_date date;
  replacement_time time;
  conflict_id uuid;
  moved_count integer := 0;
BEGIN
  SELECT * INTO source_week FROM public.mission_weeks WHERE id = p_source_week_id FOR UPDATE;
  SELECT * INTO destination_week FROM public.mission_weeks WHERE id = p_destination_week_id FOR UPDATE;

  IF source_week.id IS NULL OR destination_week.id IS NULL THEN
    RAISE EXCEPTION 'Calendar week not found';
  END IF;
  IF source_week.owner_user_id <> p_actor OR destination_week.owner_user_id <> p_actor THEN
    RAISE EXCEPTION 'Only the calendar owner may move missions';
  END IF;
  IF source_week.locked OR source_week.author_signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'The source calendar is signed or locked';
  END IF;
  IF destination_week.locked OR destination_week.author_signed_at IS NOT NULL THEN
    RAISE EXCEPTION 'The destination calendar is signed or locked';
  END IF;
  IF jsonb_typeof(p_assignments) <> 'array' OR jsonb_array_length(p_assignments) < 1 THEN
    RAISE EXCEPTION 'At least one mission must be selected';
  END IF;

  FOR assignment IN SELECT value FROM jsonb_array_elements(p_assignments)
  LOOP
    destination_day := (assignment->>'destination_day')::integer;
    destination_date := (assignment->>'destination_date')::date;
    replacement_time := NULLIF(assignment->>'due_time', '')::time;
    IF destination_day NOT BETWEEN 0 AND 4 THEN
      RAISE EXCEPTION 'Friday is not a valid workday';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.mission_move_history
      WHERE request_token = p_request_token
        AND mission_id = (assignment->>'mission_id')::uuid
    ) THEN
      CONTINUE;
    END IF;

    SELECT * INTO mission_row
    FROM public.missions
    WHERE id = (assignment->>'mission_id')::uuid
      AND week_id = p_source_week_id
      AND done = false
      AND recurrence_status <> 'deleted'
    FOR UPDATE;

    IF mission_row.id IS NULL THEN
      RAISE EXCEPTION 'Mission % is unavailable or was already moved', assignment->>'mission_id';
    END IF;

    IF mission_row.series_id IS NOT NULL THEN
      conflict_id := NULL;
      SELECT id INTO conflict_id
      FROM public.missions
      WHERE series_id = mission_row.series_id
        AND occurrence_date = destination_date
        AND id <> mission_row.id
        AND recurrence_status <> 'deleted'
      LIMIT 1
      FOR UPDATE;

      IF conflict_id IS NOT NULL AND COALESCE(assignment->>'conflict_resolution', '') = '' THEN
        RAISE EXCEPTION 'A recurring occurrence already exists on the destination date';
      END IF;
      IF conflict_id IS NOT NULL AND assignment->>'conflict_resolution' = 'replace' THEN
        UPDATE public.missions SET recurrence_status = 'deleted' WHERE id = conflict_id;
      END IF;
      IF assignment->>'recurrence_scope' = 'future' THEN
        UPDATE public.recurring_mission_series
        SET weekdays = ARRAY[destination_day]::smallint[]
        WHERE id = mission_row.series_id AND owner_user_id = p_actor;
      END IF;
    END IF;

    INSERT INTO public.mission_move_history (
      request_token, mission_id, owner_user_id,
      source_week_id, source_day, destination_week_id, destination_day,
      original_occurrence_date, destination_date, moved_by
    ) VALUES (
      p_request_token, mission_row.id, p_actor,
      p_source_week_id, mission_row.day_of_week, p_destination_week_id, destination_day,
      mission_row.occurrence_date, destination_date, p_actor
    );

    UPDATE public.missions SET
      week_id = p_destination_week_id,
      day_of_week = destination_day,
      due_time = COALESCE(replacement_time, due_time),
      done = false,
      position = COALESCE((
        SELECT max(position) + 1 FROM public.missions
        WHERE week_id = p_destination_week_id AND day_of_week = destination_day
      ), 0),
      moved_from_week_id = p_source_week_id,
      moved_by = p_actor,
      moved_at = now(),
      occurrence_date = destination_date,
      original_occurrence_date = COALESCE(original_occurrence_date, occurrence_date, destination_date),
      is_recurrence_exception = (series_id IS NOT NULL),
      recurrence_status = CASE WHEN series_id IS NOT NULL THEN 'moved' ELSE recurrence_status END
    WHERE id = mission_row.id;
    moved_count := moved_count + 1;
  END LOOP;

  RETURN jsonb_build_object('moved', moved_count);
END;
$$;

REVOKE ALL ON FUNCTION public.move_selected_missions(uuid,uuid,uuid,uuid,jsonb) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.move_selected_missions(uuid,uuid,uuid,uuid,jsonb) TO service_role;
