import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type RoleCode = "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER";

const UNIT_ADMIN_ROLES = new Set(["PLATFORM_OWNER", "UNIT_OWNER", "WORK_MANAGER", "LOGISTICS_NCO", "UNIT_ADMIN"]);
const UNIT_USER_MANAGER_ROLES = new Set(["PLATFORM_OWNER", "UNIT_OWNER", "UNIT_ADMIN", "WORK_MANAGER", "LOGISTICS_NCO"]);
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

async function getHighestUnitAdminRole(supabaseAdmin: any, userId: string) {
  const { data } = await supabaseAdmin
    .from("unit_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);
  const level: Record<string, number> = {
    PLATFORM_OWNER: 100,
    UNIT_OWNER: 90,
    UNIT_ADMIN: 80,
    WORK_MANAGER: 70,
    LOGISTICS_NCO: 60,
    UNIT_USER: 10,
  };
  let highest: string | null = null;
  for (const row of data ?? []) {
    const role = String((row as any).role || "");
    if (UNIT_ADMIN_ROLES.has(role) && (!highest || (level[role] ?? 0) > (level[highest] ?? 0))) highest = role;
  }
  return highest;
}

function unitRoleToGlobalRole(role: string | null): RoleCode {
  if (role === "PLATFORM_OWNER" || role === "UNIT_OWNER") return "WORK_MANAGER";
  if (role === "WORK_MANAGER") return "WORK_MANAGER";
  if (role === "UNIT_ADMIN" || role === "LOGISTICS_NCO") return "ADMIN";
  return "USER";
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

function mapUnitRegistrationRequestForClient(row: any) {
  return {
    id: row.id,
    requested_unit_name: row.requested_unit_name ?? "",
    requested_unit_code: row.requested_unit_code ?? "",
    contact_name: row.contact_name ?? "",
    contact_email: row.contact_email ?? "",
    contact_phone: row.contact_phone ?? "",
    requested_admin_name: row.requested_admin_name ?? "",
    requested_admin_email: row.requested_admin_email ?? "",
    requested_admin_user_id: row.requested_admin_user_id ?? null,
    description: row.description ?? "",
    logo_url: row.logo_url ?? "",
    accepted_terms: row.accepted_terms === true,
    status: row.status ?? "pending",
    review_notes: row.review_notes ?? "",
    reviewed_by: row.reviewed_by ?? null,
    reviewed_at: row.reviewed_at ?? null,
    created_unit_id: row.created_unit_id ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

async function assertCanAccessUnit(supabaseAdmin: any, userId: string, unitId: string) {
  const globalRole = await getGlobalUserRole(userId);
  if (globalRole === "OWNER") return { role: "PLATFORM_OWNER", isPlatformOwner: true };
  const membership = await getUnitMembership(supabaseAdmin, userId, unitId);
  if (!membership) throw new Error("××™×Ÿ ×œ×š ×”×¨×©××” ×œ×™×—×™×“×” ×”×–×•");
  return { role: membership.role, isPlatformOwner: false };
}

async function assertActiveUnit(supabaseAdmin: any, userId: string) {
  const ctx = await getActiveContext(supabaseAdmin, userId);
  let activeUnitId = ctx?.active_unit_id ?? null;
  let activeTeamId = ctx?.active_team_id ?? null;

  if (!activeUnitId) {
    const globalRole = await getGlobalUserRole(userId);
    if (globalRole === "OWNER") {
      throw new Error("×¦×¨×™×š ×œ×‘×—×•×¨ ×™×—×™×“×” ×¤×¢×™×œ×” ×œ×¤× ×™ ×”×ž×©×š ×”×¢×‘×•×“×”");
    }

    const { data: memberships } = await supabaseAdmin
      .from("unit_memberships")
      .select(`unit_id, role, units(${SELECTABLE_UNIT_FILTER})`)
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    const first = (memberships ?? []).find((row: any) => isSelectableUnit(row.units));
    if (!first?.unit_id) {
      throw new Error("×¦×¨×™×š ×œ×‘×—×•×¨ ×™×—×™×“×” ×¤×¢×™×œ×” ×œ×¤× ×™ ×”×ž×©×š ×”×¢×‘×•×“×”");
    }

    activeUnitId = first.unit_id;
    activeTeamId = null;
    await supabaseAdmin
      .from("user_active_contexts")
      .upsert({
        user_id: userId,
        active_unit_id: activeUnitId,
        active_team_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
  }

  const access = await assertCanAccessUnit(supabaseAdmin, userId, activeUnitId!);
  return { unitId: activeUnitId!, teamId: activeTeamId, ...access };
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
  if (!UNIT_ADMIN_ROLES.has(active.role)) throw new Error("××™×Ÿ ×”×¨×©××” × ×™×”×•×œ×™×ª ×œ×™×—×™×“×” ×”×–×•");
  return active.unitId;
}

export async function resolveActiveAdminScope(supabaseAdmin: any, userId: string) {
  const active = await assertActiveUnit(supabaseAdmin, userId);
  if (!UNIT_ADMIN_ROLES.has(active.role)) throw new Error("××™×Ÿ ×”×¨×©××” × ×™×”×•×œ×™×ª ×œ×™×—×™×“×” ×”×–×•");
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
    if (!unit?.active) throw new Error("×”×™×—×™×“×” ×œ× ×¤×¢×™×œ×”");
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
    if (role !== "OWNER") throw new Error("×¨×§ ×‘×¢×œ ×”×ž×¢×¨×›×ª ×™×›×•×œ ×œ×™×¦×•×¨ ×™×—×™×“×•×ª");

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

export const listMyUnitRegistrationRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const email = authUser?.user?.email?.toLowerCase() ?? "";
    let query = supabaseAdmin
      .from("unit_registration_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (email) {
      query = query.or(`requested_admin_user_id.eq.${context.userId},contact_email.eq.${email},requested_admin_email.eq.${email}`);
    } else {
      query = query.eq("requested_admin_user_id", context.userId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapUnitRegistrationRequestForClient);
  });

export const submitUnitRegistrationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      requested_unit_name: z.string().trim().min(2).max(120),
      requested_unit_code: z.string().trim().max(40).optional().default(""),
      contact_name: z.string().trim().min(2).max(120),
      contact_phone: z.string().trim().max(40).optional().default(""),
      requested_admin_name: z.string().trim().max(120).optional().default(""),
      requested_admin_email: z.string().trim().email().max(254).optional(),
      description: z.string().trim().max(1000).optional().default(""),
      accepted_terms: z.literal(true),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (authError) throw new Error(authError.message);

    const currentEmail = authUser?.user?.email?.trim().toLowerCase() ?? "";
    const requestedAdminEmail = (data.requested_admin_email || currentEmail).trim().toLowerCase();
    if (!requestedAdminEmail) throw new Error("לא נמצא אימייל לחשבון. יש להתחבר עם חשבון אימייל תקין.");

    const normalizedCode = data.requested_unit_code.trim() ? data.requested_unit_code.trim().toUpperCase() : null;
    const normalizedName = data.requested_unit_name.trim();

    const duplicateChecks = [
      supabaseAdmin
        .from("unit_registration_requests")
        .select("id, status, requested_unit_name, requested_unit_code, created_at, review_notes")
        .eq("status", "pending")
        .eq("requested_admin_user_id", context.userId)
        .limit(1),
      supabaseAdmin
        .from("unit_registration_requests")
        .select("id, status, requested_unit_name, requested_unit_code, created_at, review_notes")
        .eq("status", "pending")
        .ilike("requested_admin_email", requestedAdminEmail)
        .limit(1),
      supabaseAdmin
        .from("unit_registration_requests")
        .select("id, status, requested_unit_name, requested_unit_code, created_at, review_notes")
        .eq("status", "pending")
        .ilike("requested_unit_name", normalizedName)
        .limit(1),
    ];
    if (normalizedCode) {
      duplicateChecks.push(
        supabaseAdmin
          .from("unit_registration_requests")
          .select("id, status, requested_unit_name, requested_unit_code, created_at, review_notes")
          .eq("status", "pending")
          .ilike("requested_unit_code", normalizedCode)
          .limit(1)
      );
    }

    const duplicateResults = await Promise.all(duplicateChecks);
    const duplicateError = duplicateResults.find((result: any) => result.error)?.error;
    if (duplicateError) throw new Error(duplicateError.message);
    const existingPending = duplicateResults.map((result: any) => result.data?.[0]).find(Boolean);
    if (existingPending) {
      await supabaseAdmin.from("audit_log").insert({
        action_type: "UNIT_REGISTRATION_DUPLICATE_BLOCKED",
        target_type: "unit_registration_request",
        target_id: existingPending.id,
        performed_by_user_id: context.userId,
        new_value: {
          requested_unit_name: normalizedName,
          requested_unit_code: normalizedCode,
          requested_admin_email: requestedAdminEmail,
          existing_created_at: existingPending.created_at,
        },
      } as any);
      return { ok: true, status: "pending", duplicate_blocked: true, request: mapUnitRegistrationRequestForClient(existingPending) };
    }

    const rateWindowIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAttemptCount, error: rateError } = await supabaseAdmin
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("performed_by_user_id", context.userId)
      .in("action_type", ["UNIT_REGISTRATION_REQUEST_SUBMITTED", "UNIT_REGISTRATION_DUPLICATE_BLOCKED", "UNIT_REGISTRATION_RATE_LIMITED"])
      .gte("created_at", rateWindowIso);
    if (rateError) throw new Error(rateError.message);
    if ((recentAttemptCount ?? 0) >= 10) {
      await supabaseAdmin.from("audit_log").insert({
        action_type: "UNIT_REGISTRATION_RATE_LIMITED",
        target_type: "unit_registration_request",
        performed_by_user_id: context.userId,
        new_value: {
          requested_unit_name: normalizedName,
          requested_unit_code: normalizedCode,
          requested_admin_email: requestedAdminEmail,
          window: "1h",
          recent_attempt_count: recentAttemptCount ?? 0,
        },
      } as any);
      throw new Error("נשלחו יותר מדי בקשות בזמן קצר. נסה שוב מאוחר יותר.");
    }

    if (normalizedCode) {
      const { data: unitWithCode, error: codeError } = await supabaseAdmin
        .from("units")
        .select("id, name, code")
        .eq("code", normalizedCode)
        .is("deleted_at", null)
        .maybeSingle();
      if (codeError) throw new Error(codeError.message);
      if (unitWithCode?.id) throw new Error("כבר קיימת יחידה עם הקוד הזה. אפשר לשלוח בקשת גישה ליחידה הקיימת.");
    }

    const now = new Date().toISOString();
    const { data: inserted, error } = await supabaseAdmin
      .from("unit_registration_requests")
      .insert({
        requested_unit_name: normalizedName,
        requested_unit_code: normalizedCode,
        contact_name: data.contact_name,
        contact_email: currentEmail || requestedAdminEmail,
        contact_phone: data.contact_phone || null,
        requested_admin_name: data.requested_admin_name || data.contact_name,
        requested_admin_email: requestedAdminEmail,
        requested_admin_user_id: context.userId,
        description: data.description || null,
        accepted_terms: true,
        status: "pending",
        updated_at: now,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      action_type: "UNIT_REGISTRATION_REQUEST_SUBMITTED",
      target_type: "unit_registration_request",
      target_id: inserted?.id,
      performed_by_user_id: context.userId,
      new_value: {
        requested_unit_name: normalizedName,
        requested_unit_code: normalizedCode,
        requested_admin_email: requestedAdminEmail,
      },
    } as any);

    return { ok: true, status: "pending", request: mapUnitRegistrationRequestForClient(inserted) };
  });

export const listUnitRegistrationRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await getGlobalUserRole(context.userId);
    if (role !== "OWNER") throw new Error("רק בעל המערכת יכול לנהל בקשות לפתיחת יחידה");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("unit_registration_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapUnitRegistrationRequestForClient);
  });

export const resolveUnitRegistrationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      request_id: z.string().uuid(),
      decision: z.enum(["approved", "rejected"]),
      review_notes: z.string().trim().max(500).optional().default(""),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const role = await getGlobalUserRole(context.userId);
    if (role !== "OWNER") throw new Error("רק בעל המערכת יכול לאשר או לדחות פתיחת יחידה");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: request, error: requestError } = await supabaseAdmin
      .from("unit_registration_requests")
      .select("*")
      .eq("id", data.request_id)
      .maybeSingle();
    if (requestError) throw new Error(requestError.message);
    if (!request) throw new Error("בקשת פתיחת היחידה לא נמצאה");
    if (request.status !== "pending") {
      return { ok: true, status: request.status, request: mapUnitRegistrationRequestForClient(request) };
    }

    const now = new Date().toISOString();

    if (data.decision === "rejected") {
      const { data: updated, error } = await supabaseAdmin
        .from("unit_registration_requests")
        .update({
          status: "rejected",
          review_notes: data.review_notes || null,
          reviewed_by: context.userId,
          reviewed_at: now,
          updated_at: now,
        })
        .eq("id", data.request_id)
        .eq("status", "pending")
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("audit_log").insert({
        action_type: "UNIT_REGISTRATION_REQUEST_REJECTED",
        target_type: "unit_registration_request",
        target_id: data.request_id,
        performed_by_user_id: context.userId,
        new_value: { review_notes: data.review_notes || null },
      } as any);
      return { ok: true, status: "rejected", request: mapUnitRegistrationRequestForClient(updated) };
    }

    const normalizedCode = request.requested_unit_code ? String(request.requested_unit_code).trim().toUpperCase() : null;
    if (normalizedCode) {
      const { data: existingUnit, error: codeError } = await supabaseAdmin
        .from("units")
        .select("id, name")
        .eq("code", normalizedCode)
        .is("deleted_at", null)
        .maybeSingle();
      if (codeError) throw new Error(codeError.message);
      if (existingUnit?.id) throw new Error("כבר קיימת יחידה עם הקוד הזה. יש לדחות את הבקשה או לעדכן את הקוד.");
    }

    const { data: unit, error: unitError } = await supabaseAdmin
      .from("units")
      .insert({
        name: request.requested_unit_name,
        code: normalizedCode,
        logo_url: request.logo_url || null,
        contact_phone: request.contact_phone || null,
        active: true,
        status: "active",
        setup_status: "pending_setup",
        updated_at: now,
      })
      .select("id, name, code")
      .single();
    if (unitError) throw new Error(unitError.message);

    await supabaseAdmin.from("unit_memberships").upsert({
      user_id: context.userId,
      unit_id: unit.id,
      role: "PLATFORM_OWNER",
      is_active: true,
      updated_at: now,
    }, { onConflict: "user_id,unit_id" });

    if (request.requested_admin_user_id) {
      await supabaseAdmin.from("unit_memberships").upsert({
        user_id: request.requested_admin_user_id,
        unit_id: unit.id,
        role: "UNIT_OWNER",
        is_active: true,
        updated_at: now,
      }, { onConflict: "user_id,unit_id" });
      await supabaseAdmin.from("user_active_contexts").upsert({
        user_id: request.requested_admin_user_id,
        active_unit_id: unit.id,
        active_team_id: null,
        updated_at: now,
      }, { onConflict: "user_id" });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("unit_registration_requests")
      .update({
        status: "approved",
        review_notes: data.review_notes || null,
        reviewed_by: context.userId,
        reviewed_at: now,
        created_unit_id: unit.id,
        updated_at: now,
      })
      .eq("id", data.request_id)
      .eq("status", "pending")
      .select("*")
      .single();
    if (updateError) throw new Error(updateError.message);

    await supabaseAdmin.from("audit_log").insert({
      action_type: "UNIT_REGISTRATION_REQUEST_APPROVED",
      target_type: "unit_registration_request",
      target_id: data.request_id,
      performed_by_user_id: context.userId,
      new_value: {
        created_unit_id: unit.id,
        requested_admin_user_id: request.requested_admin_user_id ?? null,
        review_notes: data.review_notes || null,
      },
    } as any);

    return { ok: true, status: "approved", unit_id: unit.id, request: mapUnitRegistrationRequestForClient(updated) };
  });

