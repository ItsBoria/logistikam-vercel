import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link, e as useRouterState } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useSupabaseSession, l as listActiveTeams, b as getTeamContextById } from "./membership.functions-B7i6fyJs.mjs";
import { u as useAdminRoles } from "./use-admin-roles-Ml6iIwxA.mjs";
import { s as supabase } from "./client-CCJB_KSk.mjs";
import { B as Button } from "./button-DHovwa_B.mjs";
import { s as setTeamSession, a as setAdminActing } from "./router-Dj6bT8nv.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CDdlIHZe.mjs";
import { S as Sheet, a as SheetTrigger, b as SheetContent, c as SheetHeader, d as SheetTitle } from "./sheet-BCTinNGU.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import { u as useHideOnScroll } from "./use-scroll-direction-D4KBbDyh.mjs";
import { L as LoaderCircle, a as LogOut, p as Eye, q as CalendarDays, r as Boxes, R as Replace, B as Bell, s as LayoutDashboard, m as ShoppingBag, k as Package, t as UserCog, U as Users, E as Ellipsis, u as Settings2 } from "../_libs/lucide-react.mjs";
import { o as objectType, n as numberType, s as stringType, e as enumType, b as booleanType, r as recordType, u as unknownType, a as arrayType } from "../_libs/zod.mjs";
const getAdminDashboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("c27eeed4c0a36a708ba399551f71e2a912db4b9907f49682dfc4e1d08861ae53"));
const setTeamMonthlyLimit = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  team_id: stringType().uuid(),
  monthly_limit: numberType().min(0).max(1e7)
}).parse(input)).handler(createSsrRpc("ac50e4dd05873d7016818876dc3b7c322d1e44675eebcb275f39b668062a3108"));
const ADMIN_MAIN = [
  { to: "/admin", label: "סקירה", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "הזמנות", icon: ShoppingBag },
  { to: "/admin/products", label: "מוצרים", icon: Package },
  { to: "/admin/users", label: "מנהלים", icon: UserCog },
  { to: "/admin/teams", label: "צוותים", icon: Users }
];
const ADMIN_MORE = [
  { to: "/admin/calendar", label: "תכנית שבועית", icon: CalendarDays },
  { to: "/admin/replacement-inventory", label: "מלאי החלפות", icon: Boxes },
  { to: "/admin/replacements", label: "בקשות החלפה", icon: Replace },
  { to: "/admin/notifications", label: "התראות", icon: Bell }
];
ADMIN_MORE.push({ to: "/admin/preferences", label: "הפאנל שלי", icon: Settings2 });
const STAFF_MAIN = [
  { to: "/admin", label: "סקירה", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "הזמנות", icon: ShoppingBag },
  { to: "/admin/stock", label: "מלאי", icon: Package },
  { to: "/admin/notifications", label: "התראות", icon: Bell }
];
function useIsActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to, exact) => exact ? path === to : path === to || path.startsWith(to + "/");
}
function Tab({ item, active, badge }) {
  const Icon = item.icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: item.to,
      className: [
        "group relative flex items-center justify-center gap-2 rounded-full transition-all",
        "h-11 px-3 min-w-11",
        active ? "bg-primary text-primary-foreground shadow-sm px-4" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      ].join(" "),
      "aria-label": item.label,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: [
              "text-xs font-medium whitespace-nowrap",
              active ? "inline" : "hidden md:group-hover:inline"
            ].join(" "),
            children: item.label
          }
        ),
        badge && badge > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: [
              "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
              "flex items-center justify-center",
              active ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground"
            ].join(" "),
            children: badge > 99 ? "99+" : badge
          }
        ) : null
      ]
    }
  );
}
function AdminBottomTabBar({ role }) {
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = reactExports.useState(false);
  const isAdmin = role === "admin";
  const dashFn = useServerFn(getAdminDashboard);
  const { data: dash } = useQuery({
    queryKey: ["admin-dashboard-badge"],
    queryFn: () => dashFn(),
    enabled: isAdmin,
    refetchInterval: 3e4,
    staleTime: 15e3
  });
  const pendingBadge = (dash?.kpis?.pending ?? 0) + (dash?.kpis?.awaiting ?? 0);
  const mainItems = isAdmin ? ADMIN_MAIN : STAFF_MAIN;
  const moreActive = isAdmin && ADMIN_MORE.some((i) => isActive(i.to, i.exact));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24", "aria-hidden": true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),16px)] px-4 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "nav",
      {
        className: [
          "pointer-events-auto mx-auto w-fit max-w-[calc(100vw-2rem)]",
          "flex items-center gap-1 p-1.5 rounded-full",
          "bg-card/90 backdrop-blur-xl border shadow-lg"
        ].join(" "),
        children: [
          mainItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tab,
            {
              item,
              active: isActive(item.to, item.exact),
              badge: item.to === "/admin/orders" && isAdmin ? pendingBadge : void 0
            },
            item.to
          )),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open: moreOpen, onOpenChange: setMoreOpen, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: [
                  "group flex items-center justify-center gap-2 rounded-full transition-all h-11 px-3 min-w-11",
                  moreActive ? "bg-primary text-primary-foreground shadow-sm px-4" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                ].join(" "),
                "aria-label": "עוד",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "w-5 h-5 shrink-0" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: [
                        "text-xs font-medium whitespace-nowrap",
                        moreActive ? "inline" : "hidden md:group-hover:inline"
                      ].join(" "),
                      children: "עוד"
                    }
                  )
                ]
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "bottom", className: "rounded-t-2xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { children: "עוד" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3 mt-4", children: ADMIN_MORE.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.exact);
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Link,
                  {
                    to: item.to,
                    onClick: () => setMoreOpen(false),
                    className: [
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border",
                      active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                    ].join(" "),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-6 h-6" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-center", children: item.label })
                    ]
                  },
                  item.to
                );
              }) })
            ] })
          ] })
        ]
      }
    ) })
  ] });
}
const DASHBOARD_WIDGETS = ["kpis", "attention", "budgets", "stock", "recent_orders"];
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
const getMyAdminPreferences = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("b27e584f3e28b1c9c506479d4c2d4654b61d757887d35c148eeae4dd648fe418"));
const saveMyAdminPreferences = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => preferencesSchema.parse(input)).handler(createSsrRpc("c09cae8e410593a306cdd2a6b783fb2840ceed21e7299e0ac7c18280919028df"));
function useAdminPreferences() {
  const fn = useServerFn(getMyAdminPreferences);
  return useQuery({
    queryKey: ["admin-preferences"],
    queryFn: () => fn(),
    staleTime: 6e4
  });
}
function AdminShell({
  children,
  /** If true (default), the route is admin-only. Staff users will be redirected. */
  adminOnly = false
}) {
  const navigate = useNavigate();
  const { session, loading } = useSupabaseSession();
  const { data: roles, loading: rolesLoading } = useAdminRoles();
  reactExports.useEffect(() => {
    if (!loading && !session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);
  reactExports.useEffect(() => {
    if (session && !rolesLoading && roles && !roles.hasAccess) {
      supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    }
  }, [session, rolesLoading, roles, navigate]);
  reactExports.useEffect(() => {
    if (!session || rolesLoading || !roles) return;
    if (adminOnly && !roles.isAdmin && roles.isStaff) {
      navigate({ to: "/admin/orders", replace: true });
    }
  }, [adminOnly, session, rolesLoading, roles, navigate]);
  if (loading || !session || rolesLoading || !roles || !roles.hasAccess) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  if (adminOnly && !roles.isAdmin) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center p-6 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold mb-2", children: "אין הרשאה" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "דף זה זמין רק למנהלים." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShellInner, { session, roles, children });
}
function AdminShellInner({ session, roles, children }) {
  const navigate = useNavigate();
  const hidden = useHideOnScroll();
  const { data: preferences } = useAdminPreferences();
  reactExports.useEffect(() => {
    const root = document.documentElement;
    const appearance = preferences?.appearance ?? "system";
    const shouldDark = appearance === "dark" || appearance === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", shouldDark);
    root.classList.toggle("reduce-app-motion", !!preferences?.reduced_animations);
    root.classList.toggle("admin-compact", !!preferences?.compact_mode);
  }, [preferences]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-secondary/30 admin-surface", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "header",
      {
        className: [
          "bg-card/80 backdrop-blur border-b sticky top-0 z-30 transition-transform duration-300 ease-out",
          hidden ? "-translate-y-full" : "translate-y-0"
        ].join(" "),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin", className: "font-semibold text-sm tracking-tight", children: roles.isAdmin ? "ניהול" : "מחסן" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
            roles.isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(ViewShopAsPicker, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8",
                "aria-label": "יציאה",
                title: session.user.email ?? "יציאה",
                onClick: () => supabase.auth.signOut().then(() => navigate({ to: "/" })),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4" })
              }
            )
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "max-w-7xl mx-auto p-4 admin-main", children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AdminBottomTabBar, { role: roles.isAdmin ? "admin" : "staff" })
  ] });
}
function ViewShopAsPicker() {
  const navigate = useNavigate();
  const listFn = useServerFn(listActiveTeams);
  const ctxFn = useServerFn(getTeamContextById);
  const { data: teams } = useQuery({ queryKey: ["active-teams"], queryFn: () => listFn() });
  async function onPick(teamId) {
    try {
      const ctx = await ctxFn({ data: { team_id: teamId } });
      if (!ctx) return;
      setTeamSession(ctx);
      setAdminActing(true);
      navigate({ to: "/shop" });
    } catch (e) {
      console.error(e);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { onValueChange: onPick, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectTrigger, { className: "h-8 w-[180px] text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-3.5 h-3.5 ml-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "צפייה כצוות..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: (teams ?? []).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t.id, children: t.name }, t.id)) })
  ] });
}
export {
  AdminShell as A,
  DASHBOARD_WIDGETS as D,
  saveMyAdminPreferences as a,
  getAdminDashboard as g,
  setTeamMonthlyLimit as s,
  useAdminPreferences as u
};
