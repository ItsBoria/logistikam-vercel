import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import "../_libs/react.mjs";
import { e as enumType, o as objectType, b as booleanType, s as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "node:stream";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "node:stream/web";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const ADMIN_EVENT_TYPES = ["order_created", "order_awaiting_approval", "order_approved", "order_rejected", "order_ready", "order_cancelled", "budget_low", "budget_exceeded", "low_stock", "out_of_stock", "replacement_request", "system_alert"];
const EVENT_TYPES = ADMIN_EVENT_TYPES;
const eventTypeSchema = enumType(EVENT_TYPES);
const channelSchema = enumType(["in_app_enabled", "push_enabled", "email_enabled"]);
async function assertAdminOrStaff(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "staff"]);
  if (!data || data.length === 0) throw new Error("גישה מורשית בלבד");
}
const getMyNotificationPrefs_createServerFn_handler = createServerRpc({
  id: "b05310f1157cc93a8c30ec02b13c1b2058587dfa275257bf9f1d8e38ee847f2f",
  name: "getMyNotificationPrefs",
  filename: "src/lib/admin-notifications.functions.ts"
}, (opts) => getMyNotificationPrefs.__executeServer(opts));
const getMyNotificationPrefs = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyNotificationPrefs_createServerFn_handler, async ({
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("admin_notification_prefs").select("event_type, enabled, in_app_enabled, push_enabled, email_enabled").eq("user_id", context.userId);
  const map = {};
  for (const evt of EVENT_TYPES) {
    map[evt] = {
      in_app_enabled: true,
      push_enabled: true,
      email_enabled: false
    };
  }
  for (const row of data ?? []) {
    map[row.event_type] = {
      in_app_enabled: row.in_app_enabled ?? true,
      push_enabled: row.push_enabled ?? row.enabled ?? true,
      email_enabled: row.email_enabled ?? false
    };
  }
  return map;
});
const setMyNotificationPref_createServerFn_handler = createServerRpc({
  id: "b1ed414e776e311b1c7a661f7a5c01f3570efec280992851e770c27bb6d52aca",
  name: "setMyNotificationPref",
  filename: "src/lib/admin-notifications.functions.ts"
}, (opts) => setMyNotificationPref.__executeServer(opts));
const setMyNotificationPref = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  event_type: eventTypeSchema,
  channel: channelSchema,
  enabled: booleanType()
}).parse(input)).handler(setMyNotificationPref_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const payload = {
    user_id: context.userId,
    event_type: data.event_type,
    [data.channel]: data.enabled,
    ...data.channel === "push_enabled" ? {
      enabled: data.enabled
    } : {},
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const {
    error
  } = await supabaseAdmin.from("admin_notification_prefs").upsert(payload, {
    onConflict: "user_id,event_type"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const subscribeAdminPush_createServerFn_handler = createServerRpc({
  id: "de4886b4722fe52dcfc603986a7a12e3817a39089c99166db8ecb6b17bab9c0c",
  name: "subscribeAdminPush",
  filename: "src/lib/admin-notifications.functions.ts"
}, (opts) => subscribeAdminPush.__executeServer(opts));
const subscribeAdminPush = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  endpoint: stringType().url().max(2e3),
  p256dh: stringType().min(1).max(500),
  auth: stringType().min(1).max(500)
}).parse(input)).handler(subscribeAdminPush_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("admin_push_subscriptions").upsert({
    user_id: context.userId,
    endpoint: data.endpoint,
    p256dh: data.p256dh,
    auth: data.auth
  }, {
    onConflict: "endpoint"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const unsubscribeAdminPush_createServerFn_handler = createServerRpc({
  id: "bb4b29fa84b84d5d3482124dd83f2848df08ec054927ae95cb89491a2c094c34",
  name: "unsubscribeAdminPush",
  filename: "src/lib/admin-notifications.functions.ts"
}, (opts) => unsubscribeAdminPush.__executeServer(opts));
const unsubscribeAdminPush = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  endpoint: stringType().url()
}).parse(input)).handler(unsubscribeAdminPush_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  await supabaseAdmin.from("admin_push_subscriptions").delete().eq("endpoint", data.endpoint).eq("user_id", context.userId);
  return {
    ok: true
  };
});
const sendTestAdminPush_createServerFn_handler = createServerRpc({
  id: "df93e4b34209e989eccf407624ce948a7016aeba7725b4556a483a7fd5079d86",
  name: "sendTestAdminPush",
  filename: "src/lib/admin-notifications.functions.ts"
}, (opts) => sendTestAdminPush.__executeServer(opts));
const sendTestAdminPush = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(sendTestAdminPush_createServerFn_handler, async ({
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: subs
  } = await supabaseAdmin.from("admin_push_subscriptions").select("*").eq("user_id", context.userId);
  if (!subs?.length) throw new Error("לא קיימים מכשירים רשומים");
  const webpush = (await import("../_libs/web-push.mjs").then(function(n) {
    return n.i;
  })).default;
  const pub = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
  let subject = (process.env.VAPID_SUBJECT || "").trim();
  if (!pub || !priv) throw new Error("VAPID לא מוגדר בשרת");
  if (!/^mailto:|^https:\/\//.test(subject)) subject = "mailto:admin@logistikam.lovable.app";
  webpush.setVapidDetails(subject, pub, priv);
  const body = JSON.stringify({
    title: "התראת בדיקה",
    body: "התראות מנהל פעילות 🎉",
    url: "/admin"
  });
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({
        endpoint: s.endpoint,
        keys: {
          p256dh: s.p256dh,
          auth: s.auth
        }
      }, body);
      sent++;
    } catch (err) {
      console.error("[admin push test] failed:", err?.statusCode, err?.message);
    }
  }
  if (sent === 0) throw new Error("שליחת ההתראה נכשלה");
  return {
    sent
  };
});
const getLowStockList_createServerFn_handler = createServerRpc({
  id: "d1ad23882c5b2ed10b6351f876a9a9df7611841230f558241ca6051d790b77ee",
  name: "getLowStockList",
  filename: "src/lib/admin-notifications.functions.ts"
}, (opts) => getLowStockList.__executeServer(opts));
const getLowStockList = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getLowStockList_createServerFn_handler, async ({
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: settingRow
  } = await supabaseAdmin.from("app_settings").select("value").eq("key", "default_low_stock_threshold").maybeSingle();
  const defaultThreshold = Number(settingRow?.value ?? 5);
  const {
    data: products
  } = await supabaseAdmin.from("products").select("id, name, stock, low_stock_threshold, category").eq("active", true);
  const list = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
    category: p.category,
    effective_threshold: p.low_stock_threshold ?? defaultThreshold
  })).filter((p) => p.stock <= p.effective_threshold).sort((a, b) => a.stock - b.stock);
  return {
    defaultThreshold,
    items: list
  };
});
const getMyAdminRoles_createServerFn_handler = createServerRpc({
  id: "6c306d0d5ff4e9471d5ed120945595f9ad89ff1d30f375df50760b0faa6025e9",
  name: "getMyAdminRoles",
  filename: "src/lib/admin-notifications.functions.ts"
}, (opts) => getMyAdminRoles.__executeServer(opts));
const getMyAdminRoles = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyAdminRoles_createServerFn_handler, async ({
  context
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
  const roles = (data ?? []).map((r) => r.role);
  return {
    roles,
    isAdmin: roles.includes("admin"),
    isStaff: roles.includes("staff"),
    hasAccess: roles.length > 0
  };
});
export {
  getLowStockList_createServerFn_handler,
  getMyAdminRoles_createServerFn_handler,
  getMyNotificationPrefs_createServerFn_handler,
  sendTestAdminPush_createServerFn_handler,
  setMyNotificationPref_createServerFn_handler,
  subscribeAdminPush_createServerFn_handler,
  unsubscribeAdminPush_createServerFn_handler
};
