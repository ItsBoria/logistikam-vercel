import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import "../_libs/react.mjs";
import { o as objectType, e as enumType, b as booleanType, r as recordType, u as unknownType, a as arrayType, s as stringType } from "../_libs/zod.mjs";
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
const DASHBOARD_WIDGETS = ["kpis", "attention", "budgets", "stock", "recent_orders"];
const DEFAULTS = {
  default_section: "/admin",
  visible_widgets: [...DASHBOARD_WIDGETS],
  widget_order: [...DASHBOARD_WIDGETS],
  pinned_actions: [],
  saved_filters: {},
  compact_mode: false,
  reduced_animations: false,
  appearance: "system"
};
async function assertAdminOrStaff(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "staff"]);
  if (!data?.length) throw new Error("גישה מורשית בלבד");
}
const preferencesSchema = objectType({
  default_section: enumType(["/admin", "/admin/orders", "/admin/stock", "/admin/products", "/admin/notifications"]),
  visible_widgets: arrayType(enumType(DASHBOARD_WIDGETS)).max(DASHBOARD_WIDGETS.length),
  widget_order: arrayType(enumType(DASHBOARD_WIDGETS)).length(DASHBOARD_WIDGETS.length),
  pinned_actions: arrayType(stringType().max(80)).max(8),
  saved_filters: recordType(unknownType()),
  compact_mode: booleanType(),
  reduced_animations: booleanType(),
  appearance: enumType(["system", "light", "dark"])
});
const getMyAdminPreferences_createServerFn_handler = createServerRpc({
  id: "b27e584f3e28b1c9c506479d4c2d4654b61d757887d35c148eeae4dd648fe418",
  name: "getMyAdminPreferences",
  filename: "src/lib/admin-preferences.functions.ts"
}, (opts) => getMyAdminPreferences.__executeServer(opts));
const getMyAdminPreferences = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyAdminPreferences_createServerFn_handler, async ({
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data,
    error
  } = await supabaseAdmin.from("admin_preferences").select("*").eq("user_id", context.userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return DEFAULTS;
  const order = Array.isArray(data.widget_order) ? data.widget_order : DEFAULTS.widget_order;
  const completeOrder = [...order.filter((v) => DASHBOARD_WIDGETS.includes(v)), ...DASHBOARD_WIDGETS.filter((v) => !order.includes(v))];
  return {
    ...DEFAULTS,
    ...data,
    visible_widgets: Array.isArray(data.visible_widgets) ? data.visible_widgets : DEFAULTS.visible_widgets,
    widget_order: completeOrder,
    pinned_actions: Array.isArray(data.pinned_actions) ? data.pinned_actions : [],
    saved_filters: data.saved_filters && typeof data.saved_filters === "object" ? data.saved_filters : {}
  };
});
const saveMyAdminPreferences_createServerFn_handler = createServerRpc({
  id: "c09cae8e410593a306cdd2a6b783fb2840ceed21e7299e0ac7c18280919028df",
  name: "saveMyAdminPreferences",
  filename: "src/lib/admin-preferences.functions.ts"
}, (opts) => saveMyAdminPreferences.__executeServer(opts));
const saveMyAdminPreferences = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => preferencesSchema.parse(input)).handler(saveMyAdminPreferences_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("admin_preferences").upsert({
    user_id: context.userId,
    ...data,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    onConflict: "user_id"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  getMyAdminPreferences_createServerFn_handler,
  saveMyAdminPreferences_createServerFn_handler
};
