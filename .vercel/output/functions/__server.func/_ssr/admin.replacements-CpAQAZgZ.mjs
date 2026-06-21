import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as AdminShell } from "./admin-shell-D2sNpD8P.mjs";
import { l as listReplacementRequests, u as updateReplacementStatus } from "./replacement-admin.functions-_PB7w-kR.mjs";
import { C as Card, B as Button, c as cn } from "./button-DHovwa_B.mjs";
import { C as Checkbox$1, a as CheckboxIndicator } from "../_libs/radix-ui__react-checkbox.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CDdlIHZe.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-tTnl1o2f.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { L as LoaderCircle, X, B as Bell, O as CheckCheck, b as Check } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
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
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
const Checkbox = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Checkbox$1,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxIndicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = Checkbox$1.displayName;
const STATUS_LABEL = {
  preparing: "בהכנה",
  ready: "מוכן לאיסוף",
  done: "נאסף",
  cancelled: "בוטל"
};
const STATUS_COLOR = {
  preparing: "bg-warning text-warning-foreground",
  ready: "bg-primary text-primary-foreground",
  done: "bg-success text-success-foreground",
  cancelled: "bg-destructive/15 text-destructive"
};
function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReplacementRequests);
  const updateFn = useServerFn(updateReplacementStatus);
  const [statusFilter, setStatusFilter] = reactExports.useState("preparing");
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin-replacements", statusFilter],
    queryFn: () => listFn({
      data: {
        status: statusFilter === "all" ? null : statusFilter
      }
    })
  });
  const [closing, setClosing] = reactExports.useState(null);
  const [returnBalai, setReturnBalai] = reactExports.useState({});
  const [busy, setBusy] = reactExports.useState(false);
  function openClose(req) {
    const map = {};
    for (const it of req.replacement_request_items ?? []) map[it.id] = true;
    setReturnBalai(map);
    setClosing(req);
  }
  function invalidate() {
    qc.invalidateQueries({
      queryKey: ["admin-replacements"]
    });
    qc.invalidateQueries({
      queryKey: ["admin-dashboard"]
    });
  }
  async function markReady(id) {
    try {
      await updateFn({
        data: {
          id,
          action: "ready"
        }
      });
      toast.success("נשלחה הודעה לצוות שהבקשה מוכנה");
      invalidate();
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function confirmDone() {
    setBusy(true);
    try {
      await updateFn({
        data: {
          id: closing.id,
          action: "done",
          return_balai: returnBalai
        }
      });
      toast.success("הבקשה הושלמה");
      setClosing(null);
      invalidate();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id) {
    if (!confirm("לבטל את הבקשה? המלאי יוחזר.")) return;
    try {
      await updateFn({
        data: {
          id,
          action: "cancel"
        }
      });
      toast.success("הבקשה בוטלה והמלאי הוחזר");
      invalidate();
    } catch (e) {
      toast.error(e.message);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "בקשות החלפה" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-44", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "preparing", children: "בהכנה" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "ready", children: "מוכן לאיסוף" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "done", children: "נאסף" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cancelled", children: "בוטלו" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "הכל" })
        ] })
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }) }) : !data?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-muted-foreground", children: "אין בקשות בסטטוס זה" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: data.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${STATUS_COLOR[r.status]}`, children: STATUS_LABEL[r.status] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: r.teams?.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: new Date(r.created_at).toLocaleString("he-IL") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
          r.ordered_by_name,
          " · ",
          r.contact_phone
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "text-sm mt-2 list-disc pr-5", children: (r.replacement_request_items ?? []).map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          it.name,
          " × ",
          it.quantity
        ] }, it.id)) }),
        r.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm mt-2 bg-muted p-2 rounded", children: [
          "הערה: ",
          r.notes
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        r.status === "preparing" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => cancel(r.id), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4 ml-1" }),
            " ביטול"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => markReady(r.id), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-4 h-4 ml-1" }),
            " מוכן לאיסוף"
          ] })
        ] }),
        r.status === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => cancel(r.id), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4 ml-1" }),
            " ביטול"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => openClose(r), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCheck, { className: "w-4 h-4 ml-1" }),
            " נאסף / סיום"
          ] })
        ] })
      ] })
    ] }) }, r.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!closing, onOpenChange: (o) => !o && setClosing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "סגירת בקשת החלפה" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "סמן לאילו פריטים הצוות החזיר את היחידה השבורה (תועבר לבלאי)." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: (closing?.replacement_request_items ?? []).map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 p-2 border rounded", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: returnBalai[it.id] ?? true, onCheckedChange: (v) => setReturnBalai({
          ...returnBalai,
          [it.id]: !!v
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1", children: [
          it.name,
          " × ",
          it.quantity
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "הוחזר פריט בלאי?" })
      ] }, it.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setClosing(null), children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: confirmDone, disabled: busy, children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : "סיום" })
      ] })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, { adminOnly: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Page, {}) });
export {
  SplitComponent as component
};
