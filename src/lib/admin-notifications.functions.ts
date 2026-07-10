import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const ADMIN_EVENT_TYPES = [
  "order_created", "order_awaiting_approval", "order_approved", "order_rejected",
  "order_ready", "order_cancelled", "budget_low", "budget_exceeded",
  "budget_reset_completed", "budget_reset_failed",
  "calendar_awaiting_signature", "calendar_approved", "calendar_rejected",
  "low_stock", "out_of_stock", "replacement_request", "system_alert",
] as const;
const EVENT_TYPES = ADMIN_EVENT_TYPES;
const eventTypeSchema = z.enum(EVENT_TYPES);
const channelSchema = z.enum(["in_app_enabled", "push_enabled", "email_enabled"]);

type LocalRoleCode = "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER";

async function getLocalUserRole(userId: string): Promise<LocalRoleCode> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  const level: Record<LocalRoleCode, number> = { OWNER: 100, WORK_MANAGER: 50, ADMIN: 50, USER: 10 };
  let highest: LocalRoleCode = "USER";
  for (const row of data ?? []) {
    const raw = String((row as any).role || "").toUpperCase();
    const role: LocalRoleCode =
      raw === "OWNER" ? "OWNER" :
      raw === "WORK_MANAGER" ? "WORK_MANAGER" :
      raw === "ADMIN" || raw === "STAFF" ? "ADMIN" :
      "USER";
    if (level[role] > level[highest]) highest = role;
  }
  return highest;
}

async function assertAdminOrStaff(userId: string) {
  const role = await getLocalUserRole(userId);
  const level: Record<LocalRoleCode, number> = { OWNER: 100, WORK_MANAGER: 50, ADMIN: 50, USER: 10 };
  if (level[role] < level.ADMIN) throw new Error("אין הרשאה לפעולה זו");
  return role;
}

export const getMyNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("admin_notification_prefs")
      .select("event_type, enabled, in_app_enabled, push_enabled, email_enabled")
      .eq("user_id", context.userId);
    const map: Record<string, { in_app_enabled: boolean; push_enabled: boolean; email_enabled: boolean }> = {};
    for (const evt of EVENT_TYPES) {
      map[evt] = { in_app_enabled: true, push_enabled: true, email_enabled: false };
    }
    for (const row of data ?? []) {
      map[(row as any).event_type] = {
        in_app_enabled: (row as any).in_app_enabled ?? true,
        push_enabled: (row as any).push_enabled ?? (row as any).enabled ?? true,
        email_enabled: (row as any).email_enabled ?? false,
      };
    }
    return map;
  });

export const setMyNotificationPref = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    event_type: eventTypeSchema,
    channel: channelSchema,
    enabled: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      user_id: context.userId,
      event_type: data.event_type,
      [data.channel]: data.enabled,
      ...(data.channel === "push_enabled" ? { enabled: data.enabled } : {}),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin
      .from("admin_notification_prefs")
      .upsert(payload, { onConflict: "user_id,event_type" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const subscribeAdminPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    endpoint: z.string().url().max(2000),
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .upsert(
        { user_id: context.userId, endpoint: data.endpoint, p256dh: data.p256dh, auth: data.auth },
        { onConflict: "endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unsubscribeAdminPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ endpoint: z.string().url() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_push_subscriptions").delete()
      .eq("endpoint", data.endpoint).eq("user_id", context.userId);
    return { ok: true };
  });

export const sendTestAdminPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .select("*")
      .eq("user_id", context.userId);
    if (!subs?.length) throw new Error("לא קיימים מכשירים רשומים");
    const webpush = (await import("web-push")).default;
    const pub = (process.env.VAPID_PUBLIC_KEY || "").trim();
    const priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
    let subject = (process.env.VAPID_SUBJECT || "").trim();
    if (!pub || !priv) throw new Error("VAPID לא מוגדר בשרת");
    if (!/^mailto:|^https:\/\//.test(subject)) subject = "mailto:admin@logistikam.lovable.app";
    webpush.setVapidDetails(subject, pub, priv);
    const body = JSON.stringify({ title: "התראת בדיקה", body: "התראות מנהל פעילות 🎉", url: "/admin" });
    let sent = 0;
    for (const s of subs as any[]) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err: any) {
        console.error("[admin push test] failed:", err?.statusCode, err?.message);
      }
    }
    if (sent === 0) throw new Error("שליחת ההתראה נכשלה");
    return { sent };
  });

export const getLowStockList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: settingRow } = await supabaseAdmin
      .from("app_settings").select("value").eq("key", "default_low_stock_threshold").maybeSingle();
    const defaultThreshold = Number((settingRow?.value as any) ?? 5);
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id, name, stock, low_stock_threshold, category")
      .eq("active", true);
    const list = (products ?? [])
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        category: p.category,
        effective_threshold: p.low_stock_threshold ?? defaultThreshold,
      }))
      .filter((p: any) => p.stock <= p.effective_threshold)
      .sort((a: any, b: any) => a.stock - b.stock);
    return { defaultThreshold, items: list };
  });

export const getMyAdminRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("is_active").eq("id", context.userId).maybeSingle();
    if (profile?.is_active === false) {
      return {
        roles: [], role: "USER" as const, isOwner: false, isWorkManager: false,
        isAdmin: false, isStaff: false, canManageRoles: false,
        canResetBudgets: false, canSignCalendar: false, hasAccess: false,
      };
    }
    const role = await getLocalUserRole(context.userId);
    return {
      roles: role === "USER" ? [] : [role],
      role,
      isOwner: role === "OWNER",
      isWorkManager: role === "WORK_MANAGER",
      isAdmin: role !== "USER",
      isStaff: false,
      canManageRoles: role === "OWNER",
      canResetBudgets: role === "OWNER" || role === "WORK_MANAGER",
      canSignCalendar: role === "OWNER" || role === "WORK_MANAGER",
      hasAccess: role !== "USER",
    };
  });
