import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, u as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent, d as useNavigate, e as useRouterState } from "../_libs/tanstack__react-router.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { T as Toaster } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-CCJB_KSk.mjs";
import { u as useReducedMotion, A as AnimatePresence, m as motion } from "../_libs/framer-motion.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
const appCss = "/assets/styles-BkqBoEgj.css";
function PageTransition({ children }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduceMotion = useReducedMotion();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      initial: { opacity: 0, y: reduceMotion ? 0 : 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: reduceMotion ? 0 : -6 },
      transition: { duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] },
      className: "contents",
      children
    },
    pathname
  ) });
}
const CartContext = reactExports.createContext(null);
function storageKey(pin) {
  return `cart:${pin}`;
}
function CartProvider({ children, pin }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [cart, setCart] = reactExports.useState({});
  const [bumpKey, setBumpKey] = reactExports.useState(0);
  const loadedRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!pin) {
      setCart({});
      loadedRef.current = null;
      return;
    }
    if (loadedRef.current === pin) return;
    loadedRef.current = pin;
    try {
      const raw = sessionStorage.getItem(storageKey(pin));
      setCart(raw ? JSON.parse(raw) : {});
    } catch {
      setCart({});
    }
  }, [pin]);
  reactExports.useEffect(() => {
    if (!pin) return;
    try {
      sessionStorage.setItem(storageKey(pin), JSON.stringify(cart));
    } catch {
    }
  }, [cart, pin]);
  const setQty = reactExports.useCallback((id, q, max) => {
    const v = Math.max(0, Math.min(max ?? Infinity, q));
    setCart((c) => {
      const prev = c[id] || 0;
      const n = { ...c };
      if (v === 0) delete n[id];
      else n[id] = v;
      if (v > prev) setBumpKey((k) => k + 1);
      return n;
    });
  }, []);
  const clear = reactExports.useCallback(() => setCart({}), []);
  const openCheckout = reactExports.useCallback(() => {
    if (path.startsWith("/shop") && path === "/shop") {
      window.dispatchEvent(new CustomEvent("open-checkout"));
    } else {
      navigate({ to: "/shop", search: { cart: "1" } });
    }
  }, [navigate, path]);
  const itemCount = reactExports.useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const value = { pin, cart, setQty, clear, itemCount, bumpKey, openCheckout };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(CartContext.Provider, { value, children });
}
function useCart() {
  const v = reactExports.useContext(CartContext);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
const KEY = "team_session_v1";
const ADMIN_ACTING_KEY = "admin_acting_team_v1";
function getTeamSession() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}
function setTeamSession(s) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  try {
    window.dispatchEvent(new Event("team-session-changed"));
  } catch {
  }
}
function setAdminActing(active) {
  if (typeof window === "undefined") return;
  if (active) localStorage.setItem(ADMIN_ACTING_KEY, "1");
  else localStorage.removeItem(ADMIN_ACTING_KEY);
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-muted-foreground", children: "העמוד לא נמצא" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground", children: "חזרה לדף הבית" })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "משהו השתבש" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: error.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          router2.invalidate();
          reset();
        },
        className: "mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground",
        children: "נסה שוב"
      }
    )
  ] }) });
}
const Route$h = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "מערכת הזמנות פלוגתיות" },
      { name: "description", content: "מערכת ניהול הזמנות פלוגתיות" },
      { property: "og:title", content: "מערכת הזמנות פלוגתיות" },
      { name: "twitter:title", content: "מערכת הזמנות פלוגתיות" },
      { property: "og:description", content: "מערכת ניהול הזמנות פלוגתיות" },
      { name: "twitter:description", content: "מערכת ניהול הזמנות פלוגתיות" },
      { property: "og:image", content: "/logikam-logo.svg" },
      { name: "twitter:image", content: "/logikam-logo.svg" },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/logikam-logo.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/logikam-logo.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "he", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$h.useRouteContext();
  const [pin, setPin] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const sync = () => setPin(getTeamSession()?.pin ?? null);
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("team-session-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("team-session-changed", sync);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AuthSync, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CartProvider, { pin, children: /* @__PURE__ */ jsxRuntimeExports.jsx(PageTransition, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", richColors: true, dir: "rtl" })
  ] });
}
function AuthSync() {
  const router2 = useRouter();
  const qc = useQueryClient();
  reactExports.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }
      router2.invalidate();
      if (event !== "SIGNED_OUT") {
        qc.invalidateQueries();
      }
    });
    return () => subscription.unsubscribe();
  }, [router2, qc]);
  return null;
}
const $$splitComponentImporter$g = () => import("./select-team-D1CNKRiG.mjs");
const Route$g = createFileRoute("/select-team")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "בחירת צוות"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./index-DDqUNcLJ.mjs");
const Route$f = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "כניסה - מערכת הזמנות"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./shop.index-ft7pRUQF.mjs");
const Route$e = createFileRoute("/shop/")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "חנות - מערכת הזמנות צוותים"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./admin.index-BAy3KxmY.mjs");
const Route$d = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "סקירה - פאנל ניהול"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./shop.replacements-CISnRE6k.mjs");
const Route$c = createFileRoute("/shop/replacements")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "החלפות - מערכת הזמנות צוותים"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./shop.orders-t8SS1Hop.mjs");
const $$splitErrorComponentImporter = () => import("./shop.orders-DlDR-on7.mjs");
const $$splitNotFoundComponentImporter = () => import("./shop.orders-C5fR5apT.mjs");
const Route$b = createFileRoute("/shop/orders")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "ההזמנות שלי"
    }]
  }),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./admin.users-BKkEb9bh.mjs");
