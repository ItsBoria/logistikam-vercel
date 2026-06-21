import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as AdminShell, u as useAdminPreferences, g as getAdminDashboard, s as setTeamMonthlyLimit } from "./admin-shell-D2sNpD8P.mjs";
import { u as updateOrderStatus, g as getAppSettings, s as setDefaultLowStockThreshold } from "./admin.functions-M98_wxCk.mjs";
import { u as useAdminRoles } from "./use-admin-roles-Ml6iIwxA.mjs";
import { C as Card, B as Button } from "./button-DHovwa_B.mjs";
import { I as Input } from "./input-BwpJpE6I.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CDdlIHZe.mjs";
import { f as formatCurrency } from "./pricing-DW2SFuan.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { L as LoaderCircle, i as Clock, j as Timer, R as Replace, k as Package, l as TrendingDown, m as ShoppingBag, D as DollarSign, U as Users, n as Settings, b as Check, X, o as Pencil, d as TriangleAlert } from "../_libs/lucide-react.mjs";
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
import "./membership.functions-B7i6fyJs.mjs";
import "./client-CCJB_KSk.mjs";
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
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
const STATUS_LABEL = {
  pending: "ממתינה",
  awaiting_approval: "ממתינה לאישור",
  approved: "אושרה",
  preparing: "בהכנה",
  ready: "מוכנה לאיסוף",
  completed: "הושלמה",
  cancelled: "בוטלה"
};
const STATUS_COLOR = {
  pending: "bg-secondary text-secondary-foreground",
  awaiting_approval: "bg-warning text-warning-foreground",
  approved: "bg-primary/15 text-primary",
  preparing: "bg-primary/15 text-primary",
  ready: "bg-success text-success-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive"
};
function DashboardPage() {
  const qc = useQueryClient();
  const {
    data: myRoles
  } = useAdminRoles();
  const {
    data: preferences
  } = useAdminPreferences();
  const isAdmin = !!myRoles?.isAdmin;
  const dashFn = useServerFn(getAdminDashboard);
  const limitFn = useServerFn(setTeamMonthlyLimit);
  const statusFn = useServerFn(updateOrderStatus);
  const settingsFn = useServerFn(getAppSettings);
  const setThresholdFn = useServerFn(setDefaultLowStockThreshold);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => dashFn(),
    staleTime: 3e4
  });
  const {
    data: settings
  } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => settingsFn(),
    staleTime: 6e4
  });
  const [editingTeam, setEditingTeam] = reactExports.useState(null);
  const [limitValue, setLimitValue] = reactExports.useState("");
  const [editingThreshold, setEditingThreshold] = reactExports.useState(false);
  const [thresholdValue, setThresholdValue] = reactExports.useState("");
  if (isLoading || !data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }) });
  }
  const {
    kpis,
    topTeams,
    recentOrders,
    lowStock,
    stuckOrders
  } = data;
  async function changeStatus(id, status) {
    try {
      await statusFn({
        data: {
          id,
          status
        }
      });
      toast.success("סטטוס עודכן");
      qc.invalidateQueries({
        queryKey: ["admin-dashboard"]
      });
    } catch (e) {
      toast.error(e.message || "שגיאה");
    }
  }
  async function saveLimit(teamId) {
    const n = Number(limitValue);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("ערך לא תקין");
      return;
    }
    try {
      await limitFn({
        data: {
          team_id: teamId,
          monthly_limit: n
        }
      });
      toast.success("המסגרת עודכנה");
      setEditingTeam(null);
      qc.invalidateQueries({
        queryKey: ["admin-dashboard"]
      });
    } catch (e) {
      toast.error(e.message || "שגיאה");
    }
  }
  async function saveThreshold() {
    const n = Number(thresholdValue);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      toast.error("ערך לא תקין");
      return;
    }
    try {
      await setThresholdFn({
        data: {
          value: n
        }
      });
      toast.success("סף ברירת המחדל עודכן");
      setEditingThreshold(false);
      qc.invalidateQueries({
        queryKey: ["app-settings"]
      });
      qc.invalidateQueries({
        queryKey: ["admin-dashboard"]
      });
    } catch (e) {
      toast.error(e.message || "שגיאה");
    }
  }
  const visible = (widget) => preferences?.visible_widgets?.includes(widget) ?? true;
  const widgetOrder = (widget) => preferences?.widget_order?.indexOf(widget) ?? 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 admin-stagger", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${visible("kpis") ? "grid" : "hidden"} grid-cols-2 lg:grid-cols-4 gap-3`, style: {
      order: widgetOrder("kpis")
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5" }), label: "ממתינות", value: kpis.pending + kpis.awaiting, tone: "warning" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { className: "w-5 h-5" }), label: "הזמנות תקועות", value: kpis.stuck ?? 0, tone: (kpis.stuck ?? 0) > 0 ? "warning" : void 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Replace, { className: "w-5 h-5" }), label: "בקשות החלפה", value: kpis.pendingReplacements, tone: kpis.pendingReplacements > 0 ? "warning" : void 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-5 h-5" }), label: "מלאי נמוך", value: kpis.lowStock, tone: kpis.lowStock > 0 ? "warning" : void 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "w-5 h-5" }), label: "צוותים מעל תקציב", value: kpis.overBudget ?? 0, tone: (kpis.overBudget ?? 0) > 0 ? "warning" : void 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "w-5 h-5" }), label: "הזמנות החודש", value: kpis.monthOrders }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "w-5 h-5" }), label: "הכנסות החודש", value: formatCurrency(kpis.monthRevenue) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Kpi, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "w-5 h-5" }), label: "צוותים פעילים", value: kpis.activeTeams })
    ] }),
    visible("attention") && stuckOrders && stuckOrders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 border-warning/40 admin-card", style: {
      order: widgetOrder("attention")
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-bold flex items-center gap-2 text-warning-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Timer, { className: "w-4 h-4" }),
          " הזמנות שדורשות תשומת לב"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin/orders", className: "text-xs text-muted-foreground hover:text-foreground", children: "לכל ההזמנות ←" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3", children: "ממתינות לאישור מעל 24 שעות, או מוכנות לאיסוף מעל 48 שעות." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: stuckOrders.map((o) => {
        const ageH = Math.round((Date.now() - new Date(o.created_at).getTime()) / 36e5);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b last:border-b-0 pb-2 last:pb-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${STATUS_COLOR[o.status] ?? STATUS_COLOR.pending}`, children: STATUS_LABEL[o.status] ?? o.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm truncate", children: o.teams?.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-warning-foreground", children: [
                "לפני ",
                ageH,
                " שעות"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: o.ordered_by_name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums text-sm", children: formatCurrency(Number(o.total)) })
        ] }, o.id);
      }) })
    ] }),
    isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-4 h-4" }),
          " סף ברירת מחדל למלאי נמוך"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: 'מוצרים בלי סף אישי ייחשבו "מלאי נמוך" כאשר המלאי קטן או שווה לערך הזה.' })
      ] }),
      editingThreshold ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, value: thresholdValue, onChange: (e) => setThresholdValue(e.target.value), className: "h-9 w-24", dir: "ltr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "default", className: "h-9 w-9", onClick: saveThreshold, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "outline", className: "h-9 w-9", onClick: () => setEditingThreshold(false), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" }) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold tabular-nums", children: settings?.default_low_stock_threshold ?? data.defaultLowStockThreshold ?? 5 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
          setEditingThreshold(true);
          setThresholdValue(String(settings?.default_low_stock_threshold ?? data.defaultLowStockThreshold ?? 5));
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-3 h-3 ml-1" }),
          " שינוי"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", style: {
      order: Math.min(widgetOrder("budgets"), widgetOrder("stock"))
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `${visible("budgets") ? "block" : "hidden"} p-4 admin-card`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold", children: "תקציבי צוותים" }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin/teams", className: "text-xs text-muted-foreground hover:text-foreground", children: "ניהול צוותים ←" })
        ] }),
        topTeams.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "אין צוותים פעילים" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: topTeams.map((t) => {
          const isEditing = editingTeam === t.id;
          const overBudget = t.monthly_limit > 0 && t.pct >= 100;
          const nearBudget = t.monthly_limit > 0 && t.pct >= 80 && t.pct < 100;
          const barClass = overBudget ? "bg-destructive" : nearBudget ? "bg-warning" : "bg-primary";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm truncate", children: t.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "tabular-nums text-muted-foreground", children: [
                  formatCurrency(t.spent),
                  t.monthly_limit > 0 ? ` / ${formatCurrency(t.monthly_limit)}` : ""
                ] }),
                !isEditing && isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => {
                  setEditingTeam(t.id);
                  setLimitValue(String(t.monthly_limit));
                }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-3 h-3" }) })
              ] })
            ] }),
            isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, value: limitValue, onChange: (e) => setLimitValue(e.target.value), className: "h-8", dir: "ltr" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "default", className: "h-8 w-8", onClick: () => saveLimit(t.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "outline", className: "h-8 w-8", onClick: () => setEditingTeam(null), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4" }) })
            ] }) : t.monthly_limit > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full ${barClass} transition-all`, style: {
              width: `${Math.min(100, t.pct)}%`
            } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "ללא מגבלה" })
          ] }, t.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `${visible("stock") ? "block" : "hidden"} p-4 admin-card`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-bold flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "w-4 h-4" }),
            " מלאי נמוך"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: isAdmin ? "/admin/products" : "/admin/stock", className: "text-xs text-muted-foreground hover:text-foreground", children: [
            isAdmin ? "ניהול מוצרים" : "ניהול מלאי",
            " ←"
          ] })
        ] }),
        lowStock.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "כל המוצרים במלאי תקין" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: lowStock.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm border-b last:border-b-0 pb-2 last:pb-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: p.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${p.stock === 0 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning-foreground"}`, children: p.stock === 0 ? "אזל" : `${p.stock} ביחידות` })
        ] }, p.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `${visible("recent_orders") ? "block" : "hidden"} p-4 admin-card`, style: {
      order: widgetOrder("recent_orders")
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold", children: "הזמנות אחרונות" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin/orders", className: "text-xs text-muted-foreground hover:text-foreground", children: "לכל ההזמנות ←" })
      ] }),
      recentOrders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "אין הזמנות עדיין" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: recentOrders.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b last:border-b-0 pb-2 last:pb-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${STATUS_COLOR[o.status] ?? STATUS_COLOR.pending}`, children: STATUS_LABEL[o.status] ?? o.status }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm truncate", children: o.teams?.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: new Date(o.created_at).toLocaleString("he-IL") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: o.ordered_by_name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: formatCurrency(Number(o.total)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: o.status, onValueChange: (v) => changeStatus(o.id, v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-32 h-8 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.entries(STATUS_LABEL).map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: k, children: v }, k)) })
        ] })
      ] }, o.id)) })
    ] })
  ] });
}
function Kpi({
  icon,
  label,
  value,
  tone
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 admin-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 text-xs ${tone === "warning" ? "text-warning-foreground" : "text-muted-foreground"}`, children: [
      tone === "warning" ? /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-4 h-4" }) : icon,
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold mt-1 tabular-nums", children: value })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPage, {}) });
export {
  SplitComponent as component
};
