import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { A as AdminShell, a as saveMyAdminPreferences, u as useAdminPreferences, D as DASHBOARD_WIDGETS } from "./admin-shell-D2sNpD8P.mjs";
import { C as Card, B as Button } from "./button-DHovwa_B.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CDdlIHZe.mjs";
import { S as Switch } from "./switch-Di8POljc.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as Settings2, x as RotateCcw, Z as ArrowUp, _ as ArrowDown, b as Check } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
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
import "./use-admin-roles-Ml6iIwxA.mjs";
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
import "../_libs/radix-ui__react-switch.mjs";
const LABELS = {
  kpis: "מדדי מפתח",
  attention: "דורש תשומת לב",
  budgets: "תקציבי צוותים",
  stock: "מלאי נמוך",
  recent_orders: "הזמנות אחרונות"
};
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
function PreferencesPage() {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveMyAdminPreferences);
  const {
    data,
    isLoading
  } = useAdminPreferences();
  const [form, setForm] = reactExports.useState(DEFAULTS);
  const [saving, setSaving] = reactExports.useState(false);
  const [saved, setSaved] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  function move(widget, direction) {
    const order = [...form.widget_order];
    const index = order.indexOf(widget);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    setForm({
      ...form,
      widget_order: order
    });
  }
  async function save() {
    setSaving(true);
    try {
      const payload = {
        default_section: form.default_section,
        visible_widgets: form.visible_widgets,
        widget_order: form.widget_order,
        pinned_actions: form.pinned_actions ?? [],
        saved_filters: form.saved_filters ?? {},
        compact_mode: !!form.compact_mode,
        reduced_animations: !!form.reduced_animations,
        appearance: form.appearance
      };
      await saveFn({
        data: payload
      });
      qc.setQueryData(["admin-preferences"], payload);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      toast.success("ההעדפות האישיות נשמרו");
    } catch (error) {
      toast.error(error.message || "שמירת ההעדפות נכשלה");
    } finally {
      setSaving(false);
    }
  }
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "admin-skeleton h-72 rounded-2xl" });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 admin-stagger", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "הפאנל שלי" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "הגדרות אישיות לחשבון שלך בלבד." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 admin-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold", children: "כניסה ותצוגה" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-sm", children: "עמוד פתיחה" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.default_section, onValueChange: (v) => setForm({
            ...form,
            default_section: v
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "/admin", children: "סקירה" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "/admin/orders", children: "הזמנות" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "/admin/products", children: "מוצרים" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "/admin/stock", children: "מלאי" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "/admin/notifications", children: "התראות" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-sm", children: "מראה" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.appearance, onValueChange: (v) => setForm({
            ...form,
            appearance: v
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "system", children: "לפי המכשיר" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "light", children: "בהיר" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "dark", children: "כהה" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 divide-y", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PrefSwitch, { label: "תצוגה קומפקטית", help: "פחות רווחים ויותר מידע.", checked: !!form.compact_mode, onChange: (v) => setForm({
          ...form,
          compact_mode: v
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PrefSwitch, { label: "הפחתת אנימציות", help: "מעברים קצרים ללא תנועה גדולה.", checked: !!form.reduced_animations, onChange: (v) => setForm({
          ...form,
          reduced_animations: v
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 admin-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold", children: "סדר רכיבי לוח הבקרה" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "הסתרה והזזה נגישה גם בנייד." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setForm({
          ...form,
          visible_widgets: [...DASHBOARD_WIDGETS],
          widget_order: [...DASHBOARD_WIDGETS]
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-4 w-4" }),
          " איפוס"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-2", children: form.widget_order.map((widget, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: form.visible_widgets.includes(widget), onCheckedChange: (checked) => setForm({
          ...form,
          visible_widgets: checked ? [...form.visible_widgets, widget] : form.visible_widgets.filter((v) => v !== widget)
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm font-medium", children: LABELS[widget] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", disabled: index === 0, onClick: () => move(widget, -1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", disabled: index === form.widget_order.length - 1, onClick: () => move(widget, 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "h-4 w-4" }) })
      ] }, widget)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky bottom-24 z-20 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: save, disabled: saving, className: "min-w-36 shadow-lg active:scale-[.98]", children: saved ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }),
      " נשמר"
    ] }) : saving ? "שומר..." : "שמירת העדפות" }) })
  ] });
}
function PrefSwitch({
  label,
  help,
  checked,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: help })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked, onCheckedChange: onChange })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PreferencesPage, {}) });
export {
  SplitComponent as component
};
