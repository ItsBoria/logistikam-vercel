import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
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
const getVapidPublicKey_createServerFn_handler = createServerRpc({
  id: "78cc8d1f6340d6a3afbbfa56eb27d07047d617e75a30cf50925c68148d0e296a",
  name: "getVapidPublicKey",
  filename: "src/lib/push.functions.ts"
}, (opts) => getVapidPublicKey.__executeServer(opts));
const getVapidPublicKey = createServerFn({
  method: "GET"
}).handler(getVapidPublicKey_createServerFn_handler, async () => {
  const key = (process.env.VAPID_PUBLIC_KEY || "").trim();
  if (!key) return {
    key: "",
    error: "VAPID_PUBLIC_KEY לא הוגדר בשרת"
  };
  if (!/^[A-Za-z0-9_-]+$/.test(key)) {
    return {
      key: "",
      error: "VAPID_PUBLIC_KEY מכיל תווים לא חוקיים"
    };
  }
  return {
    key
  };
});
const subSchema = objectType({
  pin: stringType().min(1).max(32),
  endpoint: stringType().url().max(2e3),
  p256dh: stringType().min(1).max(500),
  auth: stringType().min(1).max(500)
});
const subscribePush_createServerFn_handler = createServerRpc({
  id: "20d552c35a38dd47e4edd6ef7a4daca2264e2218f13a0923265709959b22832a",
  name: "subscribePush",
  filename: "src/lib/push.functions.ts"
}, (opts) => subscribePush.__executeServer(opts));
const subscribePush = createServerFn({
  method: "POST"
}).inputValidator((input) => subSchema.parse(input)).handler(subscribePush_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, active").eq("pin", data.pin.trim()).maybeSingle();
  if (!team || !team.active) throw new Error("צוות לא תקין");
  const {
    error
  } = await supabaseAdmin.from("push_subscriptions").upsert({
    team_id: team.id,
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
const unsubscribePush_createServerFn_handler = createServerRpc({
  id: "8715e07497c3562a6ef2a16117120f69295676a0b698d567b2651be0cf3c9999",
  name: "unsubscribePush",
  filename: "src/lib/push.functions.ts"
}, (opts) => unsubscribePush.__executeServer(opts));
const unsubscribePush = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  endpoint: stringType().url()
}).parse(input)).handler(unsubscribePush_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
  return {
    ok: true
  };
});
const sendTestPush_createServerFn_handler = createServerRpc({
  id: "f58b21b44b8a2a06145fee076324bf6c4b16dc1ba81aa78a98b43fae6cea4152",
  name: "sendTestPush",
  filename: "src/lib/push.functions.ts"
}, (opts) => sendTestPush.__executeServer(opts));
const sendTestPush = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1).max(32)
}).parse(input)).handler(sendTestPush_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data: team
  } = await supabaseAdmin.from("teams").select("id, name").eq("pin", data.pin.trim()).maybeSingle();
  if (!team) throw new Error("צוות לא תקין");
  const {
    sendPushToTeam
  } = await import("./push.server-De5oApd4.mjs");
  const res = await sendPushToTeam(team.id, {
    title: "התראת בדיקה",
    body: `שלום ${team.name}, ההתראות פועלות 🎉`,
    url: "/shop/orders"
  });
  if (res.sent === 0 && res.error) {
    throw new Error(res.error);
  }
  return res;
});
export {
  getVapidPublicKey_createServerFn_handler,
  sendTestPush_createServerFn_handler,
  subscribePush_createServerFn_handler,
  unsubscribePush_createServerFn_handler
};
