import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-CCJB_KSk.mjs";
import { u as useSupabaseSession, c as claimAdminWithLegacyCreds, g as getMyTeamContext, a as claimConfiguredFirstAdmin } from "./membership.functions-B7i6fyJs.mjs";
import { u as useAdminRoles } from "./use-admin-roles-Ml6iIwxA.mjs";
import { a as setAdminActing, s as setTeamSession } from "./router-Dj6bT8nv.mjs";
import { C as Card, B as Button } from "./button-DHovwa_B.mjs";
import { I as Input } from "./input-BwpJpE6I.mjs";
import { B as BrandLogo } from "./brand-logo-3B4j9ROK.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { L as LoaderCircle } from "../_libs/lucide-react.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./auth-middleware-DIPMndrz.mjs";
import "../_libs/zod.mjs";
import "../_libs/framer-motion.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
function Home() {
  const navigate = useNavigate();
  const {
    session,
    loading: sessionLoading
  } = useSupabaseSession();
  const {
    data: roles,
    loading: rolesLoading
  } = useAdminRoles();
  const teamCtxFn = useServerFn(getMyTeamContext);
  const claimFirstAdminFn = useServerFn(claimConfiguredFirstAdmin);
  const teamQ = useQuery({
    enabled: !!session,
    queryKey: ["my-team-context", session?.user.id],
    queryFn: () => teamCtxFn()
  });
  const firstAdminQ = useQuery({
    enabled: !!session && !rolesLoading && !!roles && !roles.hasAccess,
    queryKey: ["claim-configured-first-admin", session?.user.id],
    queryFn: () => claimFirstAdminFn(),
    retry: false,
    staleTime: Infinity
  });
  reactExports.useEffect(() => {
    if (!session || rolesLoading || !roles) return;
    if (!roles.hasAccess && firstAdminQ.isLoading) return;
    if (firstAdminQ.data?.claimed) {
      window.location.reload();
      return;
    }
    if (roles.isAdmin) {
      setAdminActing(false);
      navigate({
        to: "/admin",
        replace: true
      });
      return;
    }
    if (roles.isStaff) {
      navigate({
        to: "/admin/orders",
        replace: true
      });
      return;
    }
    if (teamQ.isLoading) return;
    if (teamQ.data) {
      setTeamSession(teamQ.data);
      setAdminActing(false);
      navigate({
        to: "/shop",
        replace: true
      });
    } else {
      navigate({
        to: "/select-team",
        replace: true
      });
    }
  }, [session, rolesLoading, roles, firstAdminQ.isLoading, firstAdminQ.data, teamQ.isLoading, teamQ.data, navigate]);
  if (sessionLoading || session && (rolesLoading || teamQ.isLoading || !roles?.hasAccess && firstAdminQ.isLoading)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-secondary/40 to-accent/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 96, className: "mx-auto mb-5 drop-shadow-xl rounded-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "ברוכים הבאים" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "התחבר/י כדי להמשיך" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-6 shadow-xl space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-border flex-1" }),
        " או ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-border flex-1" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(EmailAuthForm, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-center text-muted-foreground pt-2", children: [
        "מנהל קיים? ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ClaimAdminLink, {})
      ] })
    ] })
  ] }) });
}
function GoogleButton() {
  const [loading, setLoading] = reactExports.useState(false);
  async function onClick() {
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (e) {
      toast.error(e.message || "שגיאת התחברות");
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", onClick, disabled: loading, variant: "outline", className: "w-full h-11 gap-2", children: [
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleIcon, {}),
    "התחברות עם Google"
  ] });
}
function EmailAuthForm() {
  const [mode, setMode] = reactExports.useState("signin");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [name, setName] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name || email.split("@")[0]
            }
          }
        });
        if (error) throw error;
        toast.success("נרשמת בהצלחה. בדוק/י את האימייל לאישור אם נדרש.");
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw new Error("אימייל או סיסמה שגויים");
      }
    } catch (e2) {
      toast.error(e2.message || "שגיאה");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit, className: "space-y-3", children: [
    mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: "שם מלא" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "שמך" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: "אימייל" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", dir: "ltr", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "name@example.com" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: "סיסמה" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", dir: "ltr", required: true, minLength: mode === "signup" ? 8 : 1, autoComplete: mode === "signup" ? "new-password" : "current-password", value: password, onChange: (e) => setPassword(e.target.value) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: loading, className: "w-full h-11", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : mode === "signup" ? "יצירת חשבון" : "כניסה" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-primary hover:underline", onClick: () => setMode(mode === "signin" ? "signup" : "signin"), children: mode === "signin" ? "אין לך חשבון? הירשם/י" : "כבר יש לך חשבון? התחבר/י" }) })
  ] });
}
function ClaimAdminLink() {
  const {
    session
  } = useSupabaseSession();
  const claimFn = useServerFn(claimAdminWithLegacyCreds);
  const [open, setOpen] = reactExports.useState(false);
  const [u, setU] = reactExports.useState("");
  const [p, setP] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  if (!open) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-primary hover:underline", onClick: () => setOpen(true), children: "קישור חשבון מנהל קיים" });
  }
  async function onSubmit(e) {
    e.preventDefault();
    if (!session) {
      toast.error("התחבר/י קודם עם Google או אימייל");
      return;
    }
    setLoading(true);
    try {
      await claimFn({
        data: {
          identifier: u,
          password: p
        }
      });
      toast.success("חשבונך שודרג למנהל");
      window.location.reload();
    } catch (e2) {
      toast.error(e2.message || "שגיאה");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit, className: "mt-3 space-y-2 text-right", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "התחבר/י קודם עם Google או אימייל, ואז הזן/י את פרטי חשבון המנהל הקיים שלך כדי להעביר את ההרשאה לחשבון החדש." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "שם משתמש מנהל קיים", dir: "ltr", value: u, onChange: (e) => setU(e.target.value) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "סיסמה", dir: "ltr", type: "password", value: p, onChange: (e) => setP(e.target.value) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: loading || !session, size: "sm", className: "flex-1", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : "קשר חשבון" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setOpen(false), children: "בטל" })
    ] })
  ] });
}
function GoogleIcon() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", className: "w-4 h-4", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#EA4335", d: "M12 10.2v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z" }) });
}
export {
  Home as component
};
