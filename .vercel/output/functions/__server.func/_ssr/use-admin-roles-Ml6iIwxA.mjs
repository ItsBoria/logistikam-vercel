import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import { u as useSupabaseSession } from "./membership.functions-B7i6fyJs.mjs";
import { o as objectType, b as booleanType, s as stringType, e as enumType } from "../_libs/zod.mjs";
const ADMIN_EVENT_TYPES = ["order_created", "order_awaiting_approval", "order_approved", "order_rejected", "order_ready", "order_cancelled", "budget_low", "budget_exceeded", "low_stock", "out_of_stock", "replacement_request", "system_alert"];
const EVENT_TYPES = ADMIN_EVENT_TYPES;
const eventTypeSchema = enumType(EVENT_TYPES);
const channelSchema = enumType(["in_app_enabled", "push_enabled", "email_enabled"]);
const getMyNotificationPrefs = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("b05310f1157cc93a8c30ec02b13c1b2058587dfa275257bf9f1d8e38ee847f2f"));
const setMyNotificationPref = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  event_type: eventTypeSchema,
  channel: channelSchema,
  enabled: booleanType()
}).parse(input)).handler(createSsrRpc("b1ed414e776e311b1c7a661f7a5c01f3570efec280992851e770c27bb6d52aca"));
const subscribeAdminPush = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  endpoint: stringType().url().max(2e3),
  p256dh: stringType().min(1).max(500),
  auth: stringType().min(1).max(500)
}).parse(input)).handler(createSsrRpc("de4886b4722fe52dcfc603986a7a12e3817a39089c99166db8ecb6b17bab9c0c"));
const unsubscribeAdminPush = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  endpoint: stringType().url()
}).parse(input)).handler(createSsrRpc("bb4b29fa84b84d5d3482124dd83f2848df08ec054927ae95cb89491a2c094c34"));
const sendTestAdminPush = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("df93e4b34209e989eccf407624ce948a7016aeba7725b4556a483a7fd5079d86"));
createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("d1ad23882c5b2ed10b6351f876a9a9df7611841230f558241ca6051d790b77ee"));
const getMyAdminRoles = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("6c306d0d5ff4e9471d5ed120945595f9ad89ff1d30f375df50760b0faa6025e9"));
function useAdminRoles() {
  const { session } = useSupabaseSession();
  const fn = useServerFn(getMyAdminRoles);
  const q = useQuery({
    enabled: !!session,
    queryKey: ["my-admin-roles", session?.user.id],
    queryFn: () => fn(),
    staleTime: 6e4
  });
  return {
    session,
    loading: !!session && q.isLoading,
    data: q.data
  };
}
export {
  subscribeAdminPush as a,
  unsubscribeAdminPush as b,
  sendTestAdminPush as c,
  getMyNotificationPrefs as g,
  setMyNotificationPref as s,
  useAdminRoles as u
};
