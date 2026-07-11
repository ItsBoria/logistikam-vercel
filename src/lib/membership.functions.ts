import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type RoleCode = "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER";

const UNIT_ADMIN_ROLES = new Set(["PLATFORM_OWNER", "UNIT_OWNER", "WORK_MANAGER", "LOGISTICS_NCO", "UNIT_ADMIN"]);

export type UnitContext = {
  unit_id: string;
  unit_name: string;
  unit_code: string | null;
  logo_url: string | null;
  accent_color: string | null;
  role: string;
  is_platform_owner: boolean;
} | null;

export type TeamContext = {
  unit_id: string;
  unit_name: string;
  team_id: string;
  team_name: string;
  pin: string;
  monthly_limit: number;
  contact_phone: string | null;
} | null;

export type ActiveAdminTeam = {
  unit_id: string;
  unit_name: string;
  team_id: string | null;
  team_name: string | null;
  is_owner_scope: boolean;
} | null;

function mapGlobalRoleToUnitRole(role: RoleCode) {
  if (role === "OWNER") return "PLATFORM_OWNER";
  if (role === "WORK_MANAGER") return "WORK_MANAGER";
  if (role === "ADMIN") return "LOGISTICS_NCO";
  return "UNIT_USER";
}

async function getGlobalUserRole(userId: string): Promise<RoleCode> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw new Error(error.message);

  const level: Record<RoleCode, number> = { OWNER: 100, WORK_MANAGER: 50, ADMIN: 50, USER: 10 };
  let highest: RoleCode = "USER";
  for (const row of data ?? []) {
    const raw = String((row as any).role || "").toUpperCase();
    const role: RoleCode =
      raw === "OWNER" ? "OWNER" :
      raw === "WORK_MANAGER" ? "WORK_MANAGER" :
      raw === "ADMIN" || raw === "STAFF" ? "ADMIN" :
      "USER";
    if (level[role] > level[highest]) highest = role;
  }
  return highest;
}

async function getActiveContext(supabaseAdmin: any, userId: string) {
  const { data } = await supabaseAdmin
    .from("user_active_contexts")
    .select("active_unit_id, active_team_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data as { active_unit_id: string | null; active_team_id: string | null } | null;
}

async function getUnitMembership(supabaseAdmin: any, userId: string, unitId: string) {
  const { data } = await supabaseAdmin
    .from("unit_memberships")
    .select("unit_id, role, is_active")
    .eq("user_id", userId)
    .eq("unit_id", unitId)
    .eq("is_active", true)
    .maybeSingle();
  return data as { unit_id: string; role: string; is_active: boolean } | null;
}

async function assertCanAccessUnit(supabaseAdmin: any, userId: string, unitId: string) {
  const globalRole = await getGlobalUserRole(userId);
  if (globalRole === "OWNER") return { role: "PLATFORM_OWNER", isPlatformOwner: true };
  const membership = await getUnitMembership(supabaseAdmin, userId, unitId);
  if (!membership) throw new Error("אין לך הרשאה ליחידה הזו");
  return { role: membership.role, isPlatformOwner: false };
}

async function assertActiveUnit(supabaseAdmin: any, userId: string) {
  const ctx = await getActiveContext(supabaseAdmin, userId);
  if (!ctx?.active_unit_id) throw new Error("צריך לבחור יחידה פעילה לפני המשך העבודה");
  const access = await assertCanAccessUnit(supabaseAdmin, userId, ctx.active_unit_id);
  return { unitId: ctx.active_unit_id, teamId: ctx.active_team_id, ...access };
}

async function canAccessTeamInUnit(supabaseAdmin: any, userId: string, unitId: string, teamId: string) {
  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id, unit_id, active")
    .eq("id", teamId)
    .maybeSingle();
  if (!team || team.unit_id !== unitId) return false;

  const access = await assertCanAccessUnit(supabaseAdmin, userId, unitId);
  if (UNIT_ADMIN_ROLES.has(access.role)) return true;

  const { data: membership } = await supabaseAdmin
    .from("team_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("unit_id", unitId)
    .eq("team_id", teamId)
    .eq("is_active", true)
    .maybeSingle();
  return !!membership;
}

export async function resolveActiveAdminUnitId(supabaseAdmin: any, userId: string) {
  const active = await assertActiveUnit(supabaseAdmin, userId);
  if (!UNIT_ADMIN_ROLES.has(active.role)) throw new Error("אין הרשאה ניהולית ליחידה הזו");
  return active.unitId;
}

export async function resolveActiveAdminScope(supabaseAdmin: any, userId: string) {
  const active = await assertActiveUnit(supabaseAdmin, userId);
  if (!UNIT_ADMIN_ROLES.has(active.role)) throw new Error("אין הרשאה ניהולית ליחידה הזו");
  return { unitId: active.unitId, teamId: active.teamId, role: active.role };
}

export const listActiveUnits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const globalRole = await getGlobalUserRole(context.userId);

    if (globalRole === "OWNER") {
      const { data } = await supabaseAdmin
        .from("units")
        .select("id, name, code, logo_url, accent_color")
        .eq("active", true)
        .order("name");
      return (data ?? []).map((u: any) => ({
        unit_id: u.id,
        unit_name: u.name,
        unit_code: u.code ?? null,
        logo_url: u.logo_url ?? null,
        accent_color: u.accent_color ?? null,
        role: "PLATFORM_OWNER",
        is_platform_owner: true,
      }));
    }

    const { data } = await supabaseAdmin
      .from("unit_memberships")
      .select("role, units(id, name, code, logo_url, accent_color, active)")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    return (data ?? [])
      .map((row: any) => ({ row, unit: row.units }))
      .filter(({ unit }: any) => unit?.active)
      .map(({ row, unit }: any) => ({
        unit_id: unit.id,
        unit_name: unit.name,
        unit_code: unit.code ?? null,
        logo_url: unit.logo_url ?? null,
        accent_color: unit.accent_color ?? null,
        role: row.role,
        is_platform_owner: false,
      }));
  });

