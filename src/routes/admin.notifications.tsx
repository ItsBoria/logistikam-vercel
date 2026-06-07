import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import {
  getMyNotificationPrefs, setMyNotificationPref,
  subscribeAdminPush, unsubscribeAdminPush, sendTestAdminPush,
  getLowStockList,
} from "@/lib/admin-notifications.functions";
import { getVapidPublicKey } from "@/lib/push.functions";
import {
  getExistingSubscription, isIOSDevice, isPushSupported, isStandaloneInstalled,
  registerSW, vapidKeyToUint8Array,
} from "@/lib/push-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, Loader2, Send, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({
  ssr: false,
  head: () => ({ meta: [{ title: "התראות - פאנל" }] }),
  component: () => <AdminShell><Page /></AdminShell>,
});

const EVENTS: { key: "order_created" | "order_awaiting_approval" | "low_stock" | "replacement_request"; label: string; help: string }[] = [
  { key: "order_created", label: "הזמנה חדשה", help: "כאשר צוות מגיש הזמנה חדשה" },
  { key: "order_awaiting_approval", label: "הזמנה ממתינה לאישור", help: "כאשר הזמנה חורגת מהמסגרת" },
  { key: "low_stock", label: "מלאי נמוך", help: "כאשר מוצר יורד מהסף שהוגדר" },
  { key: "replacement_request", label: "בקשת החלפה חדשה", help: "כאשר צוות שולח בקשת החלפה" },
];

function Page() {
  const qc = useQueryClient();
  const prefsFn = useServerFn(getMyNotificationPrefs);
  const setPrefFn = useServerFn(setMyNotificationPref);
  const subFn = useServerFn(subscribeAdminPush);
  const unsubFn = useServerFn(unsubscribeAdminPush);
  const testFn = useServerFn(sendTestAdminPush);
  const vapidFn = useServerFn(getVapidPublicKey);
  const lowFn = useServerFn(getLowStockList);

  const { data: prefs } = useQuery({ queryKey: ["admin-notification-prefs"], queryFn: () => prefsFn() });
  const { data: lowStock } = useQuery({ queryKey: ["admin-low-stock"], queryFn: () => lowFn(), staleTime: 30_000 });

  const [supported, setSupported] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sup = isPushSupported();
    setSupported(sup);
    setIosNeedsInstall(isIOSDevice() && !isStandaloneInstalled() && !sup);
    if (sup) getExistingSubscription().then((s) => setOn(!!s));
  }, []);

  async function enable() {
    if (!supported) {
      toast.error(iosNeedsInstall
        ? "ב‑iPhone יש להוסיף את האתר למסך הבית ולפתוח משם"
        : "הדפדפן לא תומך בהתראות");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { toast.error("ההרשאה נדחתה"); return; }
      const res = await vapidFn();
      if (!res.key) { toast.error(res.error || "VAPID לא מוגדר"); return; }
      const appServerKey = vapidKeyToUint8Array(res.key);
      const reg = await registerSW();
      let sub = await reg.pushManager.getSubscription();
      if (sub) { try { await sub.unsubscribe(); } catch (_) {} sub = null; }
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer.slice(
          appServerKey.byteOffset,
          appServerKey.byteOffset + appServerKey.byteLength,
        ) as ArrayBuffer,
      });
      const json: any = sub.toJSON();
      await subFn({ data: { endpoint: sub.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth } });
      setOn(true);
      toast.success("התראות הופעלו 🎉");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "שגיאה");
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubFn({ data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setOn(false);
      toast.success("התראות כובו");
    } catch (e: any) { toast.error(e?.message || "שגיאה"); }
    finally { setBusy(false); }
  }

  async function sendTest() {
    try { const r = await testFn(); toast.success(`נשלחה ל-${r.sent} מכשירים`); }
    catch (e: any) { toast.error(e.message); }
  }

  async function togglePref(key: typeof EVENTS[number]["key"], enabled: boolean) {
    try {
      await setPrefFn({ data: { event_type: key, enabled } });
      qc.setQueryData(["admin-notification-prefs"], (prev: any) => ({ ...(prev ?? {}), [key]: enabled }));
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">התראות</h1>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold">התראות בדפדפן (מכשיר זה)</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {!supported && iosNeedsInstall
                ? "ב‑iPhone יש להוסיף את האתר למסך הבית ולפתוח משם"
                : !supported
                  ? "הדפדפן לא תומך בהתראות"
                  : on ? "התראות פעילות במכשיר זה" : "התראות אינן פעילות במכשיר זה"}
            </p>
          </div>
          <div className="flex gap-2">
            {on && supported && (
              <Button variant="outline" size="sm" onClick={sendTest}>
                <Send className="w-4 h-4 ml-2" /> שלח בדיקה
              </Button>
            )}
            {busy ? (
              <Button variant="outline" size="sm" disabled>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" /> רגע...
              </Button>
            ) : on ? (
              <Button variant="outline" size="sm" onClick={disable}>
                <BellOff className="w-4 h-4 ml-2" /> כבה
              </Button>
            ) : (
              <Button size="sm" onClick={enable} disabled={!supported && !iosNeedsInstall}>
                <Bell className="w-4 h-4 ml-2" /> הפעל
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold mb-2">סוגי התראות</h2>
        <p className="text-xs text-muted-foreground mb-4">בחר/י איזה אירועים יישלחו אליך כהתראה.</p>
        <div className="divide-y">
          {EVENTS.map((evt) => (
            <div key={evt.key} className="flex items-center justify-between py-3 gap-3">
              <div className="flex-1">
                <div className="font-medium text-sm">{evt.label}</div>
                <div className="text-xs text-muted-foreground">{evt.help}</div>
              </div>
              <Switch
                checked={prefs?.[evt.key] ?? true}
                onCheckedChange={(v) => togglePref(evt.key, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold flex items-center gap-2"><Package className="w-4 h-4" /> מלאי נמוך כעת</h2>
          <span className="text-xs text-muted-foreground">סף ברירת מחדל: {lowStock?.defaultThreshold ?? 5}</span>
        </div>
        {!lowStock ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : lowStock.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">כל המוצרים במלאי תקין 🎉</p>
        ) : (
          <div className="divide-y">
            {lowStock.items.map((p: any) => (
              <div key={p.id} className="py-2 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {p.stock === 0 && <AlertTriangle className="w-4 h-4 text-destructive" />}
                    {p.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.category || "—"} · סף {p.effective_threshold}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${p.stock === 0 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning-foreground"}`}>
                  {p.stock === 0 ? "אזל" : `${p.stock} ביחידות`}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
