import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./createSsrRpc-BIyD4fIx.mjs";
import { A as AdminShell } from "./admin-shell-D2sNpD8P.mjs";
import { C as Card, B as Button } from "./button-DHovwa_B.mjs";
import { S as Switch } from "./switch-Di8POljc.mjs";
import { g as getMyNotificationPrefs, s as setMyNotificationPref, a as subscribeAdminPush, b as unsubscribeAdminPush, c as sendTestAdminPush } from "./use-admin-roles-Ml6iIwxA.mjs";
import { g as getVapidPublicKey } from "./push.functions-C83gOflR.mjs";
import { a as isIOSDevice, i as isStandaloneInstalled, g as getExistingSubscription, b as isPushSupported, v as vapidKeyToUint8Array, r as registerSW } from "./push-client-BZqpsDrT.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a7 as Send, L as LoaderCircle, g as BellOff, B as Bell } from "../_libs/lucide-react.mjs";
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
const EVENTS = [["order_created", "הזמנה חדשה", "כאשר צוות שולח הזמנה"], ["order_awaiting_approval", "ממתינה לאישור", "הזמנה שדורשת אישור"], ["order_approved", "הזמנה אושרה", "אישור הזמנה"], ["order_rejected", "הזמנה נדחתה", "דחיית הזמנה"], ["order_ready", "מוכנה לאיסוף", "הזמנה מוכנה"], ["order_cancelled", "הזמנה בוטלה", "ביטול הזמנה"], ["budget_low", "תקציב נמוך", "התקרבות למסגרת"], ["budget_exceeded", "חריגה מתקציב", "צוות חרג מהמסגרת"], ["low_stock", "מלאי נמוך", "מוצר ירד מתחת לסף"], ["out_of_stock", "מוצר אזל", "המלאי הגיע לאפס"], ["replacement_request", "בקשת החלפה", "בקשה חדשה מצוות"], ["system_alert", "התראת מערכת", "אירוע תפעולי חשוב"]];
function Page() {
  const qc = useQueryClient();
  const prefsFn = useServerFn(getMyNotificationPrefs);
  const setPrefFn = useServerFn(setMyNotificationPref);
  const subFn = useServerFn(subscribeAdminPush);
  const unsubFn = useServerFn(unsubscribeAdminPush);
  const testFn = useServerFn(sendTestAdminPush);
  const vapidFn = useServerFn(getVapidPublicKey);
  const {
    data: prefs
  } = useQuery({
    queryKey: ["admin-notification-prefs"],
    queryFn: () => prefsFn()
  });
  const [supported, setSupported] = reactExports.useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = reactExports.useState(false);
  const [pushOn, setPushOn] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const value = isPushSupported();
    setSupported(value);
    setIosNeedsInstall(isIOSDevice() && !isStandaloneInstalled() && !value);
    if (value) void getExistingSubscription().then((subscription) => setPushOn(!!subscription));
  }, []);
  async function enablePush() {
    if (!supported) {
      toast.error(iosNeedsInstall ? "ב-iPhone יש להוסיף את האתר למסך הבית ולפתוח משם" : "הדפדפן אינו תומך בהתראות");
      return;
    }
    setBusy(true);
    try {
      if (await Notification.requestPermission() !== "granted") throw new Error("הרשאת ההתראות נדחתה");
      const {
        key,
        error
      } = await vapidFn();
      if (!key) throw new Error(error || "VAPID אינו מוגדר");
      const appServerKey = vapidKeyToUint8Array(key);
      const registration = await registerSW();
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer.slice(appServerKey.byteOffset, appServerKey.byteOffset + appServerKey.byteLength)
      });
      const json = subscription.toJSON();
      await subFn({
        data: {
          endpoint: subscription.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth
        }
      });
      setPushOn(true);
      toast.success("התראות Push הופעלו במכשיר הזה");
    } catch (error) {
      toast.error(error.message || "הפעלת ההתראות נכשלה");
    } finally {
      setBusy(false);
    }
  }
  async function disablePush() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await unsubFn({
          data: {
            endpoint: subscription.endpoint
          }
        });
        await subscription.unsubscribe();
      }
      setPushOn(false);
      toast.success("התראות Push כובו במכשיר הזה");
    } finally {
      setBusy(false);
    }
  }
  async function toggle(key, channel, enabled) {
    try {
      await setPrefFn({
        data: {
          event_type: key,
          channel,
          enabled
        }
      });
      qc.setQueryData(["admin-notification-prefs"], (previous) => ({
        ...previous ?? {},
        [key]: {
          ...previous?.[key] ?? {},
          [channel]: enabled
        }
      }));
      toast.success("ההעדפה נשמרה");
    } catch (error) {
      toast.error(error.message);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 admin-stagger", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "ההתראות שלי" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "הבחירות נשמרות רק עבור החשבון שלך." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-5 admin-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold", children: "Push במכשיר הזה" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: pushOn ? "פעיל" : "כבוי" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        pushOn && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: async () => {
          try {
            const result = await testFn();
            toast.success(`נשלח ל-${result.sent} מכשירים`);
          } catch (error) {
            toast.error(error.message);
          }
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
          " בדיקה"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: pushOn ? "outline" : "default", disabled: busy, onClick: pushOn ? disablePush : enablePush, children: [
          busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : pushOn ? /* @__PURE__ */ jsxRuntimeExports.jsx(BellOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
          pushOn ? "כיבוי" : "הפעלה"
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "overflow-hidden admin-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_54px_54px_54px] gap-2 border-b bg-muted/35 px-4 py-3 text-center text-[11px] text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-start", children: "סוג התראה" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "באפליקציה" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Push" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "אימייל" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y", children: EVENTS.map(([key, label, help]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[minmax(0,1fr)_54px_54px_54px] items-center gap-2 px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs text-muted-foreground", children: help })
        ] }),
        ["in_app_enabled", "push_enabled", "email_enabled"].map((channel) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: prefs?.[key]?.[channel] ?? channel !== "email_enabled", onCheckedChange: (value) => toggle(key, channel, value) }) }, channel))
      ] }, key)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "אימייל נשמר כהעדפה ומוכן לחיבור לספק דואר. התראות לקוחות אינן מושפעות מהגדרות אלו." })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Page, {}) });
export {
  SplitComponent as component
};