export const listOwnerUnits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    query: z.string().trim().max(120).optional().default(""),
    include_deleted: z.boolean().optional().default(false),
  }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const role = await getGlobalUserRole(context.userId);
    if (role !== "OWNER") throw new Error("×¨×§ ×‘×¢×œ ×”×ž×¢×¨×›×ª ×™×›×•×œ ×œ× ×”×œ ×™×—×™×“×•×ª");
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
    if (role !== "OWNER") throw new Error("×¨×§ ×‘×¢×œ ×”×ž×¢×¨×›×ª ×™×›×•×œ ×œ×¢×¨×•×š ×™×—×™×“×•×ª");
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
    if (role !== "OWNER") throw new Error("×¨×§ ×‘×¢×œ ×”×ž×¢×¨×›×ª ×™×›×•×œ ×œ×ž×—×•×§ ×™×—×™×“×•×ª");
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
    if (!allowed) throw new Error("××™×Ÿ ×œ×š ×”×¨×©××” ×œ×¦×•×•×ª ×”×–×”");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const globalRole = await getGlobalUserRole(context.userId);
    const unitAdminRole = await getHighestUnitAdminRole(supabaseAdmin, context.userId);
    const role = globalRole !== "USER" ? globalRole : unitRoleToGlobalRole(unitAdminRole);
    const hasAccess = role !== "USER";
    const isAdmin = role !== "USER";
    const isStaff = false;

    let team: TeamContext = null;
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

