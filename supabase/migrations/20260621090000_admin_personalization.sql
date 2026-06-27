-- Per-administrator dashboard and appearance preferences.
CREATE TABLE IF NOT EXISTS public.admin_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_section text NOT NULL DEFAULT '/admin',
  visible_widgets jsonb NOT NULL DEFAULT '["kpis","attention","budgets","stock","recent_orders"]'::jsonb,
  widget_order jsonb NOT NULL DEFAULT '["kpis","attention","budgets","stock","recent_orders"]'::jsonb,
  pinned_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  saved_filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  compact_mode boolean NOT NULL DEFAULT false,
  reduced_animations boolean NOT NULL DEFAULT false,
  appearance text NOT NULL DEFAULT 'system' CHECK (appearance IN ('system','light','dark')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_preferences TO authenticated;
GRANT ALL ON public.admin_preferences TO service_role;
ALTER TABLE public.admin_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own admin preferences" ON public.admin_preferences;
CREATE POLICY "users manage own admin preferences"
  ON public.admin_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Expand existing per-user notification preferences to channel-level choices.
CREATE TABLE IF NOT EXISTS public.admin_notification_prefs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_type)
);

DROP POLICY IF EXISTS "users manage own notification prefs" ON public.admin_notification_prefs;
DROP POLICY IF EXISTS "admins read all notification prefs" ON public.admin_notification_prefs;

-- Repair CSV-created text IDs before policies compare them with auth.uid().
DELETE FROM public.admin_notification_prefs pref
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users account
  WHERE account.id::text = pref.user_id::text
);

ALTER TABLE public.admin_notification_prefs
  ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.admin_notification_prefs'::regclass
      AND conname = 'admin_notification_prefs_user_id_fkey'
  ) THEN
    ALTER TABLE public.admin_notification_prefs
      ADD CONSTRAINT admin_notification_prefs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notification_prefs TO authenticated;
GRANT ALL ON public.admin_notification_prefs TO service_role;
ALTER TABLE public.admin_notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own notification prefs"
  ON public.admin_notification_prefs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.admin_notification_prefs
  ADD COLUMN IF NOT EXISTS in_app_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_enabled boolean NOT NULL DEFAULT false;

UPDATE public.admin_notification_prefs
SET push_enabled = enabled
WHERE push_enabled IS DISTINCT FROM enabled;

ALTER TABLE public.admin_notification_prefs
  DROP CONSTRAINT IF EXISTS admin_notification_prefs_event_type_check;

ALTER TABLE public.admin_notification_prefs
  ADD CONSTRAINT admin_notification_prefs_event_type_check CHECK (
    event_type IN (
      'order_created',
      'order_awaiting_approval',
      'order_approved',
      'order_rejected',
      'order_ready',
      'order_cancelled',
      'budget_low',
      'budget_exceeded',
      'low_stock',
      'out_of_stock',
      'replacement_request',
      'system_alert'
    )
  );

CREATE INDEX IF NOT EXISTS admin_preferences_updated_at_idx
  ON public.admin_preferences(updated_at DESC);
