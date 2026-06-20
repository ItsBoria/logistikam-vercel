import webpush from "web-push";

let configured = false;
let configError: string | null = null;

function isValidSubject(s: string): boolean {
  if (!s) return false;
  if (s.startsWith("mailto:")) {
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }
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
  const subject = (process.env.VAPID_SUBJECT || "").trim();

  if (!pub || !priv) {
    configError = "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY לא הוגדרו בשרת";
    return { ok: false, error: configError };
  }
  if (!isValidSubject(subject)) {
    configError = "VAPID_SUBJECT חייב להיות כתובת mailto: או https:// תקינה";
    return { ok: false, error: configError };
  }
  try {
    webpush.setVapidDetails(subject, pub, priv);
    configured = true;
    return { ok: true };
  } catch (e: any) {
    configError = `הגדרת VAPID נכשלה: ${e?.message || e}`;
    return { ok: false, error: configError };
  }
}

export async function sendPushToTeam(teamId: string, payload: { title: string; body: string; url?: string }) {
  const cfg = ensureConfigured();
  if (!cfg.ok) {
    console.warn("[push] not configured:", cfg.error);
    return { sent: 0, removed: 0, failed: 0, error: cfg.error };
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions").select("*").eq("team_id", teamId);
  if (!subs?.length) return { sent: 0, removed: 0, failed: 0, error: "אין מכשירים רשומים לצוות זה" };

  let sent = 0, removed = 0, failed = 0;
  let lastErr: string | null = null;
  const body = JSON.stringify(payload);
  await Promise.all(subs.map(async (s: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body
      );
      sent++;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
        removed++;
      } else {
        failed++;
        lastErr = `${err?.statusCode ?? ""} ${err?.body || err?.message || err}`.trim();
        console.error("[push] send failed:", err?.statusCode, err?.message, err?.body);
      }
    }
  }));
  return { sent, removed, failed, error: failed > 0 ? lastErr : undefined };
}
