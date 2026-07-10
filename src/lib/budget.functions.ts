import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertMinRole } from "./authz.server";

export const getBudgetManagement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMinRole(context.userId, "WORK_MANAGER");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: teams }, { data: periods }, { data: policies }] = await Promise.all([
      supabaseAdmin.from("teams").select("id, name, monthly_limit, active").order("name"),
      (supabaseAdmin as any).from("budget_periods").select("*").order("starts_at", { ascending: false }).limit(300),
      (supabaseAdmin as any).from("budget_policies").select("*").eq("is_active", true),
    ]);
    const activeByTeam = new Map((periods ?? []).filter((period: any) => period.status === "active").map((period: any) => [period.team_id, period]));
    const summaries = await Promise.all((teams ?? []).map(async (team: any) => {
      const period: any = activeByTeam.get(team.id);
      const monthlyBudget = period
        ? Number(period.starting_budget ?? 0) + Number(period.carry_over_amount ?? 0)
        : Number(team.monthly_limit ?? 0);
      const { data: used } = await supabaseAdmin.rpc("team_month_spent", { _team_id: team.id });
      const usedAmount = Number(used ?? 0);
      const remaining = monthlyBudget - usedAmount;
      return {
        team_id: team.id,
        monthly_budget: monthlyBudget,
        used_amount: usedAmount,
        remaining_amount: remaining,
        utilization_percentage: monthlyBudget > 0 ? Math.round((usedAmount / monthlyBudget) * 100) : 0,
        is_over_budget: monthlyBudget > 0 && usedAmount > monthlyBudget,
      };
    }));
    return { teams: teams ?? [], periods: periods ?? [], policies: policies ?? [], summaries };
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
    const { data: periodId, error } = await (context.supabase as any).rpc("reset_team_budget", {
      _team_id: data.team_id,
      _new_budget: data.new_budget,
      _reason: data.reason,
      _apply_carry_over: data.apply_carry_over,
    });
    if (error) throw new Error(error.message);
    return { period_id: periodId as string };
  });
