import { c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
const listCalendarAdmins = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("eb5db522c41e23e0293ccb4246d723a57342303f1b782efcdd25e48d7c8c6348"));
const setAdminApprover = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("1bbf4378a94b7417d111929d2d7485ad60792577b2b7ab21348058c79acf6e10"));
const getMissionWeek = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("db98f2190d31cc35f97945a7055400becf63ce3176b8d1c0d5f850357a02f1c6"));
const upsertMission = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("a5ed5c58f2d3155e4cd1c6941c19d04a98b1d40d76925ebb07b9e989809f91e5"));
const deleteMission = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("d5c24608b724b4a16bd4b2ba1a9924d97e24980a72438cc34c272fce6ee3f3b8"));
const toggleMissionDone = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("3e9a621029a7b4fa40813a191b9fd6a5db90bb0cd9bfa58e750c656ad7fbfd6b"));
const updateWeekNotes = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("62ed565fe2cf94948845909d84aefc82559dd325ac0787d8973e9512f43cfebc"));
const upsertDayNote = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("b371f2820743202066a418d7d2e4dbaf3a7422e89835a1753bd95b1426b3fd09"));
const signMissionWeek = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("db8b8fad7cf4865e13f446bc7ebff0e8bd7ff102d85ba7a504a8a05f55c7c7c6"));
const reopenMissionWeek = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("d77cfd6de4b2bb960bd327b009d81f5561c4db8aa0cbfca5e1d58ed5bfc7da58"));
const carryUnfinishedToNextWeek = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => d).handler(createSsrRpc("9fe50af1be0f1ef10757123f076faf991476a92e31a9dca59697722b888ea8a8"));
export {
  updateWeekNotes as a,
  signMissionWeek as b,
  upsertDayNote as c,
  deleteMission as d,
  carryUnfinishedToNextWeek as e,
  getMissionWeek as g,
  listCalendarAdmins as l,
  reopenMissionWeek as r,
  setAdminApprover as s,
  toggleMissionDone as t,
  upsertMission as u
};