const Route$a = createFileRoute("/admin/users")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "מנהלים - פאנל ניהול"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./admin.teams-BCzCycse.mjs");
const Route$9 = createFileRoute("/admin/teams")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "צוותים - פאנל ניהול"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./admin.stock-DyW-H3AD.mjs");
const Route$8 = createFileRoute("/admin/stock")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "מלאי - פאנל"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./admin.replacements-CpAQAZgZ.mjs");
const Route$7 = createFileRoute("/admin/replacements")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "בקשות החלפה - פאנל ניהול"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./admin.replacement-inventory-HZ0VqqFc.mjs");
const Route$6 = createFileRoute("/admin/replacement-inventory")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "מלאי החלפות - פאנל ניהול"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./admin.products-Con39E1i.mjs");
const Route$5 = createFileRoute("/admin/products")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "מוצרים - פאנל ניהול"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./admin.preferences-BStxKGVl.mjs");
const Route$4 = createFileRoute("/admin/preferences")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "העדפות אישיות - ניהול"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./admin.orders-D0wFBRvQ.mjs");
const Route$3 = createFileRoute("/admin/orders")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "הזמנות - פאנל ניהול"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./admin.notifications-DjhEQ1YT.mjs");
const Route$2 = createFileRoute("/admin/notifications")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "ההתראות שלי"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./admin.login-DoJ-fn_X.mjs");
const Route$1 = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "כניסת מנהלים"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./admin.calendar-CgQXb07R.mjs");
const Route = createFileRoute("/admin/calendar")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "תכנית שבועית - פאנל"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SelectTeamRoute = Route$g.update({
  id: "/select-team",
  path: "/select-team",
  getParentRoute: () => Route$h
});
const IndexRoute = Route$f.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$h
});
const ShopIndexRoute = Route$e.update({
  id: "/shop/",
  path: "/shop/",
  getParentRoute: () => Route$h
});
const AdminIndexRoute = Route$d.update({
  id: "/admin/",
  path: "/admin/",
  getParentRoute: () => Route$h
});
const ShopReplacementsRoute = Route$c.update({
  id: "/shop/replacements",
  path: "/shop/replacements",
  getParentRoute: () => Route$h
});
const ShopOrdersRoute = Route$b.update({
  id: "/shop/orders",
  path: "/shop/orders",
  getParentRoute: () => Route$h
});
const AdminUsersRoute = Route$a.update({
  id: "/admin/users",
  path: "/admin/users",
  getParentRoute: () => Route$h
});
const AdminTeamsRoute = Route$9.update({
  id: "/admin/teams",
  path: "/admin/teams",
  getParentRoute: () => Route$h
});
const AdminStockRoute = Route$8.update({
  id: "/admin/stock",
  path: "/admin/stock",
  getParentRoute: () => Route$h
});
const AdminReplacementsRoute = Route$7.update({
  id: "/admin/replacements",
  path: "/admin/replacements",
  getParentRoute: () => Route$h
});
const AdminReplacementInventoryRoute = Route$6.update({
  id: "/admin/replacement-inventory",
  path: "/admin/replacement-inventory",
  getParentRoute: () => Route$h
});
const AdminProductsRoute = Route$5.update({
  id: "/admin/products",
  path: "/admin/products",
  getParentRoute: () => Route$h
});
const AdminPreferencesRoute = Route$4.update({
  id: "/admin/preferences",
  path: "/admin/preferences",
  getParentRoute: () => Route$h
});
const AdminOrdersRoute = Route$3.update({
  id: "/admin/orders",
  path: "/admin/orders",
  getParentRoute: () => Route$h
});
const AdminNotificationsRoute = Route$2.update({
  id: "/admin/notifications",
  path: "/admin/notifications",
  getParentRoute: () => Route$h
});
const AdminLoginRoute = Route$1.update({
  id: "/admin/login",
  path: "/admin/login",
  getParentRoute: () => Route$h
});
const AdminCalendarRoute = Route.update({
  id: "/admin/calendar",
  path: "/admin/calendar",
  getParentRoute: () => Route$h
});
const rootRouteChildren = {
  IndexRoute,
  SelectTeamRoute,
  AdminCalendarRoute,
  AdminLoginRoute,
  AdminNotificationsRoute,
  AdminOrdersRoute,
  AdminPreferencesRoute,
  AdminProductsRoute,
  AdminReplacementInventoryRoute,
  AdminReplacementsRoute,
  AdminStockRoute,
  AdminTeamsRoute,
  AdminUsersRoute,
  ShopOrdersRoute,
  ShopReplacementsRoute,
  AdminIndexRoute,
  ShopIndexRoute
};
const routeTree = Route$h._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  setAdminActing as a,
  getTeamSession as g,
  router as r,
  setTeamSession as s,
  useCart as u
};