export const listRequestableUnits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("units")
      .select(SELECTABLE_UNIT_FILTER)
      .is("deleted_at", null)
      .neq("status", "deleted")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter(isSelectableUnit)
      .map((unit: any) => mapUnitForClient(unit, "REQUESTABLE", false));
  });

export const listMyUnitAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("unit_access_requests")
      .select(`id, unit_id, requested_role, status, note, review_notes, created_at, updated_at, resolved_at, units(${SELECTABLE_UNIT_FILTER})`)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      ...row,
      unit: row.units ? mapUnitForClient(row.units, "REQUESTED", false) : null,
    }));
  });

export const submitUnitAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    unit_id: z.string().uuid(),
    requested_role: z.enum(["UNIT_USER", "LOGISTICS_NCO", "WORK_MANAGER", "UNIT_ADMIN"]).default("UNIT_USER"),
    note: z.string().trim().max(500).optional().default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const cooldownHours = 24;
    const { data: unit } = await supabaseAdmin
      .from("units")
      .select("id, active, status, deleted_at")
      .eq("id", data.unit_id)
      .maybeSingle();
    if (!isSelectableUnit(unit)) throw new Error("×”×™×—×™×“×” ×œ× ×–×ž×™× ×” ×œ×‘×§×©×ª ×’×™×©×”");
    const { data: existingMembership } = await supabaseAdmin
      .from("unit_memberships")
      .select("id")
      .eq("user_id", context.userId)
      .eq("unit_id", data.unit_id)
      .eq("is_active", true)
      .maybeSingle();
    if (existingMembership?.id) return { ok: true, already_member: true };

    const { data: existingRequest, error: existingError } = await supabaseAdmin
      .from("unit_access_requests")
      .select("id, status, created_at, updated_at, resolved_at, review_notes")
      .eq("unit_id", data.unit_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    if (existingRequest?.status === "pending") {
      await supabaseAdmin.from("audit_log").insert({
        action_type: "UNIT_ACCESS_REQUEST_DUPLICATE_BLOCKED",
        target_type: "unit_access_request",
        target_id: existingRequest.id,
        performed_by_user_id: context.userId,
        new_value: { unit_id: data.unit_id, status: "pending" },
      } as any);
      return { ok: true, status: "pending", request: existingRequest, duplicate_blocked: true };
    }

    if (existingRequest?.status === "approved") {
      return { ok: true, already_member: true, status: "approved", request: existingRequest };
    }

    if (existingRequest?.status === "rejected") {
      const rejectedAt = new Date(existingRequest.resolved_at ?? existingRequest.updated_at ?? existingRequest.created_at);
      const retryAt = new Date(rejectedAt.getTime() + cooldownHours * 60 * 60 * 1000);
      if (retryAt > now) {
        return { ok: false, status: "rejected_cooldown", request: existingRequest, retry_at: retryAt.toISOString() };
      }
      const { error } = await supabaseAdmin
        .from("unit_access_requests")
        .update({
          requested_role: data.requested_role,
          note: data.note || null,
          status: "pending",
          resolved_by: null,
          resolved_at: null,
          updated_at: now.toISOString(),
        })
        .eq("id", existingRequest.id)
        .eq("unit_id", data.unit_id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true, status: "pending", request: { ...existingRequest, status: "pending" } };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("unit_access_requests")
      .insert({
        unit_id: data.unit_id,
        user_id: context.userId,
        requested_role: data.requested_role,
        note: data.note || null,
        status: "pending",
        updated_at: now.toISOString(),
      })
      .select("id, status, created_at")
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      action_type: "UNIT_ACCESS_REQUEST_SUBMITTED",
      target_type: "unit_access_request",
      target_id: inserted?.id,
      performed_by_user_id: context.userId,
      new_value: { unit_id: data.unit_id, requested_role: data.requested_role },
    } as any);
    return { ok: true, status: "pending", request: inserted };
  });

