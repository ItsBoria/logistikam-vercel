import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as AdminShell } from "./admin-shell-D2sNpD8P.mjs";
import { p as listOrders, u as updateOrderStatus, q as listTeamsBasic, r as updateOrderItems, t as deleteOrder, v as deleteOldOrders, w as getOrderDetail, x as updateAdminNotes } from "./admin.functions-M98_wxCk.mjs";
import { B as Button, C as Card } from "./button-DHovwa_B.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CDdlIHZe.mjs";
import { I as Input } from "./input-BwpJpE6I.mjs";
import { T as Textarea } from "./textarea-C03r_PgF.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-tTnl1o2f.mjs";
import { S as Sheet, b as SheetContent, c as SheetHeader, d as SheetTitle } from "./sheet-BCTinNGU.mjs";
import { A as Accordion, a as AccordionItem, b as AccordionTrigger, c as AccordionContent, d as downloadOrderInvoicePDF, e as downloadOrderInvoiceDOCX } from "./invoice-BpzBX4BT.mjs";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./pdf-fonts-DKyE_pTi.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as utils, w as writeFileSync } from "../_libs/xlsx.mjs";
import { S as SearchInput } from "./search-input-DBpRcgsD.mjs";
import "../_libs/jspdf.mjs";
import "../_libs/jspdf-autotable.mjs";
import "../_libs/file-saver.mjs";
import "../_libs/docx.mjs";
import { $ as Eraser, y as Download, a0 as Funnel, X, a1 as StickyNote, v as User, w as Phone, a2 as Info, o as Pencil, C as ChevronDown, F as FileText, z as FileType, T as Trash2, M as Minus, P as Plus, a3 as CircleCheck, a4 as Truck, a5 as PackageCheck, a6 as History } from "../_libs/lucide-react.mjs";
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
import "./use-scroll-direction-D4KBbDyh.mjs";
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
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-accordion.mjs";
import "../_libs/radix-ui__react-collapsible.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "fs";
import "path";
import "../_libs/fflate.mjs";
import "../_libs/fast-png.mjs";
import "../_libs/iobuffer.mjs";
import "../_libs/pako.mjs";
import "../_libs/html2canvas.mjs";
import "../_libs/dompurify.mjs";
import "../_libs/canvg.mjs";
import "../_libs/core-js.mjs";
import "../_libs/babel__runtime.mjs";
import "../_libs/raf.mjs";
import "../_libs/performance-now.mjs";
import "../_libs/rgbcolor.mjs";
import "../_libs/svg-pathdata.mjs";
import "../_libs/stackblur-canvas.mjs";
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
const FILTER_STORAGE_KEY = "admin-orders-filters-v1";
function todayIso() {
  const d = /* @__PURE__ */ new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function weekAgoIso() {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function OrdersPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listOrders);
  const updateFn = useServerFn(updateOrderStatus);
  const teamsFn = useServerFn(listTeamsBasic);
  const updateItemsFn = useServerFn(updateOrderItems);
  const deleteOrderFn = useServerFn(deleteOrder);
  const deleteOldFn = useServerFn(deleteOldOrders);
  const detailFn = useServerFn(getOrderDetail);
  const notesFn = useServerFn(updateAdminNotes);
  const [teamId, setTeamId] = reactExports.useState("all");
  const [status, setStatus] = reactExports.useState("all");
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [search, setSearch] = reactExports.useState("");
  const [preset, setPreset] = reactExports.useState("all");
  const [editing, setEditing] = reactExports.useState(null);
  const [detailOrderId, setDetailOrderId] = reactExports.useState(null);
  const [cleanupOpen, setCleanupOpen] = reactExports.useState(false);
  const [cleanupBefore, setCleanupBefore] = reactExports.useState(() => {
    const d = /* @__PURE__ */ new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [cleanupOnlyDone, setCleanupOnlyDone] = reactExports.useState(true);
  const [cleanupBusy, setCleanupBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTER_STORAGE_KEY);
      if (raw) {
        const f = JSON.parse(raw);
        if (f.teamId) setTeamId(f.teamId);
        if (f.status) setStatus(f.status);
        if (f.from) setFrom(f.from);
        if (f.to) setTo(f.to);
      }
    } catch {
    }
  }, []);
  reactExports.useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      teamId,
      status,
      from,
      to
    }));
  }, [teamId, status, from, to]);
  const {
    data: teams
  } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: () => teamsFn()
  });
  const {
    data: orders,
    isLoading
  } = useQuery({
    queryKey: ["admin-orders", teamId, status, from, to, search],
    queryFn: () => listFn({
      data: {
        team_id: teamId === "all" ? null : teamId,
        status: status === "all" ? null : status,
        from: from || null,
        to: to ? (/* @__PURE__ */ new Date(to + "T23:59:59")).toISOString() : null,
        search: search || null
      }
    })
  });
  function applyPreset(p) {
    setPreset(p);
    if (p === "all") {
      setStatus("all");
      setFrom("");
      setTo("");
    } else if (p === "today") {
      setStatus("all");
      setFrom(todayIso());
      setTo(todayIso());
    } else if (p === "week") {
      setStatus("all");
      setFrom(weekAgoIso());
      setTo(todayIso());
    } else if (p === "awaiting") {
      setStatus("awaiting_approval");
      setFrom("");
      setTo("");
    } else if (p === "ready") {
      setStatus("ready");
      setFrom("");
      setTo("");
    }
  }
  async function changeStatus(id, s) {
    try {
      await updateFn({
        data: {
          id,
          status: s
        }
      });
      toast.success("הסטטוס עודכן");
      qc.invalidateQueries({
        queryKey: ["admin-orders"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  function startEdit(o) {
    setEditing({
      order_id: o.id,
      notes: o.notes ?? "",
      items: o.order_items.map((it) => ({
        id: it.id,
        product_id: it.product_id,
        name: it.name,
        price: Number(it.price),
        quantity: it.quantity
      }))
    });
  }
  async function saveEdit() {
    if (!editing.items.length) {
      toast.error("חייב להישאר לפחות פריט אחד");
      return;
    }
    try {
      await updateItemsFn({
        data: {
          order_id: editing.order_id,
          items: editing.items.map((it) => ({
            product_id: it.product_id ?? null,
            name: it.name,
            price: Number(it.price),
            quantity: Number(it.quantity)
          })),
          notes: editing.notes || null
        }
      });
      toast.success("ההזמנה עודכנה");
      setEditing(null);
      qc.invalidateQueries({
        queryKey: ["admin-orders"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function removeOrder(id) {
    if (!confirm("למחוק את ההזמנה לצמיתות?")) return;
    try {
      await deleteOrderFn({
        data: {
          id
        }
      });
      toast.success("ההזמנה נמחקה");
      qc.invalidateQueries({
        queryKey: ["admin-orders"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function runCleanup() {
    setCleanupBusy(true);
    try {
      const iso = (/* @__PURE__ */ new Date(cleanupBefore + "T00:00:00")).toISOString();
      const res = await deleteOldFn({
        data: {
          before: iso,
          only_completed: cleanupOnlyDone
        }
      });
      toast.success(`נמחקו ${res.deleted} הזמנות`);
      setCleanupOpen(false);
      qc.invalidateQueries({
        queryKey: ["admin-orders"]
      });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCleanupBusy(false);
    }
  }
  function exportExcel() {
    if (!orders?.length) return;
    const rows = orders.flatMap((o) => o.order_items.map((it) => ({
      "מס׳ הזמנה": o.id.slice(0, 8),
      "תאריך": new Date(o.created_at).toLocaleString("he-IL"),
      "צוות": o.teams?.name ?? "",
      "סטטוס": STATUS_LABEL[o.status] ?? o.status,
      "מזמין": o.ordered_by_name ?? "",
      "טלפון": o.contact_phone ?? "",
      "מוצר": it.name,
      "מחיר": Number(it.price),
      "כמות": it.quantity,
      "סכום שורה": Number(it.price) * it.quantity,
      "סה״כ הזמנה": Number(o.total),
      "הערות": o.notes ?? ""
    })));
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({
      wch: 16
    }));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "הזמנות");
    writeFileSync(wb, `orders-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`);
  }
  async function downloadInvoice(o, fmt) {
    try {
      if (fmt === "pdf") await downloadOrderInvoicePDF(o);
      else await downloadOrderInvoiceDOCX(o);
    } catch (e) {
      toast.error(e.message ?? "שגיאה בייצוא");
    }
  }
  function resetFilters() {
    setPreset("all");
    setTeamId("all");
    setStatus("all");
    setFrom("");
    setTo("");
    setSearch("");
  }
  const totalSum = reactExports.useMemo(() => (orders ?? []).reduce((s, o) => s + Number(o.total), 0), [orders]);
  const editTotal = reactExports.useMemo(() => editing?.items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0) ?? 0, [editing]);
  function quickActionsFor(s) {
    if (s === "pending" || s === "awaiting_approval") return [{
      label: "אישור",
      to: "approved",
      icon: CircleCheck,
      variant: "default"
    }];
    if (s === "approved") return [{
      label: "בהכנה",
      to: "preparing",
      icon: Truck,
      variant: "outline"
    }];
    if (s === "preparing") return [{
      label: "מוכן",
      to: "ready",
      icon: PackageCheck,
      variant: "default"
    }];
    if (s === "ready") return [{
      label: "הושלם",
      to: "completed",
      icon: CircleCheck,
      variant: "default"
    }];
    return [];
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "הזמנות" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          orders?.length ?? 0,
          " הזמנות · סה״כ ₪",
          totalSum.toFixed(0)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => setCleanupOpen(true), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Eraser, { className: "w-4 h-4 ml-2" }),
          " מחיקת הזמנות ישנות"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: exportExcel, disabled: !orders?.length, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 ml-2" }),
          " ייצוא לאקסל"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 space-y-3 sticky top-2 z-10 bg-card/95 backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 flex-wrap", children: [["all", "הכל"], ["today", "היום"], ["week", "השבוע"], ["awaiting", "ממתינות לאישור"], ["ready", "מוכנות לאיסוף"]].map(([k, label]) => /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: preset === k ? "default" : "outline", onClick: () => applyPreset(k), children: label }, k)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SearchInput, { containerClassName: "max-w-none", placeholder: "חפש לפי מס׳, צוות, מזמין, טלפון או מוצר", value: search, onChange: (e) => setSearch(e.target.value), onClear: () => setSearch("") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: teamId, onValueChange: setTeamId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "צוות" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "כל הצוותים" }),
            teams?.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: t.id, children: t.name }, t.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: status, onValueChange: setStatus, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "סטטוס" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "כל הסטטוסים" }),
            Object.entries(STATUS_LABEL).map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: k, children: v }, k))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: from, onChange: (e) => {
          setPreset("all");
          setFrom(e.target.value);
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: to, onChange: (e) => {
          setPreset("all");
          setTo(e.target.value);
        } })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "w-3 h-3" }),
          " סינון נשמר אוטומטית בדפדפן"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: resetFilters, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3 ml-1" }),
          " נקה"
        ] })
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center", children: "טוען..." }) : !orders?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-muted-foreground", children: "אין הזמנות" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Accordion, { type: "multiple", className: "space-y-2", children: orders.map((o) => {
      const ageH = (Date.now() - new Date(o.created_at).getTime()) / 36e5;
      const stuck = o.status === "awaiting_approval" && ageH > 24 || o.status === "ready" && ageH > 48;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItem, { value: o.id, className: `border rounded-lg bg-card px-4 ${stuck ? "border-warning border-2" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionTrigger, { className: "hover:no-underline", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-wrap items-start justify-between gap-3 pr-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[200px] text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: o.teams?.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[o.status]}`, children: STATUS_LABEL[o.status] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "#",
                o.id.slice(0, 8)
              ] }),
              stuck && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-warning-foreground", children: "⏱ תקועה" }),
              o.admin_notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs flex items-center gap-1 text-primary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(StickyNote, { className: "w-3 h-3" }),
                " הערת מנהל"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: new Date(o.created_at).toLocaleString("he-IL") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-3 h-3" }),
                o.ordered_by_name
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", dir: "ltr", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "w-3 h-3" }),
                o.contact_phone
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                o.order_items.length,
                " פריטים"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold", children: [
            "₪",
            Number(o.total).toFixed(0)
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded divide-y", children: o.order_items.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between p-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              it.name,
              " × ",
              it.quantity
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "₪",
              (Number(it.price) * it.quantity).toFixed(0)
            ] })
          ] }, it.id)) }),
          o.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm bg-muted p-2 rounded", children: [
            "הערות צוות: ",
            o.notes
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            quickActionsFor(o.status).map((qa) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: qa.variant ?? "default", onClick: () => changeStatus(o.id, qa.to), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(qa.icon, { className: "w-4 h-4 ml-1" }),
              " ",
              qa.label
            ] }, qa.to)),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: o.status, onValueChange: (v) => changeStatus(o.id, v), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-44 h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.entries(STATUS_LABEL).map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: k, children: v }, k)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setDetailOrderId(o.id), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "w-4 h-4 ml-1" }),
              " פרטים"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => startEdit(o), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-4 h-4 ml-1" }),
              " ערוך פריטים"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 ml-1" }),
                " חשבונית ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-3 h-3 mr-1" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => downloadInvoice(o, "pdf"), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "w-4 h-4 ml-2" }),
                  " PDF"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => downloadInvoice(o, "docx"), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileType, { className: "w-4 h-4 ml-2" }),
                  " Word (DOCX)"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => removeOrder(o.id), className: "text-destructive hover:text-destructive", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 ml-1" }),
              " מחק"
            ] })
          ] })
        ] }) })
      ] }, o.id);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(OrderDetailDrawer, { orderId: detailOrderId, onClose: () => setDetailOrderId(null), fetchFn: detailFn, notesFn }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editing, onOpenChange: (o) => !o && setEditing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "עריכת הזמנה" }) }),
      editing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          editing.items.map((it, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border rounded p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "flex-1", value: it.name, onChange: (e) => setEditing({
              ...editing,
              items: editing.items.map((x, i) => i === idx ? {
                ...x,
                name: e.target.value
              } : x)
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "w-24", type: "number", step: "0.01", value: it.price, onChange: (e) => setEditing({
              ...editing,
              items: editing.items.map((x, i) => i === idx ? {
                ...x,
                price: e.target.value
              } : x)
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: () => setEditing({
                ...editing,
                items: editing.items.map((x, i) => i === idx ? {
                  ...x,
                  quantity: Math.max(1, Number(x.quantity) - 1)
                } : x)
              }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-3 h-3" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "w-14 text-center", type: "number", value: it.quantity, onChange: (e) => setEditing({
                ...editing,
                items: editing.items.map((x, i) => i === idx ? {
                  ...x,
                  quantity: e.target.value
                } : x)
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", onClick: () => setEditing({
                ...editing,
                items: editing.items.map((x, i) => i === idx ? {
                  ...x,
                  quantity: Number(x.quantity) + 1
                } : x)
              }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-3 h-3" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setEditing({
              ...editing,
              items: editing.items.filter((_, i) => i !== idx)
            }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 text-destructive" }) })
          ] }, idx)),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setEditing({
            ...editing,
            items: [...editing.items, {
              name: "",
              price: 0,
              quantity: 1,
              product_id: null
            }]
          }), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 ml-2" }),
            " פריט חדש"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "הערות" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: editing.notes, onChange: (e) => setEditing({
            ...editing,
            notes: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between font-bold text-lg border-t pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: 'סה"כ חדש' }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "₪",
            editTotal.toFixed(0)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setEditing(null), children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveEdit, children: "שמירה" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: cleanupOpen, onOpenChange: setCleanupOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "מחיקת הזמנות ישנות" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "פעולה זו תמחק לצמיתות את כל ההזמנות שנוצרו לפני התאריך שתבחר." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "מחק הזמנות לפני" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: cleanupBefore, onChange: (e) => setCleanupBefore(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: cleanupOnlyDone, onChange: (e) => setCleanupOnlyDone(e.target.checked) }),
          "מחק רק הזמנות שהושלמו או בוטלו"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setCleanupOpen(false), disabled: cleanupBusy, children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", onClick: runCleanup, disabled: cleanupBusy, children: cleanupBusy ? "מוחק..." : "מחק" })
      ] })
    ] }) })
  ] });
}
function OrderDetailDrawer({
  orderId,
  onClose,
  fetchFn,
  notesFn
}) {
  const qc = useQueryClient();
  const [noteDraft, setNoteDraft] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => fetchFn({
      data: {
        id: orderId
      }
    }),
    enabled: !!orderId
  });
  reactExports.useEffect(() => {
    if (data?.order) setNoteDraft(data.order.admin_notes ?? "");
  }, [data?.order?.id]);
  async function saveNote() {
    if (!orderId) return;
    setSaving(true);
    try {
      await notesFn({
        data: {
          id: orderId,
          admin_notes: noteDraft || null
        }
      });
      toast.success("ההערה נשמרה");
      qc.invalidateQueries({
        queryKey: ["admin-orders"]
      });
      qc.invalidateQueries({
        queryKey: ["order-detail", orderId]
      });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open: !!orderId, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "left", className: "w-full sm:max-w-lg overflow-y-auto", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SheetHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { children: "פרטי הזמנה" }) }),
    isLoading || !data ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-10 text-center text-sm text-muted-foreground", children: "טוען..." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3 space-y-1 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "צוות" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: data.order.teams?.name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "סטטוס" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[data.order.status]}`, children: STATUS_LABEL[data.order.status] ?? data.order.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "מס׳" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { dir: "ltr", children: [
            "#",
            data.order.id.slice(0, 8)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "נוצרה" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(data.order.created_at).toLocaleString("he-IL") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "מזמין" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: data.order.ordered_by_name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "טלפון" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { dir: "ltr", children: data.order.contact_phone })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t pt-1 mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "סה״כ" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold", children: [
            "₪",
            Number(data.order.total).toFixed(2)
          ] })
        ] })
      ] }),
      data.order.teams?.monthly_limit > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3 text-sm space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "תקציב חודשי של הצוות" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "₪",
            Number(data.monthSpent).toFixed(0),
            " / ₪",
            Number(data.order.teams.monthly_limit).toFixed(0)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary", style: {
          width: `${Math.min(100, data.monthSpent / data.order.teams.monthly_limit * 100)}%`
        } }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold mb-2", children: "פריטים" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y text-sm", children: data.order.order_items.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between py-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            it.name,
            " × ",
            it.quantity
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { dir: "ltr", children: [
            "₪",
            (Number(it.price) * it.quantity).toFixed(2)
          ] })
        ] }, it.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(StickyNote, { className: "w-4 h-4" }),
          " הערה פנימית למנהלים"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "לא נראית לצוות. שמורה רק לעיני הצוות הניהולי." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: noteDraft, onChange: (e) => setNoteDraft(e.target.value), rows: 3, placeholder: "לדוגמה: לקוח התקשר וביקש לעכב..." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: saveNote, disabled: saving, children: saving ? "שומר..." : "שמור הערה" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-bold flex items-center gap-2 mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "w-4 h-4" }),
          " ציר זמן סטטוס"
        ] }),
        data.history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "אין רשומות." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-2 text-sm", children: data.history.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              h.from_status && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-1.5 py-0.5 rounded text-[10px] ${STATUS_COLOR[h.from_status] ?? ""}`, children: STATUS_LABEL[h.from_status] ?? h.from_status }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "→" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLOR[h.to_status] ?? ""}`, children: STATUS_LABEL[h.to_status] ?? h.to_status })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [
              new Date(h.created_at).toLocaleString("he-IL"),
              h.changed_by_name && ` · ${h.changed_by_name}`
            ] })
          ] })
        ] }, h.id)) })
      ] })
    ] })
  ] }) });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(OrdersPage, {}) });
export {
  SplitComponent as component
};
