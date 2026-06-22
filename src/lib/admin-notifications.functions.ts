import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRIMARY_ADMIN_EMAIL = "davidpanasik@hotmail.com";
import { z } from "zod";

const EVENT_TYPES = [
  "order_created",
  "order_awaiting_approval",
  "low_stock",
  "replacement_request",
] as const;
const eventTypeSchema = z.enum(EVENT_TYPES);

async function assertAdminOrStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "staff"]);
  if (!data || data.length === 0) throw new Error("גישה מורשית בלבד");
}

export const getMyNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("admin_notification_prefs")
      .select("event_type, enabled")
      .eq("user_id", context.userId);
    const map: Record<string, boolean> = {};
    for (const evt of EVENT_TYPES) map[evt] = true; // default ON
    for (const row of data ?? []) map[(row as any).event_type] = (row as any).enabled;
    return map as Record<(typeof EVENT_TYPES)[number], boolean>;
  });

export const setMyNotificationPref = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        event_type: eventTypeSchema,
        enabled: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_notification_prefs")
      .upsert(
        {
          user_id: context.userId,
          event_type: data.event_type,
          enabled: data.enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,event_type" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const subscribeAdminPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        endpoint: z.string().url().max(2000),
        p256dh: z.string().min(1).max(500),
        auth: z.string().min(1).max(500),
      })
      .parse(input),
  )
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
    await supabaseAdmin
      .from("admin_push_subscriptions")
      .delete()
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
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
    const body = JSON.stringify({
      title: "התראת בדיקה",
      body: "התראות מנהל פעילות 🎉",
      url: "/admin",
    });
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
      .from("app_settings")
      .select("value")
      .eq("key", "default_low_stock_threshold")
      .maybeSingle();
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
    let { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    // Recovery for the designated primary administrator. OAuth/provider
    // migrations can create a new auth user ID for the same verified email,
    // leaving the old role row attached to the previous ID.
    if (!(data ?? []).some((row: any) => row.role === "admin")) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
      const signedInEmail = authUser.user?.email?.trim().toLowerCase();
      if (signedInEmail === PRIMARY_ADMIN_EMAIL) {
        const { error } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
        if (error) throw new Error(error.message);
        data = [{ role: "admin" }];
      }
    }

    const roles = (data ?? []).map((r: any) => r.role as "admin" | "staff");
    return {
      roles,
      isAdmin: roles.includes("admin"),
      isStaff: roles.includes("staff"),
      hasAccess: roles.length > 0,
    };
  });
