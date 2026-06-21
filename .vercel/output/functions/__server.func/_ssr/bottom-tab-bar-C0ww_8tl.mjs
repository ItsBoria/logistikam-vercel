import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, e as useRouterState, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc } from "./createSsrRpc-BIyD4fIx.mjs";
import { u as useCart, s as setTeamSession } from "./router-Dj6bT8nv.mjs";
import { S as Sheet, a as SheetTrigger, b as SheetContent, c as SheetHeader, d as SheetTitle } from "./sheet-BCTinNGU.mjs";
import { B as Button } from "./button-DHovwa_B.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { i as isStandaloneInstalled, a as isIOSDevice, g as getExistingSubscription, b as isPushSupported, v as vapidKeyToUint8Array, r as registerSW } from "./push-client-BZqpsDrT.mjs";
import { g as getVapidPublicKey, s as subscribePush, u as unsubscribePush } from "./push.functions-C83gOflR.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { s as supabase } from "./client-CCJB_KSk.mjs";
import { H as House, R as Replace, e as ClipboardList, E as Ellipsis, a as LogOut, S as ShoppingCart, f as Smartphone, B as Bell, g as BellOff, L as LoaderCircle } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, a as arrayType, n as numberType } from "../_libs/zod.mjs";
createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1).max(32)
}).parse(input)).handler(createSsrRpc("8430ad8e0a8504020e1b302c68aa3dc9438e05adfe9e7c23dbcd58ac4d020052"));
const getShopData = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1)
}).parse(input)).handler(createSsrRpc("dd6cb2fcb81dc398cf1c7cdf76b43b9314eeed721c4784633396148c469d95be"));
const itemSchema = objectType({
  product_id: stringType().uuid(),
  quantity: numberType().int().min(1).max(999)
});
const placeOrder = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  items: arrayType(itemSchema).min(1).max(200),
  notes: stringType().max(500).optional(),
  contact_phone: stringType().min(7).max(20),
  ordered_by_name: stringType().min(1).max(100)
}).parse(input)).handler(createSsrRpc("385b5c5f9cc03331836f7729feeab0f123eaa87a0d056fe3b790ce29109db588"));
const repeatOrder = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  order_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("8ccdf75c2ffa9db73fc1ce8f5df9ecb2d06f081f644110e2af9df09fe0721a64"));
const getTeamOrders = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1)
}).parse(input)).handler(createSsrRpc("d25e036cf42d3e486eb39ee1810963dcc6544f74afa1621721cdd81efe7b35f6"));
const cancelOrder = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  order_id: stringType().uuid()
}).parse(input)).handler(createSsrRpc("ba1059106764ba691e4484038b994a12454907108ebdd0dd8673f0cf4fc825ef"));
const editOrder = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  pin: stringType().min(1),
  order_id: stringType().uuid(),
  items: arrayType(itemSchema).min(1).max(200),
  notes: stringType().max(500).optional(),
  contact_phone: stringType().min(7).max(20).optional(),
  ordered_by_name: stringType().min(1).max(100).optional()
}).parse(input)).handler(createSsrRpc("8ed89391e0f669469e5038daa4785d98cf30fabfeaa675e970c9379a958d3259"));
function PushToggle({ pin }) {
  const vapidFn = useServerFn(getVapidPublicKey);
  const subscribeFn = useServerFn(subscribePush);
  const unsubscribeFn = useServerFn(unsubscribePush);
  const [supported, setSupported] = reactExports.useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = reactExports.useState(false);
  const [on, setOn] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const sup = isPushSupported();
    setSupported(sup);
    setIosNeedsInstall(isIOSDevice() && !isStandaloneInstalled() && !sup);
    if (sup) getExistingSubscription().then((s) => setOn(!!s));
  }, []);
  async function enable() {
    if (!supported) {
      toast.error(
        iosNeedsInstall ? "ב‑iPhone יש להוסיף את האתר למסך הבית (שתף → הוסף למסך הבית) ולפתוח משם" : "הדפדפן לא תומך בהתראות"
      );
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("ההרשאה להתראות נדחתה");
        return;
      }
      const res = await vapidFn();
      if (!res.key) {
        toast.error(res.error || "התראות לא מוגדרות במערכת");
        return;
      }
      const appServerKey = vapidKeyToUint8Array(res.key);
      const reg = await registerSW();
      let sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await sub.unsubscribe();
        } catch (_) {
        }
        sub = null;
      }
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer.slice(appServerKey.byteOffset, appServerKey.byteOffset + appServerKey.byteLength)
      });
      const json = sub.toJSON();
      await subscribeFn({
        data: {
          pin,
          endpoint: sub.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth
        }
      });
      setOn(true);
      toast.success("התראות הופעלו 🎉");
    } catch (e) {
      console.error("[push] enable failed", e);
      toast.error(e?.message || "שגיאה בהפעלת התראות");
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFn({ data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setOn(false);
      toast.success("התראות כובו");
    } catch (e) {
      toast.error(e?.message || "שגיאה");
    } finally {
      setBusy(false);
    }
  }
  if (iosNeedsInstall) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: enable, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-4 h-4 ml-2" }),
      " הפעל התראות"
    ] });
  }
  if (!supported) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", disabled: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BellOff, { className: "w-4 h-4 ml-2" }),
      " לא נתמך"
    ] });
  }
  if (busy) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", disabled: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 ml-2 animate-spin" }),
      " רגע..."
    ] });
  }
  return on ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: disable, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BellOff, { className: "w-4 h-4 ml-2" }),
    " כבה התראות"
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: enable, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-4 h-4 ml-2" }),
    " הפעל התראות"
  ] });
}
function InstallButton() {
  const [evt, setEvt] = reactExports.useState(null);
  const [installed, setInstalled] = reactExports.useState(false);
  const [ios, setIos] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (isStandaloneInstalled()) {
      setInstalled(true);
      return;
    }
    setIos(isIOSDevice());
    const onPrompt = (e) => {
      e.preventDefault();
      setEvt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  if (installed) return null;
  if (ios) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "outline",
        className: "w-full justify-start h-12",
        onClick: () => toast.info(
          "ב‑iPhone: לחצו על כפתור השיתוף בספארי → 'הוסף למסך הבית'. לאחר הפתיחה מהמסך הבית, יופיע כאן כפתור להפעלת התראות"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "w-4 h-4 ml-2" }),
          " הוסף למסך הבית"
        ]
      }
    );
  }
  if (!evt) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Button,
    {
      variant: "outline",
      className: "w-full justify-start h-12",
      onClick: async () => {
        try {
          await evt.prompt();
          const { outcome } = await evt.userChoice;
          if (outcome === "accepted") setInstalled(true);
          setEvt(null);
        } catch {
        }
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "w-4 h-4 ml-2" }),
        " הוסף למסך הבית"
      ]
    }
  );
}
const SHOP_ITEMS = [
  { to: "/shop", label: "חנות", icon: House, exact: true },
  { to: "/shop/replacements", label: "החלפות", icon: Replace },
  { to: "/shop/orders", label: "הזמנות", icon: ClipboardList }
];
function formatPillCurrency(amount) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
function useIsActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to, exact) => exact ? path === to : path === to || path.startsWith(to + "/");
}
function PillBase({
  active,
  onClick,
  to,
  ariaLabel,
  children,
  tone = "normal"
}) {
  const appearance = tone === "error" ? "bg-destructive/10 text-destructive ring-1 ring-destructive/35" : tone === "warning" ? "bg-warning/20 text-warning-foreground ring-1 ring-warning/30" : active ? "bg-primary text-primary-foreground shadow-sm sm:px-3.5" : "text-muted-foreground hover:text-foreground hover:bg-muted";
  const cls = [
    "group relative flex items-center justify-center gap-1.5 sm:gap-2 rounded-full transition-all",
    "h-11 px-2 min-w-10 sm:px-3 sm:min-w-11",
    appearance
  ].join(" ");
  if (to) return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to, className: cls, "aria-label": ariaLabel, children });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick, className: cls, "aria-label": ariaLabel, type: "button", children });
}
function StorePill({ active }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PillBase, { active, to: "/shop", ariaLabel: "חנות", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "w-5 h-5 shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden text-xs font-medium whitespace-nowrap sm:inline", children: "חנות" })
  ] });
}
function CartPill({ pin }) {
  const queryClient = useQueryClient();
  const { itemCount, cart, openCheckout, bumpKey } = useCart();
  const fetchShop = useServerFn(getShopData);
  const { data } = useQuery({
    queryKey: ["shop", pin],
    queryFn: () => fetchShop({ data: { pin } }),
    staleTime: 0,
    refetchOnWindowFocus: "always"
  });
  const teamId = data?.team.id;
  reactExports.useEffect(() => {
    if (!teamId) return;
    const refreshBudget = () => {
      void queryClient.invalidateQueries({ queryKey: ["shop", pin] });
    };
    const channel = supabase.channel(`shop-budget-${teamId}`).on("postgres_changes", { event: "*", schema: "public", table: "teams", filter: `id=eq.${teamId}` }, refreshBudget).on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `team_id=eq.${teamId}` }, refreshBudget).subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pin, queryClient, teamId]);
  const products = data?.products ?? [];
  const cartTotal = products.reduce((sum, product) => sum + Number(product.price) * (cart[product.id] || 0), 0);
  const totalBudget = Number(data?.team.monthly_limit ?? 0);
  const previouslyUsed = Number(data?.spent ?? 0);
  const hasBudget = totalBudget > 0;
  const remainingRaw = hasBudget ? totalBudget - previouslyUsed - cartTotal : 0;
  const exceededBy = hasBudget ? Math.max(0, -remainingRaw) : 0;
  const remaining = hasBudget ? Math.max(0, remainingRaw) : 0;
  const isOverBudget = exceededBy > 0;
  const isLowBudget = hasBudget && !isOverBudget && remaining / totalBudget < 0.2;
  const tone = isOverBudget ? "error" : isLowBudget ? "warning" : "normal";
  const hasCart = itemCount > 0;
  const ariaLabel = hasBudget ? isOverBudget ? `סל: ${itemCount} פריטים, ${formatPillCurrency(cartTotal)}. חריגה מהתקציב בסך ${formatPillCurrency(exceededBy)}, מתוך תקציב כולל של ${formatPillCurrency(totalBudget)}` : `סל: ${itemCount} פריטים, ${formatPillCurrency(cartTotal)}. נותרו ${formatPillCurrency(remaining)} מתוך ${formatPillCurrency(totalBudget)}` : `סל: ${itemCount} פריטים, ${formatPillCurrency(cartTotal)}. ללא מסגרת תקציב`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PillBase, { active: hasCart, tone, onClick: openCheckout, ariaLabel, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex cart-pill-bump", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5" }) }, bumpKey),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 flex-col items-start leading-tight", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "hidden text-xs font-medium tabular-nums whitespace-nowrap sm:inline", children: [
        itemCount,
        " פריטים · ",
        formatPillCurrency(cartTotal)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-medium tabular-nums whitespace-nowrap sm:hidden", children: [
        "סל · ",
        itemCount,
        " · ",
        formatPillCurrency(cartTotal)
      ] }),
      hasBudget ? isOverBudget ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] sm:text-[10px] tabular-nums whitespace-nowrap", dir: "rtl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-foreground/65", children: [
          "תקציב ",
          formatPillCurrency(totalBudget)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": true, children: " · " }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: "font-extrabold text-destructive", children: [
          "חריגה ",
          formatPillCurrency(exceededBy)
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: [
        "text-[9px] sm:text-[10px] tabular-nums whitespace-nowrap",
        tone === "normal" && hasCart ? "text-primary-foreground/80" : "opacity-80"
      ].join(" "), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "hidden sm:inline", children: [
          "נותרו ",
          formatPillCurrency(remaining),
          " מתוך ",
          formatPillCurrency(totalBudget)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "sm:hidden", children: [
          formatPillCurrency(remaining),
          " / ",
          formatPillCurrency(totalBudget)
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: [
        "text-[9px] sm:text-[10px] whitespace-nowrap",
        hasCart ? "text-primary-foreground/80" : "text-muted-foreground"
      ].join(" "), children: "ללא מסגרת תקציב" })
    ] })
  ] });
}
function Tab({ item, active }) {
  const Icon = item.icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PillBase, { active, to: item.to, ariaLabel: item.label, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5 shrink-0" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: ["text-xs font-medium whitespace-nowrap", active ? "hidden sm:inline" : "hidden md:group-hover:inline"].join(" "), children: item.label })
  ] });
}
function BottomTabBar({ pin }) {
  const navigate = useNavigate();
  const isActive = useIsActive();
  const [open, setOpen] = reactExports.useState(false);
  function logout() {
    setTeamSession(null);
    setOpen(false);
    navigate({ to: "/" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24", "aria-hidden": true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),16px)] px-3 sm:px-4 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "nav",
      {
        className: [
          "pointer-events-auto mx-auto w-fit max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-2rem)]",
          "flex items-center gap-1 p-1.5 rounded-full",
          "bg-card/90 backdrop-blur-xl border shadow-lg"
        ].join(" "),
        children: [
          pin ? /* @__PURE__ */ jsxRuntimeExports.jsx(StorePill, { active: isActive("/shop", true) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { item: SHOP_ITEMS[0], active: isActive("/shop", true) }),
          pin && /* @__PURE__ */ jsxRuntimeExports.jsx(CartPill, { pin }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { item: SHOP_ITEMS[1], active: isActive("/shop/replacements") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { item: SHOP_ITEMS[2], active: isActive("/shop/orders") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open, onOpenChange: setOpen, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "group flex h-11 min-w-10 items-center justify-center gap-2 rounded-full px-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground sm:min-w-11 sm:px-3",
                "aria-label": "עוד",
                type: "button",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "w-5 h-5 shrink-0" })
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "bottom", className: "rounded-t-2xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { children: "עוד" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(InstallButton, {}),
                pin && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "[&>button]:w-full [&>button]:justify-start [&>button]:h-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PushToggle, { pin }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "w-full justify-start h-12", onClick: logout, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "w-4 h-4 ml-2" }),
                  " יציאה"
                ] })
              ] })
            ] })
          ] })
        ]
      }
    ) })
  ] });
}
export {
  BottomTabBar as B,
  getTeamOrders as a,
  cancelOrder as c,
  editOrder as e,
  getShopData as g,
  placeOrder as p,
  repeatOrder as r
};