export const getMyActiveUnit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UnitContext> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ctx = await getActiveContext(supabaseAdmin, context.userId);
    if (!ctx?.active_unit_id) return null;
    const access = await assertCanAccessUnit(supabaseAdmin, context.userId, ctx.active_unit_id);
    const { data: unit } = await supabaseAdmin
      .from("units")
      .select("id, name, code, logo_url, accent_color, active")
      .eq("id", ctx.active_unit_id)
      .maybeSingle();
    if (!unit?.active) return null;
    return {
      unit_id: unit.id,
      unit_name: unit.name,
      unit_code: unit.code ?? null,
      logo_url: unit.logo_url ?? null,
      accent_color: unit.accent_color ?? null,
      role: access.role,
      is_platform_owner: access.isPlatformOwner,
    };
  });

export const setMyUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ unit_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertCanAccessUnit(supabaseAdmin, context.userId, data.unit_id);
    const { data: unit } = await supabaseAdmin
      .from("units")
      .select("id, active")
      .eq("id", data.unit_id)
      .maybeSingle();
    if (!unit?.active) throw new Error("היחידה לא פעילה");
    const { error } = await supabaseAdmin
      .from("user_active_contexts")
      .upsert({
        user_id: context.userId,
        active_unit_id: data.unit_id,
        active_team_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      name: z.string().trim().min(2).max(120),
      code: z.string().trim().max(40).optional().default(""),
      accent_color: z.string().trim().max(40).optional().default(""),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const role = await getGlobalUserRole(context.userId);
    if (role !== "OWNER") throw new Error("רק בעל המערכת יכול ליצור יחידות");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      code: data.code ? data.code.toUpperCase() : null,
      accent_color: data.accent_color || null,
      active: true,
      updated_at: new Date().toISOString(),
    };
    const { data: unit, error } = await supabaseAdmin
      .from("units")
      .insert(payload)
      .select("id, name, code, logo_url, accent_color")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("unit_memberships")
      .upsert({
        user_id: context.userId,
        unit_id: unit.id,
        role: "PLATFORM_OWNER",
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,unit_id" });

    await supabaseAdmin
      .from("user_active_contexts")
      .upsert({
        user_id: context.userId,
        active_unit_id: unit.id,
        active_team_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    return {
      unit_id: unit.id,
      unit_name: unit.name,
      unit_code: unit.code ?? null,
      logo_url: unit.logo_url ?? null,
      accent_color: unit.accent_color ?? null,
      role: "PLATFORM_OWNER",
      is_platform_owner: true,
    };
  });

export const listTeamsForActiveUnit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const active = await assertActiveUnit(supabaseAdmin, context.userId);

    if (UNIT_ADMIN_ROLES.has(active.role)) {
      const { data } = await supabaseAdmin
        .from("teams")
        .select("id, name, monthly_limit, active, is_admin_only")
        .eq("unit_id", active.unitId)
        .eq("active", true)
        .order("name");
      return (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        monthly_limit: Number(t.monthly_limit ?? 0),
        role: active.role,
      }));
    }

    const { data } = await supabaseAdmin
      .from("team_memberships")
      .select("role, teams(id, name, monthly_limit, active, unit_id)")
      .eq("user_id", context.userId)
      .eq("unit_id", active.unitId)
      .eq("is_active", true);

    return (data ?? [])
      .map((row: any) => ({ row, team: row.teams }))
      .filter(({ team }: any) => team?.active && team.unit_id === active.unitId)
      .map(({ row, team }: any) => ({
        id: team.id,
        name: team.name,
        monthly_limit: Number(team.monthly_limit ?? 0),
        role: row.role,
      }));
  });

