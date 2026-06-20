import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DASHBOARD_WIDGETS = ["kpis", "attention", "budgets", "stock", "recent_orders"] as const;
export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];

const DEFAULTS = {
  default_section: "/admin",
  visible_widgets: [...DASHBOARD_WIDGETS],
  widget_order: [...DASHBOARD_WIDGETS],
  pinned_actions: [] as string[],
  saved_filters: {} as Record<string, unknown>,
  compact_mode: false,
  reduced_animations: false,
  appearance: "system" as "system" | "light" | "dark",
};

async function assertAdminOrStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "staff"]);
  if (!data?.length) throw new Error("גישה מורשית בלבד");
}

const preferencesSchema = z.object({
  default_section: z.enum(["/admin", "/admin/orders", "/admin/stock", "/admin/products", "/admin/notifications"]),
  visible_widgets: z.array(z.enum(DASHBOARD_WIDGETS)).max(DASHBOARD_WIDGETS.length),
  widget_order: z.array(z.enum(DASHBOARD_WIDGETS)).length(DASHBOARD_WIDGETS.length),
  pinned_actions: z.array(z.string().max(80)).max(8),
  saved_filters: z.record(z.unknown()),
  compact_mode: z.boolean(),
  reduced_animations: z.boolean(),
  appearance: z.enum(["system", "light", "dark"]),
});

export const getMyAdminPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_preferences").select("*").eq("user_id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return DEFAULTS;
    const order = Array.isArray(data.widget_order) ? data.widget_order : DEFAULTS.widget_order;
    const completeOrder = [
      ...order.filter((v: unknown): v is DashboardWidget => DASHBOARD_WIDGETS.includes(v as DashboardWidget)),
      ...DASHBOARD_WIDGETS.filter((v) => !order.includes(v)),
    ];
    return {
      ...DEFAULTS,
      ...data,
      visible_widgets: Array.isArray(data.visible_widgets) ? data.visible_widgets : DEFAULTS.visible_widgets,
      widget_order: completeOrder,
      pinned_actions: Array.isArray(data.pinned_actions) ? data.pinned_actions : [],
      saved_filters: data.saved_filters && typeof data.saved_filters === "object" ? data.saved_filters : {},
    };
  });

export const saveMyAdminPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => preferencesSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_preferences").upsert({
      user_id: context.userId,
      ...data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
