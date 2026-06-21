import { r as reactExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-CCJB_KSk.mjs";
import { c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
const ACCESS_TOKEN_COOKIE = "logistikam_access_token";
function syncAccessTokenCookie(session) {
  if (typeof document === "undefined") return;
  if (!session?.access_token) {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
    return;
  }
  const maxAge = Math.max(0, (session.expires_at ?? Math.floor(Date.now() / 1e3) + 3600) - Math.floor(Date.now() / 1e3));
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}
function getInitialSession() {
  const raw = supabase.auth._currentSession;
  if (raw !== void 0) return { session: raw ?? null, loading: false };
  return { session: null, loading: true };
}
function useSupabaseSession() {
  const initial = getInitialSession();
  const [session, setSession] = reactExports.useState(initial.session);
  const [loading, setLoading] = reactExports.useState(initial.loading);
  reactExports.useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        syncAccessTokenCookie(data.session);
        setSession(data.session);
        setLoading(false);
      }
    });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      syncAccessTokenCookie(nextSession);
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  return { session, loading };
}
const getMyTeamContext = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("b24b8b91a1a579f7cfe0ed4f48e9904a54aee90205b29d6503d03f1f4347f885"));
const claimConfiguredFirstAdmin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("c5b7d1fb6c55001cebe88a38e82df96952bd76af54758368b5173f1c26c0d533"));
const listActiveTeams = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("c6045b6ce99d25d74b9e393062dbff9a534ada30433c762ae43cb190233dabe4"));
const setMyTeam = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  team_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("8be22c3a55b67f70041649ad90564ad81cc4d1488a82fc88471e8be233497486"));
const setUserTeamAdmin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  user_id: stringType().uuid(),
  team_id: stringType().uuid().nullable()
}).parse(input)).handler(createSsrRpc("19ac49d55c90c51d9a1d50472ad9dd7ccf2cfc9a51d5172f0d2b246caa28f585"));
const getTeamContextById = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  team_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("a869b4edf640ed515d98ae440385e5d1840a4ba9ed1d2457ee84e5004da3df10"));
const claimAdminWithLegacyCreds = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  identifier: stringType().min(2).max(254),
  password: stringType().min(1).max(72)
}).parse(input)).handler(createSsrRpc("367acc39d5f680d07fdc62bbfe6fe067fb2261f76370713840a50c7843cd21eb"));
export {
  claimConfiguredFirstAdmin as a,
  getTeamContextById as b,
  claimAdminWithLegacyCreds as c,
  setUserTeamAdmin as d,
  getMyTeamContext as g,
  listActiveTeams as l,
  setMyTeam as s,
  useSupabaseSession as u
};
