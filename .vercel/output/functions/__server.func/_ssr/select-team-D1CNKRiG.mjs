import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useSupabaseSession, s as setMyTeam, g as getMyTeamContext, l as listActiveTeams } from "./membership.functions-B7i6fyJs.mjs";
import { s as setTeamSession, a as setAdminActing } from "./router-Dj6bT8nv.mjs";
import { C as Card, B as Button } from "./button-DHovwa_B.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CDdlIHZe.mjs";
import { s as supabase } from "./client-CCJB_KSk.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as BrandLogo } from "./brand-logo-3B4j9ROK.mjs";
import { L as LoaderCircle, a as LogOut } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "./server-CIKTFqrt.mjs";
import "node:async_hooks";
import "../_libs/tanstack__query-core.mjs";
import "./auth-middleware-DIPMndrz.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
import "../_libs/framer-motion.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
function SelectTeam() {
  const navigate = useNavigate();
  const {
    session,
    loading
  } = useSupabaseSession();
  const listFn = useServerFn(listActiveTeams);
  const setFn = useServerFn(setMyTeam);
  const ctxFn = useServerFn(getMyTeamContext);
  reactExports.useEffect(() => {
    if (!loading && !session) navigate({
      to: "/",
      replace: true
    });
  }, [loading, session, navigate]);
  const {
    data: teams,
    isLoading
  } = useQuery({
    enabled: !!session,
    queryKey: ["active-teams"],
    queryFn: () => listFn()
  });
  const [teamId, setTeamId] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  async function onContinue() {
    if (!teamId) return;
    setSaving(true);
    try {
      await setFn({
        data: {
          team_id: teamId
        }
      });
      const ctx = await ctxFn();
      if (ctx) {
        setTeamSession(ctx);
        setAdminActing(false);
        navigate({
          to: "/shop",
          replace: true
        });
      }
    } catch (e) {
      toast.error(e.message || "שגיאה");
    } finally {
      setSaving(false);
    }
  }
  if (loading || !session) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-secondary/40 to-accent/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 80, className: "mx-auto mb-4 rounded-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "בחר/י את הצוות שלך" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2 text-sm", children: "בחירת הצוות מתבצעת פעם אחת ונשמרת לחשבונך." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-6 shadow-xl space-y-4", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-6 h-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: teamId, onValueChange: setTeamId, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "בחר/י צוות" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (teams ?? []).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t.id, children: t.name }, t.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !teamId || saving, onClick: onContinue, className: "w-full h-11", children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : "המשך לחנות" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", className: "w-full", onClick: async () => {
        await supabase.auth.signOut();
        navigate({
          to: "/",
          replace: true
        });
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4 ml-2" }),
        " יציאה"
      ] })
    ] }) })
  ] }) });
}
export {
  SelectTeam as component
};
