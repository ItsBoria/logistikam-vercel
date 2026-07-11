import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { assertFunctionMinRole as assertMinRole } from "./authz.functions";
import { resolveActiveAdminUnitId } from "./membership.functions";

async function assertAdmin(userId: string) {
  return assertMinRole(userId, "ADMIN");
}

async function assertAdminOrStaff(userId: string) {
  return assertMinRole(userId, "ADMIN");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await resolveActiveAdminUnitId(supabaseAdmin, context.userId);
    const { data: activeUnit } = await supabaseAdmin
      .from("units")
      .select("id, name, code")
      .eq("id", unitId)
      .maybeSingle();

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthIso = monthStart.toISOString();

    // Default low-stock threshold from settings
    const { data: settingRow } = await supabaseAdmin
      .from("app_settings").select("value").eq("key", "default_low_stock_threshold").maybeSingle();
    const defaultThreshold = Number((settingRow?.value as any) ?? 5);

    const stuckAwaitingIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const stuckReadyIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const [
      { count: pendingCount },
      { count: awaitingCount },
      { count: pendingReplacementsCount },
      { count: stuckAwaitingCount },
      { count: stuckReadyCount },
      monthOrdersRes,
      teamsRes,
      recentOrdersRes,
      activeProductsRes,
      stuckOrdersRes,
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("unit_id", unitId).eq("status", "pending"),
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("unit_id", unitId).eq("status", "awaiting_approval"),
      supabaseAdmin.from("replacement_requests").select("*", { count: "exact", head: true }).eq("unit_id", unitId).in("status", ["preparing","ready"]),
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("unit_id", unitId).eq("status", "awaiting_approval").lt("created_at", stuckAwaitingIso),
      supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("unit_id", unitId).eq("status", "ready").lt("created_at", stuckReadyIso),
      supabaseAdmin.from("orders").select("id, total, team_id, status, created_at").eq("unit_id", unitId).gte("created_at", monthIso),
      supabaseAdmin.from("teams").select("id, name, monthly_limit, active").eq("unit_id", unitId).eq("active", true).order("name"),
      supabaseAdmin.from("orders").select("id, status, total, created_at, ordered_by_name, teams(name)").eq("unit_id", unitId).order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("products").select("id, name, stock, low_stock_threshold").eq("unit_id", unitId).eq("active", true),
      supabaseAdmin.from("orders")
        .select("id, status, total, created_at, ordered_by_name, teams(name)")
        .eq("unit_id", unitId)
        .or(`and(status.eq.awaiting_approval,created_at.lt.${stuckAwaitingIso}),and(status.eq.ready,created_at.lt.${stuckReadyIso})`)
        .order("created_at", { ascending: true }).limit(10),
    ]);

    const monthOrders = monthOrdersRes.data ?? [];
    const teams = teamsRes.data ?? [];

    const monthOrdersCount = monthOrders.filter((o: any) => o.status !== "cancelled").length;
    const monthRevenue = monthOrders
      .filter((o: any) => o.status !== "cancelled" && o.status !== "awaiting_approval")
      .reduce((s: number, o: any) => s + Number(o.total), 0);

    // Low-stock list using per-product or default threshold
    const lowStock = (activeProductsRes.data ?? [])
      .map((p: any) => ({ ...p, effective_threshold: p.low_stock_threshold ?? defaultThreshold }))
      .filter((p: any) => p.stock <= p.effective_threshold)
      .sort((a: any, b: any) => a.stock - b.stock)
      .slice(0, 10);
    const lowStockCount = (activeProductsRes.data ?? [])
      .filter((p: any) => p.stock <= (p.low_stock_threshold ?? defaultThreshold)).length;

    // Per-team spend
    const spendByTeam = new Map<string, number>();
    for (const o of monthOrders) {
      if (o.status === "cancelled") continue;
      spendByTeam.set(o.team_id, (spendByTeam.get(o.team_id) ?? 0) + Number(o.total));
    }
    const teamStats = teams.map((t: any) => {
      const spent = spendByTeam.get(t.id) ?? 0;
      const limit = Number(t.monthly_limit);
      const pct = limit > 0 ? Math.min(999, Math.round((spent / limit) * 100)) : 0;
      return { id: t.id, name: t.name, monthly_limit: limit, spent, pct };
    }).sort((a, b) => b.spent - a.spent);
    const overBudgetCount = teamStats.filter(t => t.monthly_limit > 0 && t.pct >= 100).length;

    return {
      unit: {
        id: unitId,
        name: activeUnit?.name ?? "",
        code: activeUnit?.code ?? null,
      },
      kpis: {
        pending: pendingCount ?? 0,
        awaiting: awaitingCount ?? 0,
        pendingReplacements: pendingReplacementsCount ?? 0,
        monthOrders: monthOrdersCount,
        monthRevenue,
        activeTeams: teams.length,
        lowStock: lowStockCount,
        stuck: (stuckAwaitingCount ?? 0) + (stuckReadyCount ?? 0),
        overBudget: overBudgetCount,
      },
      defaultLowStockThreshold: defaultThreshold,
      topTeams: teamStats.slice(0, 5),
      teamStats,
      recentOrders: recentOrdersRes.data ?? [],
      stuckOrders: stuckOrdersRes.data ?? [],
      lowStock,
    };
  });

export const setTeamMonthlyLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      team_id: z.string().uuid(),
      monthly_limit: z.number().min(0).max(10_000_000),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const role = await assertAdmin(context.userId);
    if (role !== "OWNER" && role !== "WORK_MANAGER") {
      throw new Error("רק בעלים או מנהל עבודה רשאים לשנות תקציב");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await resolveActiveAdminUnitId(supabaseAdmin, context.userId);
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id, unit_id")
      .eq("id", data.team_id)
      .maybeSingle();
    if (!team || team.unit_id !== unitId) throw new Error("אין הרשאה לעדכן תקציב צוות ביחידה אחרת");

    const { error } = await (context.supabase as any).rpc("reset_team_budget", {
      _team_id: data.team_id,
      _new_budget: data.monthly_limit,
      _reason: "Budget updated from dashboard",
      _apply_carry_over: false,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
