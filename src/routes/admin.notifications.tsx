import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, BellOff, Loader2, Send } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getMyNotificationPrefs, setMyNotificationPref, subscribeAdminPush,
  unsubscribeAdminPush, sendTestAdminPush,
} from "@/lib/admin-notifications.functions";
import { getVapidPublicKey } from "@/lib/push.functions";
import {
  getExistingSubscription, isIOSDevice, isPushSupported, isStandaloneInstalled,
  registerSW, vapidKeyToUint8Array,
} from "@/lib/push-client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/notifications")({
  ssr: false,
  head: () => ({ meta: [{ title: "ההתראות שלי" }] }),
  component: () => <AdminShell><Page /></AdminShell>,
});

const EVENTS = [
  ["order_created", "הזמנה חדשה", "כאשר צוות שולח הזמנה"],
  ["order_awaiting_approval", "ממתינה לאישור", "הזמנה שדורשת אישור"],
  ["order_approved", "הזמנה אושרה", "אישור הזמנה"],
  ["order_rejected", "הזמנה נדחתה", "דחיית הזמנה"],
  ["order_ready", "מוכנה לאיסוף", "הזמנה מוכנה"],
  ["order_cancelled", "הזמנה בוטלה", "ביטול הזמנה"],
  ["budget_low", "תקציב נמוך", "התקרבות למסגרת"],
  ["budget_exceeded", "חריגה מתקציב", "צוות חרג מהמסגרת"],
  ["low_stock", "מלאי נמוך", "מוצר ירד מתחת לסף"],
  ["out_of_stock", "מוצר אזל", "המלאי הגיע לאפס"],
  ["replacement_request", "בקשת החלפה", "בקשה חדשה מצוות"],
  ["budget_reset_completed", "איפוס תקציב הושלם", "נפתחה תקופת תקציב חדשה"],
  ["budget_reset_failed", "איפוס תקציב נכשל", "נדרשת בדיקה של איפוס התקציב"],
  ["calendar_awaiting_signature", "לוח ממתין לחתימה", "לוח עבודה ממתין לאישור"],
  ["calendar_approved", "לוח אושר", "לוח עבודה נחתם ואושר"],
  ["calendar_rejected", "לוח נדחה", "לוח עבודה הוחזר לתיקון"],
  ["system_alert", "התראת מערכת", "אירוע תפעולי חשוב"],
] as const;
type EventKey = (typeof EVENTS)[number][0];
type Channel = "in_app_enabled" | "push_enabled" | "email_enabled";

function Page() {
  const qc = useQueryClient();
  const prefsFn = useServerFn(getMyNotificationPrefs);
  const setPrefFn = useServerFn(setMyNotificationPref);
  const subFn = useServerFn(subscribeAdminPush);
  const unsubFn = useServerFn(unsubscribeAdminPush);
  const testFn = useServerFn(sendTestAdminPush);
  const vapidFn = useServerFn(getVapidPublicKey);
  const { data: prefs } = useQuery({ queryKey: ["admin-notification-prefs"], queryFn: () => prefsFn() });
  const [supported, setSupported] = useState(false);
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
      const { key, error } = await vapidFn();
      if (!key) throw new Error(error || "VAPID אינו מוגדר");
      const appServerKey = vapidKeyToUint8Array(key);
      const registration = await registerSW();
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer.slice(appServerKey.byteOffset, appServerKey.byteOffset + appServerKey.byteLength) as ArrayBuffer,
      });
      const json: any = subscription.toJSON();
      await subFn({ data: { endpoint: subscription.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth } });
      setPushOn(true);
      toast.success("התראות Push הופעלו במכשיר הזה");
    } catch (error: any) { toast.error(error.message || "הפעלת ההתראות נכשלה"); }
    finally { setBusy(false); }
  }

  async function disablePush() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await unsubFn({ data: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
      setPushOn(false);
      toast.success("התראות Push כובו במכשיר הזה");
    } finally { setBusy(false); }
  }

  async function toggle(key: EventKey, channel: Channel, enabled: boolean) {
    try {
      await setPrefFn({ data: { event_type: key, channel, enabled } });
      qc.setQueryData(["admin-notification-prefs"], (previous: any) => ({
        ...(previous ?? {}), [key]: { ...(previous?.[key] ?? {}), [channel]: enabled },
      }));
      toast.success("ההעדפה נשמרה");
    } catch (error: any) { toast.error(error.message); }
  }

  return (
    <div className="space-y-5 admin-stagger">
      <div><h1 className="text-2xl font-bold">ההתראות שלי</h1><p className="mt-1 text-sm text-muted-foreground">הבחירות נשמרות רק עבור החשבון שלך.</p></div>
      <Card className="p-5 admin-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-bold">Push במכשיר הזה</h2><p className="text-xs text-muted-foreground">{pushOn ? "פעיל" : "כבוי"}</p></div>
          <div className="flex gap-2">
            {pushOn && <Button variant="outline" size="sm" onClick={async () => { try { const result = await testFn(); toast.success(`נשלח ל-${result.sent} מכשירים`); } catch (error: any) { toast.error(error.message); } }}><Send className="h-4 w-4" /> בדיקה</Button>}
            <Button size="sm" variant={pushOn ? "outline" : "default"} disabled={busy} onClick={pushOn ? disablePush : enablePush}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : pushOn ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {pushOn ? "כיבוי" : "הפעלה"}
            </Button>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden admin-card">
        <div className="grid grid-cols-[minmax(0,1fr)_54px_54px_54px] gap-2 border-b bg-muted/35 px-4 py-3 text-center text-[11px] text-muted-foreground">
          <span className="text-start">סוג התראה</span><span>באפליקציה</span><span>Push</span><span>אימייל</span>
        </div>
        <div className="divide-y">
          {EVENTS.map(([key, label, help]) => (
            <div key={key} className="grid grid-cols-[minmax(0,1fr)_54px_54px_54px] items-center gap-2 px-4 py-3">
              <div className="min-w-0"><div className="text-sm font-medium">{label}</div><div className="truncate text-xs text-muted-foreground">{help}</div></div>
              {(["in_app_enabled", "push_enabled", "email_enabled"] as const).map((channel) => (
                <div key={channel} className="flex justify-center">
                  <Switch checked={prefs?.[key]?.[channel] ?? channel !== "email_enabled"} onCheckedChange={(value) => toggle(key, channel, value)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">אימייל נשמר כהעדפה ומוכן לחיבור לספק דואר. התראות לקוחות אינן מושפעות מהגדרות אלו.</p>
    </div>
  );
}
