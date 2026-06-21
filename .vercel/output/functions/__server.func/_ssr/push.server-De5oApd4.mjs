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
  if (s.startsWith("mailto:")) {
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }
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
  } catch (e) {
    configError = `הגדרת VAPID נכשלה: ${e?.message || e}`;
    return { ok: false, error: configError };
  }
}
async function sendPushToTeam(teamId, payload) {
  const cfg = ensureConfigured();
  if (!cfg.ok) {
    console.warn("[push] not configured:", cfg.error);
    return { sent: 0, removed: 0, failed: 0, error: cfg.error };
  }
  const { supabaseAdmin } = await import("./client.server-D0btppze.mjs");
  const { data: subs } = await supabaseAdmin.from("push_subscriptions").select("*").eq("team_id", teamId);
  if (!subs?.length) return { sent: 0, removed: 0, failed: 0, error: "אין מכשירים רשומים לצוות זה" };
  let sent = 0, removed = 0, failed = 0;
  let lastErr = null;
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
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", s.id);
        removed++;
      } else {
        failed++;
        lastErr = `${err?.statusCode ?? ""} ${err?.body || err?.message || err}`.trim();
        console.error("[push] send failed:", err?.statusCode, err?.message, err?.body);
      }
    }
  }));
  return { sent, removed, failed, error: failed > 0 ? lastErr : void 0 };
}
export {
  sendPushToTeam
};