export const setMyTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ team_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const active = await assertActiveUnit(supabaseAdmin, context.userId);
    const allowed = await canAccessTeamInUnit(supabaseAdmin, context.userId, active.unitId, data.team_id);
    if (!allowed) throw new Error("אין לך הרשאה לצוות הזה");
    const { error } = await supabaseAdmin
      .from("user_active_contexts")
      .upsert({
        user_id: context.userId,
        active_unit_id: active.unitId,
        active_team_id: data.team_id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Legacy-compatible name. It now returns Teams only from the selected Unit.
// Keep this as its own server function instead of aliasing another server function;
// TanStack's server-function transform can produce runtime TDZ errors for aliases.
export const listActiveTeams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const active = await assertActiveUnit(supabaseAdmin, context.userId);

    if (UNIT_ADMIN_ROLES.has(active.role)) {
      const { data } = await supabaseAdmin
        .from("teams")
        .select("id, name, monthly_limit, active, is_admin_only")
        .eq("unit_id", active.unitId)
        .eq("active", true)
        .order("name");
      return (data ?? []).map((team: any) => ({
        id: team.id,
        name: team.name,
        monthly_limit: Number(team.monthly_limit ?? 0),
        role: active.role,
      }));
    }

    const { data } = await supabaseAdmin
      .from("team_memberships")
      .select("role, teams(id, name, monthly_limit, active, unit_id)")
      .eq("user_id", context.userId)
      .eq("unit_id", active.unitId)
      .eq("is_active", true);

    return (data ?? [])
      .map((row: any) => ({ row, team: row.teams }))
      .filter(({ team }: any) => team?.active && team.unit_id === active.unitId)
      .map(({ row, team }: any) => ({
        id: team.id,
        name: team.name,
        monthly_limit: Number(team.monthly_limit ?? 0),
        role: row.role,
      }));
  });

export const getMyTeamContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamContext> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ctx = await getActiveContext(supabaseAdmin, context.userId);
    if (!ctx?.active_unit_id || !ctx.active_team_id) return null;
    const allowed = await canAccessTeamInUnit(supabaseAdmin, context.userId, ctx.active_unit_id, ctx.active_team_id);
    if (!allowed) return null;
    const { data: row } = await supabaseAdmin
      .from("teams")
      .select("id, name, pin, monthly_limit, contact_phone, active, unit_id, units(name)")
      .eq("id", ctx.active_team_id)
      .maybeSingle();
    if (!row?.active || row.unit_id !== ctx.active_unit_id) return null;
    return {
      unit_id: row.unit_id,
      unit_name: (row as any).units?.name ?? "",
      team_id: row.id,
      team_name: row.name,
      pin: row.pin,
      monthly_limit: Number(row.monthly_limit),
      contact_phone: row.contact_phone,
    };
  });

