import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type RoleCode = "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER";

const UNIT_ADMIN_ROLES = new Set(["PLATFORM_OWNER", "UNIT_OWNER", "WORK_MANAGER", "LOGISTICS_NCO", "UNIT_ADMIN"]);
const SELECTABLE_UNIT_FILTER = "id, name, code, logo_url, accent_color, active, contact_phone, settings, created_at, updated_at, status, setup_status, deleted_at";
const OWNER_UNIT_FILTER = "id, name, code, logo_url, cover_image_url, contact_phone, accent_color, active, enabled_modules, settings, created_at, updated_at, status, setup_status, deleted_at";

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

function isSelectableUnit(unit: any) {
  if (!unit) return false;
  if (unit.deleted_at) return false;
  if (unit.status && !["active", "pending_setup", "ready"].includes(String(unit.status))) return false;
  return unit.active !== false;
}

function mapUnitForClient(unit: any, role: string, isPlatformOwner = false) {
  return {
    unit_id: unit.id,
    unit_name: unit.name,
    unit_code: unit.code ?? null,
    logo_url: unit.logo_url ?? null,
    accent_color: unit.accent_color ?? null,
    contact_phone: unit.contact_phone ?? null,
    active: unit.active !== false,
    status: unit.status ?? (unit.active === false ? "inactive" : "active"),
    setup_status: unit.setup_status ?? null,
    role,
    is_platform_owner: isPlatformOwner,
  };
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
        .select(SELECTABLE_UNIT_FILTER)
        .is("deleted_at", null)
        .neq("status", "deleted")
        .order("name");
      return (data ?? [])
        .filter(isSelectableUnit)
        .map((u: any) => mapUnitForClient(u, "PLATFORM_OWNER", true));
    }

    const { data: membershipRows } = await supabaseAdmin
      .from("unit_memberships")
      .select(`role, units(${SELECTABLE_UNIT_FILTER})`)
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    const unitsById = new Map<string, any>();

    for (const { row, unit } of (membershipRows ?? [])
      .map((row: any) => ({ row, unit: row.units }))
      .filter(({ unit }: any) => isSelectableUnit(unit))) {
      unitsById.set(unit.id, mapUnitForClient(unit, row.role, false));
    }

    // Compatibility: imported/Lovable users may still only have legacy team_members
    // or new team_memberships rows. Derive their Unit access instead of showing an
    // empty selector.
    const { data: teamMembershipRows } = await supabaseAdmin
      .from("team_memberships")
      .select(`role, units(${SELECTABLE_UNIT_FILTER})`)
      .eq("user_id", context.userId)
      .eq("is_active", true);
    for (const { row, unit } of (teamMembershipRows ?? [])
      .map((row: any) => ({ row, unit: row.units }))
      .filter(({ unit }: any) => isSelectableUnit(unit))) {
      if (!unitsById.has(unit.id)) unitsById.set(unit.id, mapUnitForClient(unit, row.role ?? "UNIT_USER", false));
    }

    const { data: legacyRows } = await supabaseAdmin
      .from("team_members")
      .select(`role, teams(unit_id, units(${SELECTABLE_UNIT_FILTER}))`)
      .eq("user_id", context.userId)
      .eq("is_active", true);
    for (const { row, unit } of (legacyRows ?? [])
      .map((row: any) => ({ row, unit: row.teams?.units }))
      .filter(({ unit }: any) => isSelectableUnit(unit))) {
      if (!unitsById.has(unit.id)) unitsById.set(unit.id, mapUnitForClient(unit, mapGlobalRoleToUnitRole(globalRole) || row.role || "UNIT_USER", false));
    }

    return Array.from(unitsById.values()).sort((a, b) => a.unit_name.localeCompare(b.unit_name, "he"));
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
      contact_phone: z.string().trim().max(40).optional().default(""),
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
      contact_phone: data.contact_phone || null,
      active: true,
      status: "active",
      setup_status: "pending_setup",
      updated_at: new Date().toISOString(),
    };
    const { data: unit, error } = await supabaseAdmin
      .from("units")
      .insert(payload)
      .select("id, name, code, logo_url, accent_color, contact_phone, status, setup_status")
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
      contact_phone: unit.contact_phone ?? null,
      status: unit.status ?? "active",
      setup_status: unit.setup_status ?? "pending_setup",
      role: "PLATFORM_OWNER",
      is_platform_owner: true,
    };
  });

