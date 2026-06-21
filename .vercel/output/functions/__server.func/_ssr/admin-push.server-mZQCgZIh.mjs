import { w as webpush } from "../_libs/web-push.mjs";
import "url";
import "../_libs/react.mjs";
import "crypto";
import "../_libs/asn1.js.mjs";
import "../_libs/bn.js.mjs";
import "../_libs/inherits.mjs";
import "../_libs/safer-buffer.mjs";
import "buffer";
import "../_libs/minimalistic-assert.mjs";
import "../_libs/jws.mjs";
import "../_libs/safe-buffer.mjs";
import "stream";
import "util";
import "../_libs/jwa.mjs";
import "../_libs/ecdsa-sig-formatter.mjs";
import "../_libs/buffer-equal-constant-time.mjs";
import "../_libs/http_ece.mjs";
import "https";
import "../_libs/https-proxy-agent.mjs";
import "tls";
import "assert";
import "net";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "os";
import "../_libs/has-flag.mjs";
import "../_libs/agent-base.mjs";
import "http";
let configured = false;
let configError = null;
function isValidSubject(s) {
  if (!s) return false;
  if (s.startsWith("mailto:")) return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  if (s.startsWith("https://")) {
    try {
      new URL(s);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
function ensureConfigured() {
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
  } catch (e) {
    configError = `VAPID setup failed: ${e?.message || e}`;
    return { ok: false, error: configError };
  }
}
async function sendPushToAdmins(eventType, payload) {
  try {
    const cfg = ensureConfigured();
    if (!cfg.ok) {
      console.warn("[admin push] not configured:", cfg.error);
      return { sent: 0, removed: 0, failed: 0 };
    }
    const { supabaseAdmin } = await import("./client.server-D0btppze.mjs");
    const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id, role").in("role", ["admin", "staff"]);
    const userIds = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));
    if (!userIds.length) return { sent: 0, removed: 0, failed: 0 };
    const { data: prefRows } = await supabaseAdmin.from("admin_notification_prefs").select("user_id, enabled, push_enabled").eq("event_type", eventType).in("user_id", userIds);
    const prefMap = /* @__PURE__ */ new Map();
    for (const r of prefRows ?? []) {
      prefMap.set(r.user_id, r.push_enabled ?? r.enabled);
    }
    const targets = userIds.filter((uid) => prefMap.get(uid) !== false);
    if (!targets.length) return { sent: 0, removed: 0, failed: 0 };
    const { data: subs } = await supabaseAdmin.from("admin_push_subscriptions").select("*").in("user_id", targets);
    if (!subs?.length) return { sent: 0, removed: 0, failed: 0 };
    let sent = 0, removed = 0, failed = 0;
    const body = JSON.stringify(payload);
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
        sent++;
      } catch (err) {
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
  } catch (e) {
    console.warn("[admin push] unexpected error:", e?.message);
    return { sent: 0, removed: 0, failed: 0 };
  }
}
export {
  sendPushToAdmins
};
