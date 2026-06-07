import webpush from "web-push";

let configured = false;
let configError: string | null = null;

function isValidSubject(s: string): boolean {
  if (!s) return false;
  if (s.startsWith("mailto:")) return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  if (s.startsWith("https://")) {
    try { new URL(s); return true; } catch { return false; }
  }
  return false;
}

function ensureConfigured(): { ok: boolean; error?: string } {
  if (configured) return { ok: true };
  if (configError) return { ok: false, error: configError };
  const pub = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
  let subject = (process.env.VAPID_SUBJECT || "").trim();
  if (!pub || !priv) {
    configError = "VAPID keys not configured";
    return { ok: false, error: configError };
  }
  if (!isValidSubject(subject)) {
    subject = "mailto:admin@logistikam.lovable.app";
  }
  try {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
    return { ok: true };
  } catch (e: any) {
    configError = `VAPID setup failed: ${e?.message || e}`;
    return { ok: false, error: configError };
  }
}

export type AdminEventType =
  | "order_created"
  | "order_awaiting_approval"
  | "low_stock"
  | "replacement_request";

/**
 * Send a push to every admin/staff user who has the event enabled.
 * Best-effort, never throws.
 */
export async function sendPushToAdmins(
  eventType: AdminEventType,
  payload: { title: string; body: string; url?: string },
) {
  try {
    const cfg = ensureConfigured();
    if (!cfg.ok) {
      console.warn("[admin push] not configured:", cfg.error);
      return { sent: 0, removed: 0, failed: 0 };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find all admin + staff user ids
    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "staff"]);
    const userIds = Array.from(new Set((roleRows ?? []).map((r: any) => r.user_id)));
    if (!userIds.length) return { sent: 0, removed: 0, failed: 0 };

    // Filter to users with this event enabled (or no row = default ON)
    const { data: prefRows } = await supabaseAdmin
      .from("admin_notification_prefs")
      .select("user_id, enabled")
      .eq("event_type", eventType)
      .in("user_id", userIds);
    const prefMap = new Map<string, boolean>();
    for (const r of prefRows ?? []) prefMap.set((r as any).user_id, (r as any).enabled);

    const targets = userIds.filter((uid) => prefMap.get(uid) !== false); // default ON
    if (!targets.length) return { sent: 0, removed: 0, failed: 0 };

    const { data: subs } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .select("*")
      .in("user_id", targets);
    if (!subs?.length) return { sent: 0, removed: 0, failed: 0 };

    let sent = 0, removed = 0, failed = 0;
    const body = JSON.stringify(payload);
    await Promise.all(subs.map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabaseAdmin.from("admin_push_subscriptions").delete().eq("id", s.id);
          removed++;
        } else {
          failed++;
          console.error("[admin push] send failed:", err?.statusCode, err?.message);
        }
      }
    }));
    return { sent, removed, failed };
  } catch (e: any) {
    console.warn("[admin push] unexpected error:", e?.message);
    return { sent: 0, removed: 0, failed: 0 };
  }
}
