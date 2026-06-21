import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as AdminShell } from "./admin-shell-D2sNpD8P.mjs";
import { i as listProductsAdmin, j as updateProductStock } from "./admin.functions-M98_wxCk.mjs";
import { C as Card, B as Button } from "./button-DHovwa_B.mjs";
import { I as Input } from "./input-BwpJpE6I.mjs";
import { S as SearchInput } from "./search-input-DBpRcgsD.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { L as LoaderCircle, d as TriangleAlert, N as Save } from "../_libs/lucide-react.mjs";
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
import "./select-CDdlIHZe.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-slot.mjs";
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
import "./sheet-BCTinNGU.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "./use-scroll-direction-D4KBbDyh.mjs";
import "../_libs/tailwind-merge.mjs";
function Stock() {
  const qc = useQueryClient();
  const listFn = useServerFn(listProductsAdmin);
  const updateFn = useServerFn(updateProductStock);
  const {
    data: products,
    isLoading
  } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listFn()
  });
  const [draft, setDraft] = reactExports.useState({});
  const [savingId, setSavingId] = reactExports.useState(null);
  const [q, setQ] = reactExports.useState("");
  function setField(id, field, value, original) {
    setDraft((d) => ({
      ...d,
      [id]: {
        stock: field === "stock" ? value : d[id]?.stock ?? String(original.stock),
        threshold: field === "threshold" ? value : d[id]?.threshold ?? original.threshold ?? ""
      }
    }));
  }
  async function save(p) {
    const d = draft[p.id];
    if (!d) return;
    const stock = Number(d.stock);
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      toast.error("ערך מלאי לא תקין");
      return;
    }
    const thrStr = String(d.threshold ?? "").trim();
    const threshold = thrStr === "" ? null : Number(thrStr);
    if (threshold !== null && (!Number.isFinite(threshold) || threshold < 0 || !Number.isInteger(threshold))) {
      toast.error("ערך סף לא תקין");
      return;
    }
    setSavingId(p.id);
    try {
      await updateFn({
        data: {
          id: p.id,
          stock,
          low_stock_threshold: threshold
        }
      });
      toast.success("נשמר");
      setDraft((dd) => {
        const n = {
          ...dd
        };
        delete n[p.id];
        return n;
      });
      qc.invalidateQueries({
        queryKey: ["admin-products"]
      });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingId(null);
    }
  }
  const filtered = reactExports.useMemo(() => {
    const all = products ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter((p) => (p.name || "").toLowerCase().includes(term) || (p.category || "").toLowerCase().includes(term));
  }, [products, q]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "מלאי" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "עדכון כמות במלאי וסף התראה." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SearchInput, { containerClassName: "w-full sm:w-72 max-w-none", value: q, onChange: (e) => setQ(e.target.value), onClear: () => setQ(""), placeholder: "חיפוש מוצר/קטגוריה" })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-6 h-6 animate-spin mx-auto" }) }) : !filtered.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-muted-foreground", children: "אין מוצרים" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "divide-y", children: filtered.map((p) => {
      const effThreshold = p.low_stock_threshold ?? null;
      const stockDraft = draft[p.id]?.stock ?? String(p.stock);
      const thrDraft = draft[p.id]?.threshold ?? effThreshold ?? "";
      const dirty = !!draft[p.id];
      const low = p.stock <= (effThreshold ?? 5);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0", children: p.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.image_url, alt: "", className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center text-xl", children: "📦" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-[150px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-medium flex items-center gap-2", children: [
            p.name,
            low && /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-4 h-4 text-warning" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: p.category || "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground", children: "מלאי" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, className: "h-9 w-20 text-center", dir: "ltr", value: stockDraft, onChange: (e) => setField(p.id, "stock", e.target.value, {
            stock: p.stock,
            threshold: effThreshold
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs text-muted-foreground", children: "סף" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, className: "h-9 w-20 text-center", dir: "ltr", placeholder: "ברירת מחדל", value: thrDraft, onChange: (e) => setField(p.id, "threshold", e.target.value, {
            stock: p.stock,
            threshold: effThreshold
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => save(p), disabled: !dirty || savingId === p.id, children: savingId === p.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 ml-1" }),
          " שמור"
        ] }) })
      ] }, p.id);
    }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Stock, {}) });
export {
  SplitComponent as component
};
