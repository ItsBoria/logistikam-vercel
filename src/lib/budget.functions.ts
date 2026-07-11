import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertFunctionMinRole as assertMinRole } from "./authz.functions";
import { resolveActiveAdminUnitId } from "./membership.functions";

export const getBudgetManagement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMinRole(context.userId, "WORK_MANAGER");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await resolveActiveAdminUnitId(supabaseAdmin, context.userId);
    const [{ data: teams }, { data: periods }, { data: policies }] = await Promise.all([
      supabaseAdmin.from("teams").select("id, name, monthly_limit, active").eq("unit_id", unitId).order("name"),
      (supabaseAdmin as any).from("budget_periods").select("*").eq("unit_id", unitId).order("starts_at", { ascending: false }).limit(300),
      (supabaseAdmin as any).from("budget_policies").select("*").eq("is_active", true),
    ]);
    return { teams: teams ?? [], periods: periods ?? [], policies: policies ?? [] };
  });

export const resetTeamBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    team_id: z.string().uuid(),
    new_budget: z.number().min(0).max(100_000_000),
    reason: z.string().trim().min(3).max(500),
    apply_carry_over: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertMinRole(context.userId, "WORK_MANAGER");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await resolveActiveAdminUnitId(supabaseAdmin, context.userId);
    const { data: team } = await supabaseAdmin.from("teams").select("id").eq("id", data.team_id).eq("unit_id", unitId).maybeSingle();
    if (!team) throw new Error("אין הרשאה לעדכן תקציב של צוות ביחידה אחרת");
    const { data: periodId, error } = await (context.supabase as any).rpc("reset_team_budget", {
      _team_id: data.team_id,
      _new_budget: data.new_budget,
      _reason: data.reason,
      _apply_carry_over: data.apply_carry_over,
    });
    if (error) throw new Error(error.message);
    return { period_id: periodId as string };
  });
