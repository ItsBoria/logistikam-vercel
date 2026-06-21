import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as AdminShell } from "./admin-shell-D2sNpD8P.mjs";
import { a as listReplacementProducts, b as upsertReplacementProduct, d as deleteReplacementProduct, c as adjustReplacementStock, e as bulkImportReplacementProducts } from "./replacement-admin.functions-_PB7w-kR.mjs";
import { k as uploadProductImage } from "./admin.functions-M98_wxCk.mjs";
import { B as Button, C as Card } from "./button-DHovwa_B.mjs";
import { I as Input } from "./input-BwpJpE6I.mjs";
import { T as Textarea } from "./textarea-C03r_PgF.mjs";
import { S as Switch } from "./switch-Di8POljc.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./dialog-tTnl1o2f.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { r as readSync, u as utils, w as writeFileSync } from "../_libs/xlsx.mjs";
import { Q as Upload, y as Download, P as Plus, o as Pencil, V as ArrowLeftRight, T as Trash2, X, L as LoaderCircle, W as Image, Y as CircleMinus } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-switch.mjs";
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1] || "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReplacementProducts);
  const upsertFn = useServerFn(upsertReplacementProduct);
  const deleteFn = useServerFn(deleteReplacementProduct);
  const adjustFn = useServerFn(adjustReplacementStock);
  const bulkFn = useServerFn(bulkImportReplacementProducts);
  const uploadFn = useServerFn(uploadProductImage);
  const {
    data: products
  } = useQuery({
    queryKey: ["admin-repl-products"],
    queryFn: () => listFn()
  });
  const [editing, setEditing] = reactExports.useState(null);
  const [adjust, setAdjust] = reactExports.useState(null);
  const [moveQty, setMoveQty] = reactExports.useState("1");
  const [uploading, setUploading] = reactExports.useState(false);
  const fileRef = reactExports.useRef(null);
  const imgFileRef = reactExports.useRef(null);
  function newOne() {
    setEditing({
      name: "",
      description: "",
      category: "",
      image_url: "",
      image_preview: "",
      active: true,
      takin_stock: 0,
      balai_stock: 0
    });
  }
  function startEdit(p) {
    setEditing({
      ...p,
      image_url: p._raw_image_url || "",
      image_preview: p.image_url || ""
    });
  }
  async function save() {
    try {
      await upsertFn({
        data: {
          id: editing.id,
          name: editing.name,
          description: editing.description || null,
          category: editing.category || null,
          image_url: editing.image_url || "",
          active: !!editing.active,
          takin_stock: Number(editing.takin_stock) || 0,
          balai_stock: Number(editing.balai_stock) || 0
        }
      });
      toast.success("נשמר");
      setEditing(null);
      qc.invalidateQueries({
        queryKey: ["admin-repl-products"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function remove(id) {
    if (!confirm("למחוק פריט החלפה זה?")) return;
    try {
      await deleteFn({
        data: {
          id
        }
      });
      toast.success("נמחק");
      qc.invalidateQueries({
        queryKey: ["admin-repl-products"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function handleImageUpload(file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("הקובץ גדול מ-5MB");
      return;
    }
    setUploading(true);
    try {
      const data_base64 = await fileToBase64(file);
      const res = await uploadFn({
        data: {
          filename: file.name,
          content_type: file.type || "image/jpeg",
          data_base64
        }
      });
      setEditing((e) => ({
        ...e,
        image_url: res.storage_ref,
        image_preview: res.preview_url
      }));
      toast.success("התמונה הועלתה");
    } catch (e) {
      toast.error(e.message || "שגיאת העלאה");
    } finally {
      setUploading(false);
      if (imgFileRef.current) imgFileRef.current.value = "";
    }
  }
  async function moveBalaiToTakin(p) {
    const n = Number(moveQty);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("כמות לא תקינה");
      return;
    }
    try {
      await adjustFn({
        data: {
          id: p.id,
          takin_delta: n,
          balai_delta: -n
        }
      });
      toast.success("הועבר לתקין");
      setAdjust(null);
      qc.invalidateQueries({
        queryKey: ["admin-repl-products"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function writeOffBalai(p) {
    const n = Number(moveQty);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("כמות לא תקינה");
      return;
    }
    try {
      await adjustFn({
        data: {
          id: p.id,
          takin_delta: 0,
          balai_delta: -n
        }
      });
      toast.success("סומן כפסולת");
      setAdjust(null);
      qc.invalidateQueries({
        queryKey: ["admin-repl-products"]
      });
    } catch (e) {
      toast.error(e.message);
    }
  }
  function downloadTemplate() {
    const sample = [{
      "שם": "דוגמה",
      "תיאור": "תיאור",
      "קטגוריה": "חשמל",
      "תמונה": "https://...",
      "תקין": 5,
      "בלאי": 0
    }];
    const ws = utils.json_to_sheet(sample);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "פריטי החלפה");
    writeFileSync(wb, "replacements-template.xlsx");
  }
  async function importFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = readSync(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = utils.sheet_to_json(ws);
      const rows = json.map((r) => ({
        name: String(r["שם"] ?? r["name"] ?? "").trim(),
        description: r["תיאור"] ?? r["description"] ?? null,
        category: r["קטגוריה"] ?? r["category"] ?? null,
        image_url: r["תמונה"] ?? r["image_url"] ?? null,
        takin_stock: Number(r["תקין"] ?? r["takin_stock"] ?? 0),
        balai_stock: Number(r["בלאי"] ?? r["balai_stock"] ?? 0)
      })).filter((r) => r.name);
      if (!rows.length) {
        toast.error("הקובץ ריק או בפורמט שגוי");
        return;
      }
      const res = await bulkFn({
        data: {
          rows
        }
      });
      toast.success(`נוספו ${res.inserted} פריטים`);
      qc.invalidateQueries({
        queryKey: ["admin-repl-products"]
      });
    } catch (e2) {
      toast.error(e2.message || "שגיאה ביבוא");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "מלאי החלפות" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "פריטי חלופה לציוד שבור. תקין = ניתן לתת לצוות. בלאי = מאוחסן אצלך, לא נראה לצוותים." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileRef, type: "file", accept: ".xlsx,.xls,.csv", onChange: importFile, className: "hidden" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => fileRef.current?.click(), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-4 h-4 ml-2" }),
          " ייבוא Excel"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: downloadTemplate, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 ml-2" }),
          " תבנית"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: newOne, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 ml-2" }),
          " פריט חדש"
        ] })
      ] })
    ] }),
    !products?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-muted-foreground", children: "אין פריטי החלפה" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: products.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `overflow-hidden ${!p.active ? "opacity-60" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-28 h-28 bg-muted shrink-0", children: p.image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.image_url, alt: p.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-full flex items-center justify-center text-2xl", children: "🔧" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 flex-1 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold leading-tight", children: p.name }),
        p.category && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: p.category }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded bg-success/15 text-success", children: [
            "תקין: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: p.takin_stock })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded bg-warning/15 text-warning-foreground", children: [
            "בלאי: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: p.balai_stock })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 pt-1 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => startEdit(p), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "w-3 h-3 ml-1" }),
            " עריכה"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
            setAdjust(p);
            setMoveQty("1");
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeftRight, { className: "w-3 h-3 ml-1" }),
            " ניהול מלאי"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => remove(p.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3 text-destructive" }) })
        ] })
      ] })
    ] }) }, p.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!editing, onOpenChange: (o) => !o && setEditing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-lg max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editing?.id ? "עריכת פריט החלפה" : "פריט החלפה חדש" }) }),
      editing && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "שם" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editing.name, onChange: (e) => setEditing({
            ...editing,
            name: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "תיאור" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: editing.description ?? "", onChange: (e) => setEditing({
            ...editing,
            description: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "קטגוריה" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: editing.category ?? "", onChange: (e) => setEditing({
            ...editing,
            category: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "תקין (זמין לצוותים)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, value: editing.takin_stock, onChange: (e) => setEditing({
              ...editing,
              takin_stock: e.target.value
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "בלאי (אדמין בלבד)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, value: editing.balai_stock, onChange: (e) => setEditing({
              ...editing,
              balai_stock: e.target.value
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "תמונה" }),
          editing.image_preview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-32 h-32 rounded overflow-hidden border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: editing.image_preview, className: "w-full h-full object-cover", alt: "" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "destructive", size: "icon", className: "absolute top-1 left-1 h-6 w-6", onClick: () => setEditing({
              ...editing,
              image_url: "",
              image_preview: ""
            }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-3 h-3" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: imgFileRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
            const f = e.target.files?.[0];
            if (f) handleImageUpload(f);
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => imgFileRef.current?.click(), disabled: uploading, children: [
            uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin ml-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "w-4 h-4 ml-2" }),
            "העלאת קובץ"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "או הדבק קישור URL", value: editing.image_url?.startsWith("storage:") ? "" : editing.image_url ?? "", onChange: (e) => setEditing({
            ...editing,
            image_url: e.target.value,
            image_preview: e.target.value
          }), dir: "ltr" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: editing.active, onCheckedChange: (v) => setEditing({
            ...editing,
            active: v
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "פעיל" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setEditing(null), children: "ביטול" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: save, children: "שמירה" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!adjust, onOpenChange: (o) => !o && setAdjust(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { children: [
        "ניהול מלאי — ",
        adjust?.name
      ] }) }),
      adjust && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded bg-success/15 text-success", children: [
            "תקין: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: adjust.takin_stock })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded bg-warning/15 text-warning-foreground", children: [
            "בלאי: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: adjust.balai_stock })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm", children: "כמות" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, value: moveQty, onChange: (e) => setMoveQty(e.target.value), dir: "ltr" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => moveBalaiToTakin(adjust), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeftRight, { className: "w-4 h-4 ml-2" }),
            " העבר מבלאי לתקין (לאחר תיקון)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => writeOffBalai(adjust), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleMinus, { className: "w-4 h-4 ml-2" }),
            " סמן כפסולת (הסר מבלאי)"
          ] })
        ] })
      ] })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, { adminOnly: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Page, {}) });
export {
  SplitComponent as component
};
