import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { B as BottomTabBar, c as cancelOrder, r as repeatOrder, e as editOrder, a as getTeamOrders } from "./bottom-tab-bar-C0ww_8tl.mjs";
import { g as getTeamSession } from "./router-Dj6bT8nv.mjs";
import { V as VAT_LABEL, f as formatCurrency } from "./pricing-DW2SFuan.mjs";
import { C as Card, B as Button } from "./button-DHovwa_B.mjs";
import { A as Accordion, a as AccordionItem, b as AccordionTrigger, c as AccordionContent, d as downloadOrderInvoicePDF, e as downloadOrderInvoiceDOCX } from "./invoice-BpzBX4BT.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-tTnl1o2f.mjs";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from "./pdf-fonts-DKyE_pTi.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/jspdf.mjs";
import "../_libs/jspdf-autotable.mjs";
import "../_libs/file-saver.mjs";
import "../_libs/docx.mjs";
import { L as LoaderCircle, A as ArrowRight, e as ClipboardList, v as User, w as Phone, o as Pencil, X, x as RotateCcw, y as Download, C as ChevronDown, F as FileText, z as FileType, P as Plus, M as Minus, T as Trash2 } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "./server-CIKTFqrt.mjs";
import "node:async_hooks";
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
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./push-client-BZqpsDrT.mjs";
import "./push.functions-C83gOflR.mjs";
import "../_libs/zod.mjs";
import "./client-CCJB_KSk.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/framer-motion.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-accordion.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-collapsible.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-dropdown-menu.mjs";
import "../_libs/radix-ui__react-menu.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
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
const EDITABLE_ORDER_STATUSES = /* @__PURE__ */ new Set(["pending", "awaiting_approval"]);
const STATUS_LABEL = {
  pending: "ממתינה",
  awaiting_approval: "ממתינה לאישור מנהל",
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
function OrdersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const session = typeof window !== "undefined" ? getTeamSession() : null;
  const fetchOrders = useServerFn(getTeamOrders);
  const reorderFn = useServerFn(repeatOrder);
  const cancelFn = useServerFn(cancelOrder);
  const editFn = useServerFn(editOrder);
  reactExports.useEffect(() => {
    if (!session?.pin) {
      navigate({
        to: "/",
        replace: true
      });
    }
  }, [navigate, session?.pin]);
  const {
    data,
    isLoading
  } = useQuery({
    enabled: !!session?.pin,
    queryKey: ["team-orders", session?.pin],
    queryFn: () => fetchOrders({
      data: {
        pin: session.pin
      }
    }),
    staleTime: 3e4
  });
  const [editing, setEditing] = reactExports.useState(null);
  const [editQty, setEditQty] = reactExports.useState({});
  const [saving, setSaving] = reactExports.useState(false);
  function startEdit(order) {
    const initial = {};
    for (const it of order.order_items) {
      if (it.product_id) initial[it.product_id] = Number(it.quantity);
    }
    setEditQty(initial);
    setEditing(order);
  }
  function bumpEdit(productId, delta) {
    setEditQty((m) => {
      const next = {
        ...m,
        [productId]: Math.max(0, (m[productId] ?? 0) + delta)
      };
      if (next[productId] === 0) delete next[productId];
      return next;
    });
  }
  async function saveEdit() {
    if (!editing || !session?.pin) return;
    const items = Object.entries(editQty).map(([product_id, quantity]) => ({
      product_id,
      quantity
    }));
    if (items.length === 0) {
      toast.error("חייב להישאר לפחות פריט אחד");
      return;
    }
    setSaving(true);
    try {
      await editFn({
        data: {
          pin: session.pin,
          order_id: editing.id,
          items
        }
      });
      toast.success("ההזמנה עודכנה");
      setEditing(null);
      qc.invalidateQueries({
        queryKey: ["team-orders", session.pin]
      });
    } catch (e) {
      toast.error(e.message || "שגיאה");
    } finally {
      setSaving(false);
    }
  }
  async function handleCancel(orderId) {
    if (!session?.pin) return;
    if (!confirm("לבטל את ההזמנה?")) return;
    try {
      await cancelFn({
        data: {
          pin: session.pin,
          order_id: orderId
        }
      });
      toast.success("ההזמנה בוטלה");
      qc.invalidateQueries({
        queryKey: ["team-orders", session.pin]
      });
    } catch (e) {
      toast.error(e.message || "שגיאה");
    }
  }
  async function handleReorder(orderId) {
    if (!session?.pin) return;
    try {
      const res = await reorderFn({
        data: {
          pin: session.pin,
          order_id: orderId
        }
      });
      if (!res.items.length) {
        toast.error("אף אחד מהפריטים אינו זמין כעת");
        return;
      }
      sessionStorage.setItem(`prefill-cart:${session.pin}`, JSON.stringify(res.items));
      if (res.skipped.length) {
        toast.warning(`חלק מהפריטים לא נוספו: ${res.skipped.join(", ")}`);
      } else {
        toast.success("הפריטים הועברו לסל");
      }
      navigate({
        to: "/shop"
      });
    } catch (e) {
      toast.error(e.message || "שגיאה");
    }
  }
  if (!session?.pin || isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }) });
  }
  if (!data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "לא נמצאו נתוני הזמנות כרגע." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/shop", children: "חזרה לחנות" }) }) })
    ] }) });
  }
  const orders = data.orders ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-secondary/30", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-30 border-b bg-card/95 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-bold", children: "ההזמנות שלי" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: data.team.name })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/shop", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-2 h-4 w-4" }),
        "חזרה לחנות"
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
            orders.length,
            " הזמנות"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "כל המחירים ",
          VAT_LABEL
        ] })
      ] }) }),
      !orders.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-10 text-center text-muted-foreground", children: "עוד לא ביצעת הזמנות" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Accordion, { type: "multiple", className: "space-y-3", children: orders.map((order) => {
        const itemCount = order.order_items.reduce((sum, item) => sum + Number(item.quantity), 0);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(AccordionItem, { value: order.id, className: "overflow-hidden rounded-lg border bg-card px-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionTrigger, { className: "py-4 hover:no-underline", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full flex-col gap-3 text-right sm:flex-row sm:items-center sm:justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[order.status] ?? STATUS_COLOR.pending}`, children: STATUS_LABEL[order.status] ?? order.status }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold", children: [
                  "#",
                  order.id.slice(0, 8)
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: new Date(order.created_at).toLocaleString("he-IL") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3" }),
                  order.ordered_by_name || "ללא שם"
                ] }),
                order.contact_phone ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", dir: "ltr", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3 w-3" }),
                  order.contact_phone
                ] }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  itemCount,
                  " פריטים"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: formatCurrency(Number(order.total)) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AccordionContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-md border", children: order.order_items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b px-3 py-2 text-sm last:border-b-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: item.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  formatCurrency(Number(item.price)),
                  " × ",
                  item.quantity
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: formatCurrency(Number(item.price) * Number(item.quantity)) })
            ] }, item.id)) }),
            order.notes ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-muted p-3 text-sm", children: [
              "הערות: ",
              order.notes
            ] }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap justify-end gap-2", children: [
              EDITABLE_ORDER_STATUSES.has(order.status) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => startEdit(order), children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "ml-2 h-4 w-4" }),
                  " ערוך"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleCancel(order.id), className: "text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "ml-2 h-4 w-4" }),
                  " בטל הזמנה"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleReorder(order.id), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "ml-2 h-4 w-4" }),
                " הזמן שוב"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "ml-2 h-4 w-4" }),
                  " חשבונית ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "mr-1 h-3 w-3" })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { align: "end", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => downloadOrderInvoicePDF({
                    ...order,
                    team_name: data.team.name
                  }).catch((e) => toast.error(e.message ?? "שגיאה")), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "ml-2 h-4 w-4" }),
                    " PDF"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => downloadOrderInvoiceDOCX({
                    ...order,
                    team_name: data.team.name
                  }).catch((e) => toast.error(e.message ?? "שגיאה")), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileType, { className: "ml-2 h-4 w-4" }),
                    " Word (DOCX)"
                  ] })
                ] })
              ] })
            ] })
          ] }) })
        ] }, order.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BottomTabBar, { pin: session?.pin }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editing, onOpenChange: (o) => !o && setEditing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "עריכת הזמנה" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-[60vh] overflow-y-auto", children: editing && editing.order_items.map((it) => {
        if (!it.product_id) return null;
        const qty = editQty[it.product_id] ?? 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm truncate", children: it.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: formatCurrency(Number(it.price)) })
          ] }),
          qty === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => bumpEdit(it.product_id, 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", onClick: () => bumpEdit(it.product_id, -1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold tabular-nums w-6 text-center", children: qty }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", onClick: () => bumpEdit(it.product_id, 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", onClick: () => setEditQty((m) => {
              const n = {
                ...m
              };
              delete n[it.product_id];
              return n;
            }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
          ] })
        ] }, it.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "ניתן לשנות כמויות או להסיר פריטים. ההזמנה מוגבלת לפריטים הקיימים בה." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setEditing(null), children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveEdit, disabled: saving, children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "שמור שינויים" })
      ] })
    ] }) })
  ] });
}
export {
  OrdersPage as component
};
