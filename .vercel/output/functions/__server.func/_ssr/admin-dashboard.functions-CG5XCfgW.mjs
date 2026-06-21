import { c as createServerRpc } from "./createServerRpc-Cb-gMCu4.mjs";
import { a as createServerFn } from "./server-CIKTFqrt.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DIPMndrz.mjs";
import "../_libs/react.mjs";
import { o as objectType, n as numberType, s as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "node:stream";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "node:stream/web";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
async function assertAdmin(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("גישה לאדמין בלבד");
}
async function assertAdminOrStaff(userId) {
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "staff"]);
  if (!data || data.length === 0) throw new Error("גישה מורשית בלבד");
}
const getAdminDashboard_createServerFn_handler = createServerRpc({
  id: "c27eeed4c0a36a708ba399551f71e2a912db4b9907f49682dfc4e1d08861ae53",
  name: "getAdminDashboard",
  filename: "src/lib/admin-dashboard.functions.ts"
}, (opts) => getAdminDashboard.__executeServer(opts));
const getAdminDashboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getAdminDashboard_createServerFn_handler, async ({
  context
}) => {
  await assertAdminOrStaff(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const monthStart = /* @__PURE__ */ new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthIso = monthStart.toISOString();
  const {
    data: settingRow
  } = await supabaseAdmin.from("app_settings").select("value").eq("key", "default_low_stock_threshold").maybeSingle();
  const defaultThreshold = Number(settingRow?.value ?? 5);
  const stuckAwaitingIso = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
  const stuckReadyIso = new Date(Date.now() - 48 * 60 * 60 * 1e3).toISOString();
  const [{
    count: pendingCount
  }, {
    count: awaitingCount
  }, {
    count: pendingReplacementsCount
  }, {
    count: stuckAwaitingCount
  }, {
    count: stuckReadyCount
  }, monthOrdersRes, teamsRes, recentOrdersRes, activeProductsRes, stuckOrdersRes] = await Promise.all([supabaseAdmin.from("orders").select("*", {
    count: "exact",
    head: true
  }).eq("status", "pending"), supabaseAdmin.from("orders").select("*", {
    count: "exact",
    head: true
  }).eq("status", "awaiting_approval"), supabaseAdmin.from("replacement_requests").select("*", {
    count: "exact",
    head: true
  }).in("status", ["preparing", "ready"]), supabaseAdmin.from("orders").select("*", {
    count: "exact",
    head: true
  }).eq("status", "awaiting_approval").lt("created_at", stuckAwaitingIso), supabaseAdmin.from("orders").select("*", {
    count: "exact",
    head: true
  }).eq("status", "ready").lt("created_at", stuckReadyIso), supabaseAdmin.from("orders").select("id, total, team_id, status, created_at").gte("created_at", monthIso), supabaseAdmin.from("teams").select("id, name, monthly_limit, active").eq("active", true).order("name"), supabaseAdmin.from("orders").select("id, status, total, created_at, ordered_by_name, teams(name)").order("created_at", {
    ascending: false
  }).limit(5), supabaseAdmin.from("products").select("id, name, stock, low_stock_threshold").eq("active", true), supabaseAdmin.from("orders").select("id, status, total, created_at, ordered_by_name, teams(name)").or(`and(status.eq.awaiting_approval,created_at.lt.${stuckAwaitingIso}),and(status.eq.ready,created_at.lt.${stuckReadyIso})`).order("created_at", {
    ascending: true
  }).limit(10)]);
  const monthOrders = monthOrdersRes.data ?? [];
  const teams = teamsRes.data ?? [];
  const monthOrdersCount = monthOrders.filter((o) => o.status !== "cancelled").length;
  const monthRevenue = monthOrders.filter((o) => o.status !== "cancelled" && o.status !== "awaiting_approval").reduce((s, o) => s + Number(o.total), 0);
  const lowStock = (activeProductsRes.data ?? []).map((p) => ({
    ...p,
    effective_threshold: p.low_stock_threshold ?? defaultThreshold
  })).filter((p) => p.stock <= p.effective_threshold).sort((a, b) => a.stock - b.stock).slice(0, 10);
  const lowStockCount = (activeProductsRes.data ?? []).filter((p) => p.stock <= (p.low_stock_threshold ?? defaultThreshold)).length;
  const spendByTeam = /* @__PURE__ */ new Map();
  for (const o of monthOrders) {
    if (o.status === "cancelled") continue;
    spendByTeam.set(o.team_id, (spendByTeam.get(o.team_id) ?? 0) + Number(o.total));
  }
  const teamStats = teams.map((t) => {
    const spent = spendByTeam.get(t.id) ?? 0;
    const limit = Number(t.monthly_limit);
    const pct = limit > 0 ? Math.min(999, Math.round(spent / limit * 100)) : 0;
    return {
      id: t.id,
      name: t.name,
      monthly_limit: limit,
      spent,
      pct
    };
  }).sort((a, b) => b.spent - a.spent);
  const overBudgetCount = teamStats.filter((t) => t.monthly_limit > 0 && t.pct >= 100).length;
  return {
    kpis: {
      pending: pendingCount ?? 0,
      awaiting: awaitingCount ?? 0,
      pendingReplacements: pendingReplacementsCount ?? 0,
      monthOrders: monthOrdersCount,
      monthRevenue,
      activeTeams: teams.length,
      lowStock: lowStockCount,
      stuck: (stuckAwaitingCount ?? 0) + (stuckReadyCount ?? 0),
      overBudget: overBudgetCount
    },
    defaultLowStockThreshold: defaultThreshold,
    topTeams: teamStats.slice(0, 5),
    teamStats,
    recentOrders: recentOrdersRes.data ?? [],
    stuckOrders: stuckOrdersRes.data ?? [],
    lowStock
  };
});
const setTeamMonthlyLimit_createServerFn_handler = createServerRpc({
  id: "ac50e4dd05873d7016818876dc3b7c322d1e44675eebcb275f39b668062a3108",
  name: "setTeamMonthlyLimit",
  filename: "src/lib/admin-dashboard.functions.ts"
}, (opts) => setTeamMonthlyLimit.__executeServer(opts));
const setTeamMonthlyLimit = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  team_id: stringType().uuid(),
  monthly_limit: numberType().min(0).max(1e7)
}).parse(input)).handler(setTeamMonthlyLimit_createServerFn_handler, async ({
  data,
  context
}) => {
  await assertAdmin(context.userId);
  const {
    supabaseAdmin
  } = await import("./client.server-D0btppze.mjs");
  const {
    error
  } = await supabaseAdmin.from("teams").update({
    monthly_limit: data.monthly_limit
  }).eq("id", data.team_id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  getAdminDashboard_createServerFn_handler,
  setTeamMonthlyLimit_createServerFn_handler
};
