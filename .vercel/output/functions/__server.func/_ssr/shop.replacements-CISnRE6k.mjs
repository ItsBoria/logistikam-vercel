import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { g as getTeamSession } from "./router-Dj6bT8nv.mjs";
import { B as Button, C as Card } from "./button-DHovwa_B.mjs";
import { I as Input } from "./input-BwpJpE6I.mjs";
import { T as Textarea } from "./textarea-C03r_PgF.mjs";
import { B as Badge } from "./badge-DcEpcOcf.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-tTnl1o2f.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { B as BottomTabBar } from "./bottom-tab-bar-C0ww_8tl.mjs";
import { L as LoaderCircle, R as Replace, S as ShoppingCart, M as Minus, P as Plus, o as Pencil, T as Trash2 } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, a as arrayType, n as numberType } from "../_libs/zod.mjs";
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
import "node:async_hooks";
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
import "../_libs/framer-motion.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
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
import "./sheet-BCTinNGU.mjs";
import "./push-client-BZqpsDrT.mjs";
import "./push.functions-C83gOflR.mjs";
const getReplacementShop = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1).max(32)
}).parse(input)).handler(createSsrRpc("df247b03992b5b2a3e89e4f1c7a16aa27ba22dda9282f999694cf807ca1387ab"));
const itemSchema = objectType({
  replacement_product_id: stringType().uuid(),
  quantity: numberType().int().min(1).max(99)
});
const submitReplacementRequest = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  items: arrayType(itemSchema).min(1).max(50),
  notes: stringType().max(500).optional(),
  contact_phone: stringType().min(7).max(20),
  ordered_by_name: stringType().min(1).max(100)
}).parse(input)).handler(createSsrRpc("f9a48a7be1a5b474b90ed857ac045772fd1f511317cd2786af751fe4aa6f8334"));
const getTeamReplacementRequests = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1)
}).parse(input)).handler(createSsrRpc("3327bb7f94bf0966f6d05e73ccc814940f57eb71e5967d026af4bd31a8770bd4"));
const deleteReplacementRequest = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  request_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("5c47c6298a5d9abd0b8eb583a64edaa59b11383078e9cb0b36cd95b95df7d75c"));
const editReplacementRequest = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  request_id: stringType().uuid(),
  items: arrayType(itemSchema).min(1).max(50),
  notes: stringType().max(500).optional(),
  contact_phone: stringType().min(7).max(20).optional(),
  ordered_by_name: stringType().min(1).max(100).optional()
}).parse(input)).handler(createSsrRpc("5c9b561d3e82d4d48ca1aa9e6ac64400ffbd51aabf97315f427ae58bf5f38f55"));
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
function ReplacementsPage() {
  const navigate = useNavigate();
  const session = typeof window !== "undefined" ? getTeamSession() : null;
  reactExports.useEffect(() => {
    if (!session) navigate({
      to: "/",
      replace: true
    });
  }, [session, navigate]);
  const fetchShop = useServerFn(getReplacementShop);
  const submitFn = useServerFn(submitReplacementRequest);
  const fetchHistory = useServerFn(getTeamReplacementRequests);
  const deleteReqFn = useServerFn(deleteReplacementRequest);
  const editReqFn = useServerFn(editReplacementRequest);
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    enabled: !!session,
    queryKey: ["replacement-shop", session?.pin],
    queryFn: () => fetchShop({
      data: {
        pin: session.pin
      }
    })
  });
  const {
    data: history,
    refetch: refetchHistory
  } = useQuery({
    enabled: !!session,
    queryKey: ["replacement-history", session?.pin],
    queryFn: () => fetchHistory({
      data: {
        pin: session.pin
      }
    })
  });
  const [cart, setCart] = reactExports.useState({});
  const [checkout, setCheckout] = reactExports.useState(false);
  const [name, setName] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
  const [placing, setPlacing] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!session) return;
    try {
      const raw = localStorage.getItem(`team-contact:${session.pin}`);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.name) setName(v.name);
        if (v.phone) setPhone(v.phone);
      }
    } catch {
    }
  }, [session?.pin]);
  const products = data?.products ?? [];
  const itemCount = reactExports.useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  function setQty(id, q) {
    const v = Math.max(0, Math.min(99, q));
    setCart((c) => {
      const n = {
        ...c
      };
      if (v === 0) delete n[id];
      else n[id] = v;
      return n;
    });
  }
  async function submit() {
    if (!name || !phone) {
      toast.error("יש למלא שם וטלפון");
      return;
    }
    setPlacing(true);
    try {
      const items = Object.entries(cart).map(([replacement_product_id, quantity]) => ({
        replacement_product_id,
        quantity
      }));
      await submitFn({
        data: {
          pin: session.pin,
          items,
          contact_phone: phone,
          ordered_by_name: name,
          notes
        }
      });
      try {
        localStorage.setItem(`team-contact:${session.pin}`, JSON.stringify({
          name,
          phone
        }));
      } catch {
      }
      toast.success("בקשת ההחלפה נשלחה. תקבלו הודעה כשתהיה מוכנה לאיסוף");
      setCart({});
      setCheckout(false);
      setNotes("");
      refetch();
      refetchHistory();
    } catch (e) {
      toast.error(e.message || "שגיאה בשליחת הבקשה");
    } finally {
      setPlacing(false);
    }
  }
  const [editing, setEditing] = reactExports.useState(null);
  const [editQty, setEditQty] = reactExports.useState({});
  const [savingEdit, setSavingEdit] = reactExports.useState(false);
  function startEdit(req) {
    const initial = {};
    for (const it of req.replacement_request_items ?? []) {
      if (it.replacement_product_id) initial[it.replacement_product_id] = Number(it.quantity);
    }
    setEditQty(initial);
    setEditing(req);
  }
  function bumpEdit(id, delta) {
    setEditQty((m) => {
      const next = {
        ...m,
        [id]: Math.max(0, (m[id] ?? 0) + delta)
      };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }
  async function saveEdit() {
    if (!editing || !session) return;
    const items = Object.entries(editQty).map(([replacement_product_id, quantity]) => ({
      replacement_product_id,
      quantity
    }));
    if (items.length === 0) {
      toast.error("חייב להישאר לפחות פריט אחד");
      return;
    }
    setSavingEdit(true);
    try {
      await editReqFn({
        data: {
          pin: session.pin,
          request_id: editing.id,
          items
        }
      });
      toast.success("הבקשה עודכנה");
      setEditing(null);
      refetch();
      refetchHistory();
    } catch (e) {
      toast.error(e.message || "שגיאה");
    } finally {
      setSavingEdit(false);
    }
  }
  async function handleDelete(id) {
    if (!session) return;
    if (!confirm("למחוק את בקשת ההחלפה?")) return;
    try {
      await deleteReqFn({
        data: {
          pin: session.pin,
          request_id: id
        }
      });
      toast.success("הבקשה נמחקה");
      refetch();
      refetchHistory();
    } catch (e) {
      toast.error(e.message || "שגיאה");
    }
  }
  if (!session) return null;
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-secondary/30", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-card border-b sticky top-0 z-30 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-bold text-lg flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Replace, { className: "w-5 h-5" }),
          " החלפת פריט שבור"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          data?.team.name,
          " · ללא חיוב מתקציב"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setCheckout(true), disabled: itemCount === 0, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "w-4 h-4 ml-2" }),
        " סל (",
        itemCount,
        ")"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "max-w-6xl mx-auto p-4 space-y-6", children: [
      products.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-muted-foreground", children: "אין פריטים זמינים להחלפה כרגע" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: products.map((p) => {
        const qty = cart[p.id] || 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "aspect-square bg-muted relative", children: [
            p.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.image_url, alt: p.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center text-3xl", children: "🔧" }),
            p.category && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "absolute top-2 right-2", children: p.category })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 flex-1 flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold leading-tight", children: p.name }),
            p.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1 line-clamp-2", children: p.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-xs text-success", children: "זמין להחלפה" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: qty === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full h-11", onClick: () => setQty(p.id, 1), children: "הוסף" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-11 w-11", onClick: () => setQty(p.id, qty - 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-5 h-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-lg tabular-nums", children: qty }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-11 w-11", onClick: () => setQty(p.id, qty + 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-5 h-5" }) })
            ] }) })
          ] })
        ] }, p.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold mb-3", children: "בקשות החלפה אחרונות" }),
        (history?.requests ?? []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "עדיין לא שלחת בקשות החלפה" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: history.requests.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b last:border-b-0 pb-3 last:pb-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-0.5 rounded ${STATUS_COLOR[r.status]}`, children: STATUS_LABEL[r.status] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: new Date(r.created_at).toLocaleString("he-IL") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "text-sm mt-1 list-disc pr-5", children: (r.replacement_request_items ?? []).map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            it.name,
            " × ",
            it.quantity
          ] }, it.id)) }),
          r.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            "הערה: ",
            r.notes
          ] }),
          r.status === "preparing" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-2 justify-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => startEdit(r), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-3.5 h-3.5 ml-1" }),
              " ערוך"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "text-destructive", onClick: () => handleDelete(r.id), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5 ml-1" }),
              " מחק"
            ] })
          ] })
        ] }, r.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 sm:hidden", "aria-hidden": true })
    ] }),
    itemCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sm:hidden fixed inset-x-0 z-50 bg-card border-t shadow-lg p-3 flex items-center gap-3", style: {
      bottom: "calc(4rem + env(safe-area-inset-bottom))"
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-xs text-muted-foreground", children: [
        itemCount,
        " פריטים להחלפה"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "h-12 px-6 text-base", onClick: () => setCheckout(true), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "w-5 h-5 ml-2" }),
        " שליחת בקשה"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BottomTabBar, { pin: session?.pin }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: checkout, onOpenChange: setCheckout, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "בקשת החלפה" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 max-h-64 overflow-y-auto", children: Object.entries(cart).map(([id, q]) => {
        const p = products.find((x) => x.id === id);
        if (!p) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 font-medium text-sm", children: p.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm tabular-nums", children: [
            "× ",
            q
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setQty(id, 0), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 text-destructive" }) })
        ] }, id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "שם המבקש", value: name, onChange: (e) => setName(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "טלפון", value: phone, onChange: (e) => setPhone(e.target.value), dir: "ltr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "סיבת ההחלפה / הערות", value: notes, onChange: (e) => setNotes(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "הבקשה תיכנס מיד להכנה. אין חיוב מתקציב. תקבלו הודעה כשהיא תהיה מוכנה לאיסוף." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setCheckout(false), children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: submit, disabled: placing || itemCount === 0, children: placing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : "שליחת בקשה" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editing, onOpenChange: (o) => !o && setEditing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "עריכת בקשת החלפה" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-[60vh] overflow-y-auto", children: editing && (editing.replacement_request_items ?? []).map((it) => {
        if (!it.replacement_product_id) return null;
        const qty = editQty[it.replacement_product_id] ?? 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0 font-medium text-sm truncate", children: it.name }),
          qty === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => bumpEdit(it.replacement_product_id, 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", onClick: () => bumpEdit(it.replacement_product_id, -1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold tabular-nums w-6 text-center", children: qty }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-9 w-9", onClick: () => bumpEdit(it.replacement_product_id, 1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9", onClick: () => setEditQty((m) => {
              const n = {
                ...m
              };
              delete n[it.replacement_product_id];
              return n;
            }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 text-destructive" }) })
          ] })
        ] }, it.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "ניתן לשנות כמויות או להסיר פריטים. עריכה אפשרית רק כל עוד הבקשה בהכנה." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setEditing(null), children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveEdit, disabled: savingEdit, children: savingEdit ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : "שמור שינויים" })
      ] })
    ] }) })
  ] });
}
export {
  ReplacementsPage as component
};