export const listOwnerUnits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    query: z.string().trim().max(120).optional().default(""),
    include_deleted: z.boolean().optional().default(false),
  }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const role = await getGlobalUserRole(context.userId);
    if (role !== "OWNER") throw new Error("רק בעל המערכת יכול לנהל יחידות");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("units")
      .select(`${OWNER_UNIT_FILTER}, teams(id, name, active), unit_memberships(user_id, role, is_active)`)
      .order("created_at", { ascending: false });
    if (!data.include_deleted) q = q.is("deleted_at", null).neq("status", "deleted");
    const { data: units, error } = await q;
    if (error) throw new Error(error.message);
    const term = data.query.toLowerCase();
    return (units ?? [])
      .filter((unit: any) => !term || [unit.name, unit.code, unit.contact_phone].some((v) => String(v ?? "").toLowerCase().includes(term)))
      .map((unit: any) => ({
        id: unit.id,
        name: unit.name,
        code: unit.code ?? "",
        logo_url: unit.logo_url ?? "",
        cover_image_url: unit.cover_image_url ?? "",
        contact_phone: unit.contact_phone ?? "",
        accent_color: unit.accent_color ?? "",
        active: unit.active !== false,
        status: unit.status ?? (unit.active === false ? "inactive" : "active"),
        setup_status: unit.setup_status ?? "pending_setup",
        deleted_at: unit.deleted_at ?? null,
        teams_count: (unit.teams ?? []).length,
        active_teams_count: (unit.teams ?? []).filter((t: any) => t.active !== false).length,
        admins: (unit.unit_memberships ?? []).filter((m: any) => m.is_active && UNIT_ADMIN_ROLES.has(m.role)),
        created_at: unit.created_at,
        updated_at: unit.updated_at,
      }));
  });

export const updateOwnerUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().max(40).nullable().optional(),
    logo_url: z.string().trim().max(500).nullable().optional(),
    cover_image_url: z.string().trim().max(500).nullable().optional(),
    contact_phone: z.string().trim().max(40).nullable().optional(),
    accent_color: z.string().trim().max(40).nullable().optional(),
    active: z.boolean(),
    status: z.enum(["active", "pending_setup", "ready", "inactive"]).optional().default("active"),
    setup_status: z.enum(["pending_setup", "ready", "active", "inactive"]).optional().default("pending_setup"),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const role = await getGlobalUserRole(context.userId);
    if (role !== "OWNER") throw new Error("רק בעל המערכת יכול לערוך יחידות");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("units")
      .update({
        name: data.name,
        code: data.code ? data.code.toUpperCase() : null,
        logo_url: data.logo_url || null,
        cover_image_url: data.cover_image_url || null,
        contact_phone: data.contact_phone || null,
        accent_color: data.accent_color || null,
        active: data.active,
        status: data.active ? data.status : "inactive",
        setup_status: data.setup_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const softDeleteOwnerUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const role = await getGlobalUserRole(context.userId);
    if (role !== "OWNER") throw new Error("רק בעל המערכת יכול למחוק יחידות");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("units")
      .update({ active: false, status: "deleted", deleted_at: now, updated_at: now })
      .eq("id", data.id)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_active_contexts").update({
      active_unit_id: null,
      active_team_id: null,
      updated_at: now,
    }).eq("active_unit_id", data.id);
    return { ok: true };
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
