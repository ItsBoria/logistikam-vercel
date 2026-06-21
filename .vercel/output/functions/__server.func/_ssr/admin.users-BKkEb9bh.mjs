import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as AdminShell } from "./admin-shell-D2sNpD8P.mjs";
import { l as listAdminUsers, c as createAdminUser, d as deleteAdminUser, a as updateAdminUserRole, b as searchRegisteredUsers } from "./admin.functions-M98_wxCk.mjs";
import { u as useSupabaseSession, l as listActiveTeams, d as setUserTeamAdmin } from "./membership.functions-B7i6fyJs.mjs";
import { s as setAdminApprover } from "./missions.functions-CrBdj-gL.mjs";
import { B as Button, C as Card, c as cn } from "./button-DHovwa_B.mjs";
import { I as Input } from "./input-BwpJpE6I.mjs";
import { S as Switch } from "./switch-Di8POljc.mjs";
import { R as Root2, L as List, T as Trigger, C as Content } from "../_libs/radix-ui__react-tabs.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-tTnl1o2f.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CDdlIHZe.mjs";
import { S as SearchInput } from "./search-input-DBpRcgsD.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { P as Plus, J as ShieldCheck, k as Package, K as Star, T as Trash2, v as User } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__react-router.mjs";
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
import "./use-admin-roles-Ml6iIwxA.mjs";
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
import "./client-CCJB_KSk.mjs";
import "./router-Dj6bT8nv.mjs";
import "../_libs/framer-motion.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
import "./sheet-BCTinNGU.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./use-scroll-direction-D4KBbDyh.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
const Tabs = Root2;
const TabsList = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  List,
  {
    ref,
    className: cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = List.displayName;
const TabsTrigger = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = Trigger.displayName;
const TabsContent = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = Content.displayName;
function Admins() {
  const qc = useQueryClient();
  const {
    session
  } = useSupabaseSession();
  const listFn = useServerFn(listAdminUsers);
  const createFn = useServerFn(createAdminUser);
  const deleteFn = useServerFn(deleteAdminUser);
  const roleFn = useServerFn(updateAdminUserRole);
  const searchFn = useServerFn(searchRegisteredUsers);
  const teamsFn = useServerFn(listActiveTeams);
  const setTeamFn = useServerFn(setUserTeamAdmin);
  const approverFn = useServerFn(setAdminApprover);
  const {
    data: admins
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn()
  });
  const {
    data: teams
  } = useQuery({
    queryKey: ["active-teams-admin"],
    queryFn: () => teamsFn()
  });
  const [query, setQuery] = reactExports.useState("");
  const {
    data: searchResults,
    isFetching: searching
  } = useQuery({
    queryKey: ["registered-users", query],
    queryFn: () => searchFn({
      data: {
        query
      }
    })
  });
  const [creating, setCreating] = reactExports.useState(false);
  const [email, setEmail] = reactExports.useState("");
  const [username, setUsername] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [role, setRole] = reactExports.useState("admin");
  async function create() {
    try {
      await createFn({
        data: {
          email,
          username,
          password,
          role
        }
      });
      toast.success("המשתמש נוסף");
      setEmail("");
      setUsername("");
      setPassword("");
      setRole("admin");
      setCreating(false);
      qc.invalidateQueries({
        queryKey: ["admin-users"]
      });
      qc.invalidateQueries({
        queryKey: ["registered-users"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function remove(id) {
    if (!confirm("להסיר משתמש זה?")) return;
    try {
      await deleteFn({
        data: {
          user_id: id
        }
      });
      toast.success("נמחק");
      qc.invalidateQueries({
        queryKey: ["admin-users"]
      });
      qc.invalidateQueries({
        queryKey: ["registered-users"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function changeRole(id, newRole) {
    try {
      await roleFn({
        data: {
          user_id: id,
          role: newRole
        }
      });
      toast.success("התפקיד עודכן");
      qc.invalidateQueries({
        queryKey: ["admin-users"]
      });
      qc.invalidateQueries({
        queryKey: ["registered-users"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function changeTeam(userId, value) {
    try {
      await setTeamFn({
        data: {
          user_id: userId,
          team_id: value === "none" ? null : value
        }
      });
      toast.success("הצוות עודכן");
      qc.invalidateQueries({
        queryKey: ["admin-users"]
      });
      qc.invalidateQueries({
        queryKey: ["registered-users"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function toggleApprover(userId, val) {
    try {
      await approverFn({
        data: {
          user_id: userId,
          is_approver: val
        }
      });
      toast.success(val ? "סומן כמאשר" : "הוסר סימון מאשר");
      qc.invalidateQueries({
        queryKey: ["admin-users"]
      });
      qc.invalidateQueries({
        queryKey: ["calendar-admins"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "משתמשים" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "ניהול תפקידים והרשאות" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setCreating(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 ml-2" }),
        " משתמש חדש"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "system", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "system", children: "משתמשי מערכת" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "all", children: "כל המשתמשים" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "system", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "divide-y", children: [
        admins?.map((a) => {
          const isMe = a.user_id === session?.user.id;
          const isAdmin = a.is_admin;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 gap-3 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-10 h-10 rounded-lg flex items-center justify-center ${isAdmin ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`, children: isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "w-5 h-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-5 h-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium flex items-center gap-2", children: [
                  a.username ? `@${a.username}` : a.email,
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${isAdmin ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`, children: isAdmin ? "מנהל" : "צוות מחסן" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  a.username ? `${a.email} · ` : "",
                  "נוסף: ",
                  new Date(a.created_at).toLocaleDateString("he-IL")
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-1.5 text-xs bg-muted/60 rounded-full px-2.5 h-9", title: "מאשר חתימות שבועיות", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `w-3.5 h-3.5 ${a.is_approver ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "מאשר" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: !!a.is_approver, onCheckedChange: (v) => toggleApprover(a.user_id, v) })
              ] }),
              !isMe && /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: isAdmin ? "admin" : "staff", onValueChange: (v) => changeRole(a.user_id, v), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-36 h-9 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "מנהל" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "staff", children: "צוות מחסן" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "customer", children: "לקוח (הסר)" })
                ] })
              ] }),
              !isMe ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => remove(a.user_id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 text-destructive" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "(אתה)" })
            ] })
          ] }, a.user_id);
        }),
        !admins?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 text-center text-muted-foreground", children: "אין משתמשים" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "all", className: "mt-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SearchInput, { containerClassName: "max-w-none", value: query, onChange: (e) => setQuery(e.target.value), onClear: () => setQuery(""), placeholder: "חיפוש לפי אימייל או שם..." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "divide-y", children: [
          searching && !searchResults?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground text-sm", children: "טוען..." }),
          searchResults?.map((u) => {
            const isMe = u.id === session?.user.id;
            const initials = (u.displayName || u.email || "?").trim().charAt(0).toUpperCase();
            const roleLabel = u.currentRole === "admin" ? "מנהל" : u.currentRole === "staff" ? "צוות" : "לקוח";
            const roleClass = u.currentRole === "admin" ? "bg-primary/15 text-primary" : u.currentRole === "staff" ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 gap-3 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium", children: initials || /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-5 h-5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium flex items-center gap-2 flex-wrap", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: u.displayName || u.email }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${roleClass}`, children: roleLabel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase", children: u.provider === "google" ? "Google" : u.provider === "email" ? "אימייל" : u.provider })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground truncate", dir: "ltr", children: u.email }),
                  u.team_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [
                    "צוות: ",
                    u.team_name
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: u.team_id ?? "none", onValueChange: (v) => changeTeam(u.id, v), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-40 h-9 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "צוות" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "ללא צוות" }),
                    teams?.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t.id, children: t.name }, t.id))
                  ] })
                ] }),
                !isMe ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: u.currentRole, onValueChange: (v) => changeRole(u.id, v), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-36 h-9 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "מנהל" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "staff", children: "צוות מחסן" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "customer", children: "לקוח" })
                  ] })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "(אתה)" })
              ] })
            ] }, u.id);
          }),
          !searching && !searchResults?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 text-center text-muted-foreground text-sm", children: "אין משתמשים תואמים" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: creating, onOpenChange: setCreating, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "הוספת משתמש" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "תפקיד" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: role, onValueChange: (v) => setRole(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "admin", children: "מנהל (גישה מלאה)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "staff", children: "צוות מחסן (מלאי + סטטוס הזמנות בלבד)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "אימייל" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: email, onChange: (e) => setEmail(e.target.value), type: "email", dir: "ltr", placeholder: "name@example.com" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "שם משתמש" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: username, onChange: (e) => setUsername(e.target.value), type: "text", dir: "ltr", placeholder: "user" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "אותיות באנגלית, מספרים, נקודה, קו תחתון, מקף (2-40 תווים)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "סיסמה (לפחות 8 תווים)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: password, onChange: (e) => setPassword(e.target.value), type: "password", dir: "ltr" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setCreating(false), children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: create, disabled: !email || !/^[a-zA-Z0-9_.-]{2,40}$/.test(username) || password.length < 8, children: "הוסף" })
      ] })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, { adminOnly: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Admins, {}) });
export {
  SplitComponent as component
};