export const getMyLandingContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await getGlobalUserRole(context.userId);
    const hasAccess = role !== "USER";
    const isAdmin = role !== "USER";
    const isStaff = false;

    let team: TeamContext = null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ctx = await getActiveContext(supabaseAdmin, context.userId);
    if (ctx?.active_unit_id && ctx.active_team_id) {
      const allowed = await canAccessTeamInUnit(supabaseAdmin, context.userId, ctx.active_unit_id, ctx.active_team_id);
      if (allowed) {
        const { data: row } = await supabaseAdmin
          .from("teams")
          .select("id, name, pin, monthly_limit, contact_phone, active, unit_id, units(name)")
          .eq("id", ctx.active_team_id)
          .maybeSingle();
        if (row?.active && row.unit_id === ctx.active_unit_id) {
          team = {
            unit_id: row.unit_id,
            unit_name: (row as any).units?.name ?? "",
            team_id: row.id,
            team_name: row.name,
            pin: row.pin,
            monthly_limit: Number(row.monthly_limit),
            contact_phone: row.contact_phone,
          };
        }
      }
    }

    return { role, hasAccess, isAdmin, isStaff, team };
  });

export const getMyActiveAdminTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ActiveAdminTeam> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ctx = await getActiveContext(supabaseAdmin, context.userId);
    if (!ctx?.active_unit_id) return null;
    const access = await assertCanAccessUnit(supabaseAdmin, context.userId, ctx.active_unit_id);
    if (!UNIT_ADMIN_ROLES.has(access.role)) return null;
    const { data: unit } = await supabaseAdmin
      .from("units")
      .select("id, name, active")
      .eq("id", ctx.active_unit_id)
      .maybeSingle();
    if (!unit?.active) return null;
    let team: any = null;
    if (ctx.active_team_id) {
      const { data } = await supabaseAdmin
        .from("teams")
        .select("id, name, unit_id, active")
        .eq("id", ctx.active_team_id)
        .maybeSingle();
      if (data?.active && data.unit_id === ctx.active_unit_id) team = data;
    }
    return {
      unit_id: unit.id,
      unit_name: unit.name,
      team_id: team?.id ?? null,
      team_name: team?.name ?? null,
      is_owner_scope: access.isPlatformOwner,
    };
  });

export const getTeamContextById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ team_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<TeamContext> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const active = await assertActiveUnit(supabaseAdmin, context.userId);
    const allowed = await canAccessTeamInUnit(supabaseAdmin, context.userId, active.unitId, data.team_id);
    if (!allowed) throw new Error("Forbidden");
    const { data: row } = await supabaseAdmin
      .from("teams")
      .select("id, name, pin, monthly_limit, contact_phone, active, unit_id, units(name)")
      .eq("id", data.team_id)
      .maybeSingle();
    if (!row?.active || row.unit_id !== active.unitId) throw new Error("צוות לא תקין");
    return {
      unit_id: row.unit_id,
      unit_name: (row as any).units?.name ?? "",
      team_id: row.id,
      team_name: row.name,
      pin: row.pin,
      monthly_limit: Number(row.monthly_limit),
      contact_phone: row.contact_phone,
    };
  });

export const setUserTeamAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    team_id: z.string().uuid().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const currentRole = await getGlobalUserRole(context.userId);
    if (currentRole !== "OWNER") throw new Error("פעולה זו זמינה לבעלים בלבד");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.team_id === null) {
      await supabaseAdmin.from("team_members").delete().eq("user_id", data.user_id);
      await supabaseAdmin.from("team_memberships").delete().eq("user_id", data.user_id);
      return { ok: true };
    }
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id, unit_id, active")
      .eq("id", data.team_id)
      .maybeSingle();
    if (!team?.active) throw new Error("צוות לא תקין");
    await supabaseAdmin
      .from("unit_memberships")
      .upsert({
        user_id: data.user_id,
        unit_id: team.unit_id,
        role: "LOGISTICS_NCO",
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,unit_id" });
    await supabaseAdmin
      .from("team_memberships")
      .upsert({
        user_id: data.user_id,
        unit_id: team.unit_id,
        team_id: data.team_id,
        role: "TEAM_MANAGER",
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,team_id" });
    await supabaseAdmin
      .from("team_members")
      .upsert({
        user_id: data.user_id,
        team_id: data.team_id,
        role: "ADMIN",
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    return { ok: true };
  });

export const claimConfiguredFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await getGlobalUserRole(context.userId);
    return { claimed: false, reason: role !== "USER" ? "already_assigned" as const : "owner_managed" as const };
  });

export const claimAdminWithLegacyCreds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      identifier: z.string().min(2).max(254),
      password: z.string().min(1).max(72),
    }).parse(input)
  )
  .handler(async () => {
    throw new Error("שדרוג הרשאות דרך חשבון ישן בוטל. בעל המערכת מנהל את כל התפקידים.");
  });