export const listUnitAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const active = await assertActiveUnit(supabaseAdmin, context.userId);
    if (!UNIT_USER_MANAGER_ROLES.has(active.role)) throw new Error("אין הרשאה לנהל בקשות גישה ביחידה הזו");
    const { data: requests, error } = await supabaseAdmin
      .from("unit_access_requests")
      .select("id, unit_id, user_id, requested_role, note, status, created_at, updated_at, resolved_at, resolved_by, review_notes")
      .eq("unit_id", active.unitId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const userIds = Array.from(new Set((requests ?? []).map((r: any) => r.user_id)));
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const userById = new Map((authUsers?.users ?? []).filter((u: any) => userIds.includes(u.id)).map((u: any) => [u.id, u]));
    const resolverIds = Array.from(new Set((requests ?? []).map((r: any) => r.resolved_by).filter(Boolean)));
    const resolverById = new Map((authUsers?.users ?? []).filter((u: any) => resolverIds.includes(u.id)).map((u: any) => [u.id, u]));
    return (requests ?? []).map((r: any) => {
      const u: any = userById.get(r.user_id);
      const resolver: any = r.resolved_by ? resolverById.get(r.resolved_by) : null;
      const md = u?.user_metadata ?? {};
      return {
        ...r,
        email: u?.email ?? "",
        display_name: md.full_name || md.name || u?.email?.split("@")[0] || "",
        provider: u?.app_metadata?.provider || "email",
        resolved_by_email: resolver?.email ?? null,
      };
    });
  });

