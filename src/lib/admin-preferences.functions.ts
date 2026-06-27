import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertMinRole } from "./authz.server";

export const DASHBOARD_WIDGETS = ["kpis", "attention", "budgets", "stock", "recent_orders"] as const;
export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];

export type AdminPreferences = {
  default_section: "/admin" | "/admin/orders" | "/admin/stock" | "/admin/products" | "/admin/notifications";
  visible_widgets: DashboardWidget[];
  widget_order: DashboardWidget[];
  pinned_actions: string[];
  saved_filters: Record<string, string>;
  compact_mode: boolean;
  reduced_animations: boolean;
  appearance: "system" | "light" | "dark";
};

const DEFAULTS: AdminPreferences = {
  default_section: "/admin",
  visible_widgets: [...DASHBOARD_WIDGETS],
  widget_order: [...DASHBOARD_WIDGETS],
  pinned_actions: [] as string[],
  saved_filters: {} as Record<string, string>,
  compact_mode: false,
  reduced_animations: false,
  appearance: "system" as "system" | "light" | "dark",
};

async function assertAdminOrStaff(userId: string) {
  return assertMinRole(userId, "ADMIN");
}

const preferencesSchema = z.object({
  default_section: z.enum(["/admin", "/admin/orders", "/admin/stock", "/admin/products", "/admin/notifications"]),
  visible_widgets: z.array(z.enum(DASHBOARD_WIDGETS)).max(DASHBOARD_WIDGETS.length),
  widget_order: z.array(z.enum(DASHBOARD_WIDGETS)).length(DASHBOARD_WIDGETS.length),
  pinned_actions: z.array(z.string().max(80)).max(8),
  saved_filters: z.record(z.string()),
  compact_mode: z.boolean(),
  reduced_animations: z.boolean(),
  appearance: z.enum(["system", "light", "dark"]),
});

export const getMyAdminPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPreferences> => {
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
    const visibleWidgets = Array.isArray(data.visible_widgets)
      ? data.visible_widgets.filter((v: unknown): v is DashboardWidget => DASHBOARD_WIDGETS.includes(v as DashboardWidget))
      : DEFAULTS.visible_widgets;
    const pinnedActions = Array.isArray(data.pinned_actions)
      ? data.pinned_actions.filter((v: unknown): v is string => typeof v === "string")
      : [];
    const savedFilters = data.saved_filters && typeof data.saved_filters === "object" && !Array.isArray(data.saved_filters)
      ? Object.fromEntries(Object.entries(data.saved_filters).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
    const validSections = ["/admin", "/admin/orders", "/admin/stock", "/admin/products", "/admin/notifications"] as const;
    return {
      ...DEFAULTS,
      default_section: validSections.includes(data.default_section as (typeof validSections)[number])
        ? data.default_section as AdminPreferences["default_section"]
        : DEFAULTS.default_section,
      compact_mode: data.compact_mode,
      reduced_animations: data.reduced_animations,
      appearance: ["system", "light", "dark"].includes(data.appearance)
        ? data.appearance as AdminPreferences["appearance"]
        : DEFAULTS.appearance,
      visible_widgets: visibleWidgets,
      widget_order: completeOrder,
      pinned_actions: pinnedActions,
      saved_filters: savedFilters,
    };
  });

export const saveMyAdminPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => preferencesSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("admin_preferences").upsert({
      user_id: context.userId,
      ...data,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
