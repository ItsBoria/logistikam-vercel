import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { B as BottomTabBar, p as placeOrder, g as getShopData } from "./bottom-tab-bar-C0ww_8tl.mjs";
import { B as BrandLogo } from "./brand-logo-3B4j9ROK.mjs";
import { g as getTeamSession, u as useCart } from "./router-Dj6bT8nv.mjs";
import { f as formatCurrency, V as VAT_LABEL } from "./pricing-DW2SFuan.mjs";
import { C as Card, B as Button } from "./button-DHovwa_B.mjs";
import { I as Input } from "./input-BwpJpE6I.mjs";
import { T as Textarea } from "./textarea-C03r_PgF.mjs";
import { B as Badge } from "./badge-DcEpcOcf.mjs";
import { S as Switch } from "./switch-Di8POljc.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CDdlIHZe.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-tTnl1o2f.mjs";
import { S as SearchInput } from "./search-input-DBpRcgsD.mjs";
import { u as useHideOnScroll } from "./use-scroll-direction-D4KBbDyh.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { L as LoaderCircle, M as Minus, P as Plus, T as Trash2, d as TriangleAlert } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-switch.mjs";
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
function Shop() {
  const navigate = useNavigate();
  const session = typeof window !== "undefined" ? getTeamSession() : null;
  const hidden = useHideOnScroll();
  reactExports.useEffect(() => {
    if (!session) navigate({
      to: "/",
      replace: true
    });
  }, [session, navigate]);
  const fetchShop = useServerFn(getShopData);
  const orderFn = useServerFn(placeOrder);
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    enabled: !!session,
    queryKey: ["shop", session?.pin],
    queryFn: () => fetchShop({
      data: {
        pin: session.pin
      }
    })
  });
  const {
    cart,
    setQty,
    clear: clearCart
  } = useCart();
  const [checkout, setCheckout] = reactExports.useState(false);
  const [phone, setPhone] = reactExports.useState("");
  const [name, setName] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
  const [placing, setPlacing] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const h = () => setCheckout(true);
    window.addEventListener("open-checkout", h);
    return () => window.removeEventListener("open-checkout", h);
  }, []);
  reactExports.useEffect(() => {
    if (!session) return;
    try {
      const k = `team-contact:${session.pin}`;
      const raw = localStorage.getItem(k);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.name) setName(v.name);
        if (v.phone) setPhone(v.phone);
      }
      const prefillKey = `prefill-cart:${session.pin}`;
      const prefill = sessionStorage.getItem(prefillKey);
      if (prefill) {
        sessionStorage.removeItem(prefillKey);
        const items = JSON.parse(prefill);
        for (const it of items) setQty(it.product_id, it.quantity);
      }
    } catch {
    }
  }, [session?.pin]);
  const [search, setSearch] = reactExports.useState("");
  const [category, setCategory] = reactExports.useState("all");
  const [inStockOnly, setInStockOnly] = reactExports.useState(false);
  const products = data?.products ?? [];
  const categories = reactExports.useMemo(() => {
    const s = /* @__PURE__ */ new Set();
    products.forEach((p) => p.category && s.add(p.category));
    return Array.from(s).sort();
  }, [products]);
  const filtered = reactExports.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (q && !`${p.name} ${p.description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, category, inStockOnly]);
  const total = reactExports.useMemo(() => products.reduce((s, p) => s + Number(p.price) * (cart[p.id] || 0), 0), [products, cart]);
  const itemCount = reactExports.useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const limit = Number(data?.team.monthly_limit ?? 0);
  const spent = Number(data?.spent ?? 0);
  const remainingAfterCart = limit > 0 ? limit - spent - total : Infinity;
  const willExceed = limit > 0 && remainingAfterCart < 0;
  const exceededBy = willExceed ? Math.abs(remainingAfterCart) : 0;
  async function submitOrder() {
    if (willExceed) {
      toast.error(`הסל חורג מהתקציב ב-${formatCurrency(exceededBy)}`);
      return;
    }
    if (!phone || !name) {
      toast.error("יש למלא שם וטלפון");
      return;
    }
    setPlacing(true);
    try {
      const items = Object.entries(cart).map(([product_id, quantity]) => ({
        product_id,
        quantity
      }));
      const res = await orderFn({
        data: {
          pin: session.pin,
          items,
          notes,
          contact_phone: phone,
          ordered_by_name: name
        }
      });
      try {
        localStorage.setItem(`team-contact:${session.pin}`, JSON.stringify({
          name,
          phone
        }));
      } catch {
      }
      toast.success(res.requires_approval ? "ההזמנה נשלחה ומחכה לאישור מנהל (חריגה ממסגרת)" : "ההזמנה נשלחה בהצלחה!");
      clearCart();
      setCheckout(false);
      setNotes("");
      refetch();
    } catch (e) {
      toast.error(e.message || "שגיאה בשליחת הזמנה");
    } finally {
      setPlacing(false);
    }
  }
  if (!session) return null;
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-secondary/30", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AdminActingBanner, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: ["bg-card/80 border-b sticky top-0 z-30 backdrop-blur transition-transform duration-300 ease-out", hidden ? "-translate-y-full" : "translate-y-0"].join(" "), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto px-4 pt-4 pb-3 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { size: 48, className: "mx-auto mb-1.5 rounded-2xl drop-shadow" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-bold tracking-tight", children: data?.team.name ?? "ברוכים הבאים" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mt-0.5", children: "מה תרצו להזמין היום?" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "max-w-6xl mx-auto p-4 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SearchInput, { containerClassName: "flex-1 max-w-none", placeholder: "חיפוש מוצר...", value: search, onChange: (e) => setSearch(e.target.value), onClear: () => setSearch("") }),
        categories.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: category, onValueChange: setCategory, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "sm:w-48", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "כל הקטגוריות" }),
            categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm whitespace-nowrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: inStockOnly, onCheckedChange: setInStockOnly }),
          "במלאי בלבד"
        ] })
      ] }),
      filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-muted-foreground", children: "לא נמצאו מוצרים" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 admin-stagger", children: filtered.map((p) => {
        const qty = cart[p.id] || 0;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden flex flex-col store-product-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "aspect-square bg-muted relative", children: [
            p.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.image_url, alt: p.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center text-muted-foreground text-3xl", children: "📦" }),
            p.category && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "absolute top-2 right-2", children: p.category })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 flex-1 flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold leading-tight", children: p.name }),
            p.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1 line-clamp-2", children: p.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-start justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-lg", children: formatCurrency(Number(p.price)) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: VAT_LABEL })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "מלאי: ",
                p.stock
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: qty === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full h-11", disabled: p.stock === 0, onClick: () => setQty(p.id, 1, p.stock), children: p.stock === 0 ? "אזל" : "הוסף" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-11 w-11", onClick: () => setQty(p.id, qty - 1, p.stock), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "w-5 h-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-lg tabular-nums", children: qty }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "h-11 w-11", onClick: () => setQty(p.id, qty + 1, p.stock), disabled: qty >= p.stock, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-5 h-5" }) })
            ] }) })
          ] })
        ] }, p.id);
      }) }, `${category}-${search}-${inStockOnly}`),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24 sm:hidden", "aria-hidden": true })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BottomTabBar, { pin: session.pin }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: checkout, onOpenChange: setCheckout, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "סיכום הזמנה" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 max-h-64 overflow-y-auto", children: Object.entries(cart).map(([id, q]) => {
        const p = products.find((x) => x.id === id);
        if (!p) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 border-b pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm", children: p.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
              formatCurrency(Number(p.price)),
              " × ",
              q
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: formatCurrency(Number(p.price) * q) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setQty(id, 0, p.stock), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 text-destructive" }) })
        ] }, id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2 border-t", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between font-bold text-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: 'סה"כ' }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatCurrency(total) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "כל המחירים ",
          VAT_LABEL
        ] }),
        willExceed && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm bg-destructive/10 text-destructive p-2 rounded flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-4 h-4" }),
          "הסל חורג מהתקציב ב-",
          formatCurrency(exceededBy),
          ". יש להסיר פריטים לפני שליחת ההזמנה."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "שם המזמין", value: name, onChange: (e) => setName(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "טלפון לאיסוף", value: phone, onChange: (e) => setPhone(e.target.value), dir: "ltr" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { placeholder: "הערות (אופציונלי)", value: notes, onChange: (e) => setNotes(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setCheckout(false), children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: submitOrder, disabled: placing || itemCount === 0 || willExceed, children: placing ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : willExceed ? "חריגה מהתקציב" : "אישור ושליחת הזמנה" })
      ] })
    ] }) })
  ] });
}
function AdminActingBanner() {
  const navigate = useNavigate();
  const [acting, setActing] = reactExports.useState(false);
  reactExports.useEffect(() => {
    try {
      setActing(localStorage.getItem("admin_acting_team_v1") === "1");
    } catch {
    }
  }, []);
  if (!acting) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-primary text-primary-foreground text-sm px-4 py-2 flex items-center justify-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "מצב צפייה כצוות (בדיקה)" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "underline text-xs", onClick: () => {
      localStorage.removeItem("admin_acting_team_v1");
      localStorage.removeItem("team_session_v1");
      navigate({
        to: "/admin"
      });
    }, children: "חזרה לפאנל ניהול" })
  ] });
}
export {
  Shop as component
};