export const resolveUnitAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    request_id: z.string().uuid(),
    decision: z.enum(["approved", "rejected"]),
    role: z.enum(["UNIT_USER", "LOGISTICS_NCO", "WORK_MANAGER", "UNIT_ADMIN"]).default("UNIT_USER"),
    team_id: z.string().uuid().nullable().optional(),
    review_notes: z.string().trim().max(500).optional().default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const active = await assertActiveUnit(supabaseAdmin, context.userId);
    if (!UNIT_USER_MANAGER_ROLES.has(active.role)) throw new Error("אין הרשאה לנהל בקשות גישה ביחידה הזו");
    const { data: request, error: requestError } = await supabaseAdmin
      .from("unit_access_requests")
      .select("*")
      .eq("id", data.request_id)
      .eq("unit_id", active.unitId)
      .maybeSingle();
    if (requestError) throw new Error(requestError.message);
    if (!request) throw new Error("×‘×§×©×ª ×”×’×™×©×” ×œ× × ×ž×¦××” ×‘×™×—×™×“×” ×”×¤×¢×™×œ×”");
    if (data.team_id) {
      const { data: team } = await supabaseAdmin
        .from("teams")
        .select("id, unit_id, active")
        .eq("id", data.team_id)
        .maybeSingle();
      if (!team?.active || team.unit_id !== active.unitId) throw new Error("×”×¦×•×•×ª ×œ× ×©×™×™×š ×œ×™×—×™×“×” ×”×¤×¢×™×œ×”");
    }
    const now = new Date().toISOString();
    if (data.decision === "approved") {
      await supabaseAdmin.from("unit_memberships").upsert({
        user_id: request.user_id,
        unit_id: active.unitId,
        role: data.role,
        is_active: true,
        updated_at: now,
      }, { onConflict: "user_id,unit_id" });
      if (data.team_id) {
        await supabaseAdmin.from("team_memberships").upsert({
          user_id: request.user_id,
          unit_id: active.unitId,
          team_id: data.team_id,
          role: data.role === "UNIT_USER" ? "RASP" : "TEAM_MANAGER",
          is_active: true,
          updated_at: now,
        }, { onConflict: "user_id,team_id" });
        await supabaseAdmin.from("team_members").upsert({
          user_id: request.user_id,
          team_id: data.team_id,
          role: data.role === "UNIT_USER" ? "USER" : "ADMIN",
          is_active: true,
          updated_at: now,
        }, { onConflict: "user_id" });
      }
    }
    const { error } = await supabaseAdmin
      .from("unit_access_requests")
      .update({
        status: data.decision,
        resolved_by: context.userId,
        resolved_at: now,
        review_notes: data.review_notes || null,
        updated_at: now,
      })
      .eq("id", data.request_id)
      .eq("unit_id", active.unitId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      action_type: data.decision === "approved" ? "UNIT_ACCESS_REQUEST_APPROVED" : "UNIT_ACCESS_REQUEST_REJECTED",
      target_type: "unit_access_request",
      target_id: data.request_id,
      performed_by_user_id: context.userId,
      new_value: {
        unit_id: active.unitId,
        target_user_id: request.user_id,
        role: data.role,
        team_id: data.team_id ?? null,
        review_notes: data.review_notes || null,
      },
    } as any);
    return { ok: true };
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
    if (!row?.active || row.unit_id !== active.unitId) throw new Error("×¦×•×•×ª ×œ× ×ª×§×™×Ÿ");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const currentRole = await getGlobalUserRole(context.userId);
    const active = currentRole === "OWNER" ? null : await assertActiveUnit(supabaseAdmin, context.userId);
    if (active && !UNIT_USER_MANAGER_ROLES.has(active.role)) throw new Error("פעולה זו זמינה למנהלי משתמשים ביחידה בלבד");

    if (data.team_id === null) {
      if (active) {
        await supabaseAdmin.from("team_memberships").delete().eq("user_id", data.user_id).eq("unit_id", active.unitId);
        const { data: existingUnitMembership } = await supabaseAdmin
          .from("unit_memberships")
          .select("role")
          .eq("user_id", data.user_id)
          .eq("unit_id", active.unitId)
          .maybeSingle();
        if (!existingUnitMembership) {
          await supabaseAdmin.from("unit_memberships").upsert({
            user_id: data.user_id,
            unit_id: active.unitId,
            role: "UNIT_USER",
            is_active: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,unit_id" });
        }
        await supabaseAdmin.from("audit_log").insert({
          action_type: "TEAM_ASSIGNMENT_REMOVED",
          target_type: "team_membership",
          target_id: data.user_id,
          performed_by_user_id: context.userId,
          new_value: { unit_id: active.unitId, team_id: null },
        } as any);
      } else {
        await supabaseAdmin.from("team_members").delete().eq("user_id", data.user_id);
        await supabaseAdmin.from("team_memberships").delete().eq("user_id", data.user_id);
      }
      return { ok: true };
    }

    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("id, unit_id, active")
      .eq("id", data.team_id)
      .maybeSingle();
    if (!team?.active) throw new Error("צוות לא תקין");
    if (active && team.unit_id !== active.unitId) throw new Error("אין הרשאה לעדכן צוות ביחידה אחרת");

    const { data: existingUnitMembership } = await supabaseAdmin
      .from("unit_memberships")
      .select("role")
      .eq("user_id", data.user_id)
      .eq("unit_id", team.unit_id)
      .maybeSingle();
    if (!existingUnitMembership) {
      await supabaseAdmin
        .from("unit_memberships")
        .upsert({
          user_id: data.user_id,
          unit_id: team.unit_id,
          role: "UNIT_USER",
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,unit_id" });
    }
    await supabaseAdmin
      .from("team_memberships")
      .upsert({
        user_id: data.user_id,
        unit_id: team.unit_id,
        team_id: data.team_id,
        role: "RASP",
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,team_id" });
    await supabaseAdmin
      .from("team_members")
      .upsert({
        user_id: data.user_id,
        team_id: data.team_id,
        role: "USER",
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    await supabaseAdmin.from("audit_log").insert({
      action_type: "TEAM_ASSIGNMENT_CHANGED",
      target_type: "team_membership",
      target_id: data.user_id,
      performed_by_user_id: context.userId,
      new_value: { unit_id: team.unit_id, team_id: data.team_id },
    } as any);
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
