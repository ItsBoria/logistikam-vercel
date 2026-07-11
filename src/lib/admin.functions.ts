import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { resolveActiveAdminUnitId } from "./membership.functions";

const BUCKET = "product-images";
const SIGN_TTL = 60 * 60 * 24 * 7;

async function resolveImage(supabaseAdmin: any, url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("storage:")) {
    const path = url.slice("storage:".length);
    const { data } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGN_TTL);
    return data?.signedUrl ?? null;
  }
  return url;
}

// ---- Authenticated admin helpers ----
type LocalRoleCode = "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER";

async function getLocalUserRole(userId: string): Promise<LocalRoleCode> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  const level: Record<LocalRoleCode, number> = { OWNER: 100, WORK_MANAGER: 50, ADMIN: 50, USER: 10 };
  let highest: LocalRoleCode = "USER";
  for (const row of data ?? []) {
    const raw = String((row as any).role || "").toUpperCase();
    const role: LocalRoleCode =
      raw === "OWNER" ? "OWNER" :
      raw === "WORK_MANAGER" ? "WORK_MANAGER" :
      raw === "ADMIN" || raw === "STAFF" ? "ADMIN" :
      "USER";
    if (level[role] > level[highest]) highest = role;
  }
  return highest;
}

async function assertMinRole(userId: string, minimum: Exclude<LocalRoleCode, "USER">) {
  const role = await getLocalUserRole(userId);
  const level: Record<LocalRoleCode, number> = { OWNER: 100, WORK_MANAGER: 50, ADMIN: 50, USER: 10 };
  if (level[role] >= level[minimum]) return role;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: unitRoles } = await supabaseAdmin
    .from("unit_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);
  const hasUnitAdmin = (unitRoles ?? []).some((r: any) =>
    ["PLATFORM_OWNER", "UNIT_OWNER", "UNIT_ADMIN", "WORK_MANAGER", "LOGISTICS_NCO"].includes(String(r.role)),
  );
  const hasWorkManager = (unitRoles ?? []).some((r: any) =>
    ["PLATFORM_OWNER", "UNIT_OWNER", "WORK_MANAGER"].includes(String(r.role)),
  );
  const unitRole: LocalRoleCode = hasWorkManager ? "WORK_MANAGER" : hasUnitAdmin ? "ADMIN" : "USER";
  if (level[unitRole] < level[minimum]) throw new Error("אין הרשאה לפעולה זו");
  return unitRole;
}

async function assertOwner(userId: string) {
  const role = await getLocalUserRole(userId);
  if (role !== "OWNER") throw new Error("פעולה זו זמינה לבעלים בלבד");
  return role;
}

async function assertAdmin(userId: string) {
  return assertMinRole(userId, "ADMIN");
}

async function assertAdminOrStaff(userId: string) {
  return assertMinRole(userId, "ADMIN");
}

async function getAdminTeamScope(supabaseAdmin: any, userId: string, mode: "read" | "write" = "read") {
  const role = await assertAdminOrStaff(userId);
  const { data: activeMembership } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (activeMembership?.team_id) return activeMembership.team_id as string;
  if (role === "OWNER") {
    throw new Error("יש לבחור יחידה פעילה לפני צפייה או עריכה של נתוני יחידה.");
  }
  throw new Error(mode === "write"
    ? "לא משויכת לך יחידה פעילה לעריכת נתונים."
    : "לא משויכת לך יחידה פעילה לצפייה בנתונים.");

  if (role === "ADMIN") {
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (!membership?.team_id) {
      throw new Error("לא משויך לך צוות פעיל. בעל מערכת צריך לשייך אותך ליחידה.");
    }
    return membership.team_id as string;
  }

  if (mode === "write") {
    const { data: membership } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (membership?.team_id) return membership.team_id as string;

    const { data: firstTeam } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!firstTeam?.id) throw new Error("צריך ליצור יחידה לפני הוספת פריטים.");
    return firstTeam.id as string;
  }

  return null;
}

function scopeByTeam(query: any, teamId: string | null) {
  return teamId ? query.eq("team_id", teamId) : query;
}

async function getAdminUnitScope(supabaseAdmin: any, userId: string) {
  await assertAdminOrStaff(userId);
  return resolveActiveAdminUnitId(supabaseAdmin, userId);
}

function scopeByUnit(query: any, unitId: string) {
  return query.eq("unit_id", unitId);
}

async function getOrderInActiveUnit(supabaseAdmin: any, userId: string, orderId: string, select = "*, order_items(*)") {
  const unitId = await getAdminUnitScope(supabaseAdmin, userId);
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(select)
    .eq("id", orderId)
    .eq("unit_id", unitId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("הזמנה לא נמצאה ביחידה הפעילה");
  return { order, unitId };
}

async function getLegacyCatalogTeamId(supabaseAdmin: any, unitId: string) {
  const { data: team } = await supabaseAdmin
    .from("teams")
    .select("id")
    .eq("unit_id", unitId)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!team?.id) throw new Error("צריך ליצור לפחות צוות אחד ביחידה לפני ניהול קטלוג");
  return team.id as string;
}

// Low-stock check + admin push notification. Best-effort.
async function maybeNotifyLowStock(supabaseAdmin: any, productId: string, prevStock: number) {
  try {
    const { data: prod } = await supabaseAdmin
      .from("products").select("id, name, stock, low_stock_threshold, active").eq("id", productId).maybeSingle();
    if (!prod || !prod.active) return;
    const { data: settingRow } = await supabaseAdmin
      .from("app_settings").select("value").eq("key", "default_low_stock_threshold").maybeSingle();
    const defaultThreshold = Number((settingRow?.value as any) ?? 5);
    const threshold = prod.low_stock_threshold ?? defaultThreshold;
    if (prevStock > threshold && prod.stock <= threshold) {
      const { sendPushToAdmins } = await import("./admin-push.server");
      await sendPushToAdmins("low_stock", {
        title: prod.stock === 0 ? "מוצר אזל מהמלאי" : "התראת מלאי נמוך",
        body: `${prod.name} — נשאר ${prod.stock} (סף ${threshold})`,
        url: "/admin/notifications",
      });
    }
  } catch (e: any) {
    console.warn("[low stock notify] failed:", e?.message);
  }
}

// Admin user management
export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const activeUnitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const { data: unitMemberships } = await supabaseAdmin
      .from("unit_memberships")
      .select("user_id, role, is_active, created_at, updated_at")
      .eq("unit_id", activeUnitId);
    const { data: teamMemberships } = await supabaseAdmin
      .from("team_memberships")
      .select("user_id, team_id, role, is_active, created_at, teams(id, name, unit_id)")
      .eq("unit_id", activeUnitId);
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const userIds = Array.from(new Set([
      ...(unitMemberships ?? []).map((r: any) => r.user_id),
      ...(teamMemberships ?? []).map((r: any) => r.user_id),
    ]));
    const { data: profs } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, is_approver, is_active").in("id", userIds)
      : { data: [] as any[] };
    const approverMap = new Map<string, boolean>((profs ?? []).map((p: any) => [p.id, !!p.is_approver]));
    const activeProfileMap = new Map<string, boolean>((profs ?? []).map((p: any) => [p.id, p.is_active !== false]));
    const byUser = new Map<string, { roles: string[]; unit_active: boolean; created_at: string; teams: any[] }>();
    for (const r of unitMemberships ?? []) {
      const row = r as any;
      const cur = byUser.get(row.user_id) ?? { roles: [] as string[], unit_active: false, created_at: row.created_at as string, teams: [] as any[] };
      cur.roles.push(row.role as string);
      cur.unit_active = cur.unit_active || row.is_active !== false;
      if (new Date(row.created_at) < new Date(cur.created_at)) cur.created_at = row.created_at;
      byUser.set(row.user_id, cur);
    }
    for (const membership of teamMemberships ?? []) {
      const row = membership as any;
      const cur = byUser.get(row.user_id) ?? { roles: ["UNIT_USER"], unit_active: false, created_at: row.created_at as string, teams: [] as any[] };
      if (!cur.roles.length) cur.roles.push("UNIT_USER");
      if (row.is_active !== false && row.teams?.unit_id === activeUnitId) {
        cur.teams.push({ id: row.team_id, name: row.teams?.name ?? "", role: row.role ?? "TEAM_MEMBER", is_active: row.is_active !== false });
      }
      if (new Date(row.created_at) < new Date(cur.created_at)) cur.created_at = row.created_at;
      byUser.set(row.user_id, cur);
    }
    const normalizeRole = (role: string) =>
      role === "OWNER" || role === "PLATFORM_OWNER" || role === "UNIT_OWNER" || role === "WORK_MANAGER"
        ? "WORK_MANAGER"
        : role === "UNIT_ADMIN" || role === "LOGISTICS_NCO" || role === "ADMIN"
          ? "ADMIN"
          : "USER";
    return Array.from(byUser.entries()).map(([userId, info]) => {
      const u = list.users.find(x => x.id === userId);
      const sortedRoles = info.roles.sort((a, b) => {
        const level: Record<string, number> = { OWNER: 100, PLATFORM_OWNER: 100, UNIT_OWNER: 90, WORK_MANAGER: 80, UNIT_ADMIN: 70, ADMIN: 50, LOGISTICS_NCO: 50 };
        return (level[b] ?? 0) - (level[a] ?? 0);
      });
      return {
        user_id: userId,
        email: u?.email ?? "(לא ידוע)",
        username: (u?.user_metadata as any)?.username ?? null,
        roles: sortedRoles.map(normalizeRole),
        current_role: normalizeRole(sortedRoles[0] ?? "USER"),
        is_admin: sortedRoles.some((role) => ["PLATFORM_OWNER", "UNIT_OWNER", "UNIT_ADMIN", "WORK_MANAGER", "LOGISTICS_NCO"].includes(role)),
        unit_roles: sortedRoles,
        unit_active: info.unit_active,
        team_id: info.teams[0]?.id ?? null,
        team_name: info.teams[0]?.name ?? null,
        teams: info.teams,
        is_staff: false,
        is_approver: approverMap.get(userId) ?? false,
        created_at: info.created_at,
      };
    }).filter((row) => activeProfileMap.get(row.user_id) !== false);
  });
export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    email: z.string().email(),
    username: z.string().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/, "שם משתמש לא תקין"),
    password: z.string().min(8).max(72),
    role: z.enum(["WORK_MANAGER", "ADMIN", "USER"]).default("ADMIN"),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actorGlobalRole = await getLocalUserRole(context.userId);
    let activeUnitId: string | null = null;
    try {
      activeUnitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    } catch (e) {
      if (actorGlobalRole !== "OWNER") throw e;
    }
    if (activeUnitId) {
      const { data: actorMembership } = await supabaseAdmin
        .from("unit_memberships")
        .select("role")
        .eq("user_id", context.userId)
        .eq("unit_id", activeUnitId)
        .eq("is_active", true)
        .maybeSingle();
      if (!["UNIT_OWNER", "UNIT_ADMIN", "PLATFORM_OWNER"].includes(String(actorMembership?.role ?? ""))) {
        throw new Error("אין הרשאה להוסיף משתמשים ביחידה הזו");
      }
    } else {
      await assertOwner(context.userId);
    }

    const usernameLower = data.username.trim().toLowerCase();
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();

    // Ensure username is unique across users
    const usernameTaken = list.users.find(
      (u) => ((u.user_metadata as any)?.username || "").toString().toLowerCase() === usernameLower
        && u.email?.toLowerCase() !== data.email.toLowerCase(),
    );
    if (usernameTaken) throw new Error("שם המשתמש כבר תפוס");

    let userId = list.users.find(u => u.email?.toLowerCase() === data.email.toLowerCase())?.id;
    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { username: usernameLower },
      });
      if (error || !created.user) throw new Error(error?.message || "שגיאה ביצירת משתמש");
      userId = created.user.id;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        user_metadata: { username: usernameLower },
      });
    }
    if (activeUnitId) {
      const unitRole = data.role === "WORK_MANAGER" ? "WORK_MANAGER" : data.role === "ADMIN" ? "LOGISTICS_NCO" : "UNIT_USER";
      await (supabaseAdmin as any).from("unit_memberships").upsert({
        user_id: userId,
        unit_id: activeUnitId,
        role: unitRole,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,unit_id" });
      await (supabaseAdmin as any).from("audit_log").insert({
        action_type: "UNIT_USER_CREATED",
        target_type: "unit_membership",
        target_id: userId,
        performed_by_user_id: context.userId,
        new_value: { unit_id: activeUnitId, role: unitRole, email: data.email },
      });
    } else {
      const { error: roleError } = await (context.supabase as any).rpc("owner_set_user_role", {
        _target_user_id: userId,
        _role: data.role === "USER" ? "ADMIN" : data.role,
        _active: true,
        _reason: "Created through user management",
      });
      if (roleError) throw new Error(roleError.message);
    }

    // Default notification prefs ON for new admin users
    if (data.role === "ADMIN" || data.role === "WORK_MANAGER") {
      const events = ["order_created", "order_awaiting_approval", "low_stock", "replacement_request"];
      await supabaseAdmin.from("admin_notification_prefs").upsert(
        events.map((e) => ({ user_id: userId!, event_type: e, enabled: true })),
        { onConflict: "user_id,event_type" },
      );
    }
    return { ok: true };
  });

export const updateAdminUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    role: z.enum(["WORK_MANAGER", "ADMIN", "USER"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) {
      throw new Error("לא ניתן לשנות את התפקיד של עצמך");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const viewerRole = await getLocalUserRole(context.userId);
    const unitRoleFromUi = data.role === "WORK_MANAGER" ? "WORK_MANAGER" : data.role === "ADMIN" ? "LOGISTICS_NCO" : "UNIT_USER";
    if (viewerRole === "OWNER") {
      const { data: activeContext } = await (supabaseAdmin as any)
        .from("user_active_contexts")
        .select("active_unit_id")
        .eq("user_id", context.userId)
        .maybeSingle();
      const activeUnitId = activeContext?.active_unit_id as string | null | undefined;
      if (activeUnitId) {
        const { data: currentMembership } = await (supabaseAdmin as any)
          .from("unit_memberships")
          .select("role, is_active")
          .eq("user_id", data.user_id)
          .eq("unit_id", activeUnitId)
          .maybeSingle();
        const { data: teamMembership } = await (supabaseAdmin as any)
          .from("team_memberships")
          .select("id")
          .eq("user_id", data.user_id)
          .eq("unit_id", activeUnitId)
          .limit(1);
        if (currentMembership || (teamMembership ?? []).length > 0) {
          if (currentMembership?.role === "UNIT_OWNER") {
            const { count } = await (supabaseAdmin as any)
              .from("unit_memberships")
              .select("id", { count: "exact", head: true })
              .eq("unit_id", activeUnitId)
              .eq("role", "UNIT_OWNER")
              .eq("is_active", true)
              .neq("user_id", data.user_id);
            if (!count) throw new Error("לא ניתן להסיר את בעל היחידה הפעיל האחרון");
          }
          await (supabaseAdmin as any).from("unit_memberships").upsert({
            user_id: data.user_id,
            unit_id: activeUnitId,
            role: unitRoleFromUi,
            is_active: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,unit_id" });
          await (supabaseAdmin as any).from("audit_log").insert({
            action_type: "UNIT_ROLE_CHANGED",
            target_type: "unit_membership",
            target_id: data.user_id,
            performed_by_user_id: context.userId,
            old_value: { unit_id: activeUnitId, role: currentMembership?.role ?? null },
            new_value: { unit_id: activeUnitId, role: unitRoleFromUi },
          });
          return { ok: true };
        }
      }
      const { error } = await (context.supabase as any).rpc("owner_set_user_role", {
        _target_user_id: data.user_id,
        _role: data.role,
        _active: true,
        _reason: "Role changed through user management",
      });
      if (error) throw new Error(error.message);
    } else {
      const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
      const { data: actorMembership } = await supabaseAdmin
        .from("unit_memberships")
        .select("role")
        .eq("user_id", context.userId)
        .eq("unit_id", unitId)
        .eq("is_active", true)
        .maybeSingle();
      if (!["UNIT_OWNER", "UNIT_ADMIN", "PLATFORM_OWNER"].includes(String(actorMembership?.role ?? ""))) {
        throw new Error("אין הרשאה לנהל תפקידי משתמשים ביחידה הזו");
      }

      const { data: currentMembership } = await supabaseAdmin
        .from("unit_memberships")
        .select("role, is_active")
        .eq("user_id", data.user_id)
        .eq("unit_id", unitId)
        .maybeSingle();
      const { data: teamMembership } = await supabaseAdmin
        .from("team_memberships")
        .select("id")
        .eq("user_id", data.user_id)
        .eq("unit_id", unitId)
        .maybeSingle();
      if (!currentMembership && !teamMembership) {
        throw new Error("המשתמש אינו שייך ליחידה הפעילה");
      }
      if (currentMembership?.role === "UNIT_OWNER") {
        const { count } = await supabaseAdmin
          .from("unit_memberships")
          .select("id", { count: "exact", head: true })
          .eq("unit_id", unitId)
          .eq("role", "UNIT_OWNER")
          .eq("is_active", true)
          .neq("user_id", data.user_id);
        if (!count) throw new Error("לא ניתן להסיר את בעל היחידה הפעיל האחרון");
      }

      await supabaseAdmin.from("unit_memberships").upsert({
        user_id: data.user_id,
        unit_id: unitId,
        role: unitRoleFromUi,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,unit_id" });
      await (supabaseAdmin as any).from("audit_log").insert({
        action_type: "UNIT_ROLE_CHANGED",
        target_type: "unit_membership",
        target_id: data.user_id,
        performed_by_user_id: context.userId,
        old_value: { unit_id: unitId, role: currentMembership?.role ?? null },
        new_value: { unit_id: unitId, role: unitRoleFromUi },
      });
    }
    return { ok: true };
  });
export const searchRegisteredUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ query: z.string().max(200).optional().default("") }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const viewerRole = await getLocalUserRole(context.userId);
    const activeUnitId = viewerRole === "OWNER" ? null : await getAdminUnitScope(supabaseAdmin, context.userId);
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("user_id, role").eq("is_active", true)
      .in("role", ["OWNER", "WORK_MANAGER", "ADMIN"]);
    const roleByUser = new Map<string, "OWNER" | "WORK_MANAGER" | "ADMIN">();
    for (const r of (roles ?? []) as any[]) {
      const cur = roleByUser.get(r.user_id);
      const level: Record<string, number> = { OWNER: 100, WORK_MANAGER: 80, ADMIN: 50 };
      if (!cur || level[r.role] > level[cur]) roleByUser.set(r.user_id, r.role);
    }
    const ids = list.users.map(u => u.id);
    const safeIds = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];
    const { data: profs } = await supabaseAdmin
      .from("profiles").select("id, display_name, is_active").in("id", safeIds);
    const nameById = new Map((profs ?? []).map((p: any) => [p.id, p.display_name as string | null]));
    const activeProfileMap = new Map((profs ?? []).map((p: any) => [p.id, p.is_active !== false]));
    const { data: memberships } = await supabaseAdmin
      .from("team_memberships").select("user_id, team_id, unit_id").in("user_id", safeIds);
    const scopedMemberships = activeUnitId ? (memberships ?? []).filter((m: any) => m.unit_id === activeUnitId) : (memberships ?? []);
    const teamIdByUser = new Map<string, string>(scopedMemberships.map((m: any) => [m.user_id, m.team_id]));
    const teamIds = Array.from(new Set(Array.from(teamIdByUser.values())));
    const { data: teams } = teamIds.length
      ? await supabaseAdmin.from("teams").select("id, name").in("id", teamIds)
      : { data: [] as any[] };
    const teamNameById = new Map((teams ?? []).map((t: any) => [t.id, t.name as string]));
    const { data: unitMembers } = activeUnitId
      ? await supabaseAdmin.from("unit_memberships").select("user_id, role").eq("unit_id", activeUnitId).in("user_id", safeIds)
      : { data: [] as any[] };
    const unitRoleByUser = new Map((unitMembers ?? []).map((m: any) => [m.user_id, m.role as string]));
    const q = data.query.trim().toLowerCase();
    const rows = list.users.map(u => {
      const md = (u.user_metadata as any) || {};
      const displayName = nameById.get(u.id) || md.full_name || md.name || (u.email?.split("@")[0] ?? "");
      const provider = u.app_metadata?.provider || "email";
      const teamId = teamIdByUser.get(u.id) ?? null;
      const unitRole = unitRoleByUser.get(u.id);
      const currentRole = activeUnitId
        ? unitRole === "WORK_MANAGER" || unitRole === "UNIT_OWNER" ? "WORK_MANAGER" : unitRole === "LOGISTICS_NCO" || unitRole === "UNIT_ADMIN" ? "ADMIN" : "USER"
        : (roleByUser.get(u.id) ?? "USER");
      return {
        id: u.id,
        email: u.email ?? "",
        displayName: displayName as string,
        provider: provider as string,
        currentRole: currentRole as "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER",
        team_id: teamId,
        team_name: teamId ? (teamNameById.get(teamId) ?? null) : null,
        created_at: u.created_at,
      };
    }).filter((row) => activeProfileMap.get(row.id) !== false && (!activeUnitId || unitRoleByUser.has(row.id) || teamIdByUser.has(row.id)));
    const filtered = q
      ? rows.filter(r => r.email.toLowerCase().includes(q) || r.displayName.toLowerCase().includes(q))
      : rows;
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return filtered.slice(0, 50);
  });
export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("לא ניתן למחוק את עצמך");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actorGlobalRole = await getLocalUserRole(context.userId);
    if (actorGlobalRole !== "OWNER") {
      const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
      const { data: actorMembership } = await supabaseAdmin
        .from("unit_memberships")
        .select("role")
        .eq("user_id", context.userId)
        .eq("unit_id", unitId)
        .eq("is_active", true)
        .maybeSingle();
      if (!["UNIT_OWNER", "UNIT_ADMIN", "PLATFORM_OWNER"].includes(String(actorMembership?.role ?? ""))) {
        throw new Error("אין הרשאה להסיר משתמשים ביחידה הזו");
      }

      const { data: targetMembership } = await (supabaseAdmin as any)
        .from("unit_memberships")
        .select("id, role, is_active")
        .eq("user_id", data.user_id)
        .eq("unit_id", unitId)
        .maybeSingle();
      if (!targetMembership) throw new Error("המשתמש אינו שייך ליחידה הפעילה");
      if (targetMembership.role === "UNIT_OWNER" && targetMembership.is_active !== false) {
        const { count } = await (supabaseAdmin as any)
          .from("unit_memberships")
          .select("id", { count: "exact", head: true })
          .eq("unit_id", unitId)
          .eq("role", "UNIT_OWNER")
          .eq("is_active", true)
          .neq("user_id", data.user_id);
        if (!count) throw new Error("לא ניתן להסיר את בעל היחידה הפעיל האחרון");
      }

      const deletedAt = new Date().toISOString();
      await (supabaseAdmin as any)
        .from("unit_memberships")
        .update({ is_active: false, updated_at: deletedAt })
        .eq("user_id", data.user_id)
        .eq("unit_id", unitId);
      await (supabaseAdmin as any)
        .from("team_memberships")
        .update({ is_active: false, updated_at: deletedAt })
        .eq("user_id", data.user_id)
        .eq("unit_id", unitId);
      await (supabaseAdmin as any).from("unit_access_requests").update({
        status: "cancelled",
        review_notes: "Cancelled because the user was removed from this Unit.",
        resolved_by: context.userId,
        resolved_at: deletedAt,
        updated_at: deletedAt,
      }).eq("user_id", data.user_id).eq("unit_id", unitId).eq("status", "pending");
      await (supabaseAdmin as any).from("audit_log").insert({
        action_type: "UNIT_USER_DEACTIVATED",
        target_type: "unit_membership",
        target_id: data.user_id,
        performed_by_user_id: context.userId,
        performer_role: actorMembership?.role ?? null,
        old_value: { unit_id: unitId, role: targetMembership.role, is_active: targetMembership.is_active },
        new_value: { unit_id: unitId, is_active: false },
      });
      return { ok: true, auth_deleted: false, deactivated: true, unit_deactivated: true };
    }

    await assertOwner(context.userId);
    const { data: targetRole } = await (supabaseAdmin as any).rpc("current_role_code", { _user_id: data.user_id });
    if (targetRole === "OWNER") throw new Error("לא ניתן למחוק את חשבון הבעלים");

    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    const { data: ownedUnits } = await (supabaseAdmin as any)
      .from("unit_memberships")
      .select("id, unit_id")
      .eq("user_id", data.user_id)
      .eq("role", "UNIT_OWNER")
      .eq("is_active", true);
    for (const membership of ownedUnits ?? []) {
      const { count } = await (supabaseAdmin as any)
        .from("unit_memberships")
        .select("id", { count: "exact", head: true })
        .eq("unit_id", membership.unit_id)
        .eq("role", "UNIT_OWNER")
        .eq("is_active", true)
        .neq("user_id", data.user_id);
      if (!count) {
        throw new Error("לא ניתן למחוק משתמש שהוא בעל היחידה הפעיל האחרון. קודם תמנה בעל יחידה נוסף.");
      }
    }

    const deletedAt = new Date().toISOString();
    await supabaseAdmin.from("profiles").upsert({
      id: data.user_id,
      is_active: false,
      deactivated_at: deletedAt,
      deactivated_by: context.userId,
    } as any);
    await supabaseAdmin.from("user_roles").update({ is_active: false }).eq("user_id", data.user_id);
    await (supabaseAdmin as any).from("unit_memberships").update({ is_active: false, updated_at: deletedAt }).eq("user_id", data.user_id);
    await (supabaseAdmin as any).from("team_memberships").update({ is_active: false, updated_at: deletedAt }).eq("user_id", data.user_id);
    await supabaseAdmin.from("team_members").update({ is_active: false, updated_at: deletedAt }).eq("user_id", data.user_id);
    await (supabaseAdmin as any).from("unit_access_requests").update({
      status: "cancelled",
      review_notes: "Cancelled because the user was deleted by the app owner.",
      resolved_by: context.userId,
      resolved_at: deletedAt,
      updated_at: deletedAt,
    }).eq("user_id", data.user_id).eq("status", "pending");

    let authDeleted = false;
    let deleteError: string | null = null;
    let tombstoneEmail: string | null = null;
    const { error: hardDeleteError } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (hardDeleteError) {
      deleteError = hardDeleteError.message;
      tombstoneEmail = `deleted+${data.user_id}@deleted.logistikam.local`;
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
        email: tombstoneEmail,
        email_confirm: true,
        ban_duration: "876000h",
        user_metadata: {
          ...((targetUser?.user?.user_metadata as any) ?? {}),
          original_email: targetUser?.user?.email ?? null,
          deleted_at: deletedAt,
          deleted_by: context.userId,
        },
      });
      if (banError) throw new Error(banError.message);
    } else {
      authDeleted = true;
    }

    await (supabaseAdmin as any).from("audit_log").insert({
      action_type: authDeleted ? "USER_DELETED" : "USER_DEACTIVATED",
      target_type: "user",
      target_id: data.user_id,
      performed_by_user_id: context.userId,
      performer_role: "OWNER",
      new_value: {
        is_active: false,
        auth_deleted: authDeleted,
        delete_error: deleteError,
        email: targetUser?.user?.email ?? null,
        tombstone_email: tombstoneEmail,
      },
    });
    return { ok: true, auth_deleted: authDeleted, deactivated: !authDeleted };
  });

// Teams (admin-only â€” exposes PIN)
export const listTeams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertMinRole(context.userId, "WORK_MANAGER");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const { data: teams } = await supabaseAdmin.from("teams").select("*").eq("unit_id", unitId).order("created_at", { ascending: false });
    const withSpent = await Promise.all((teams ?? []).map(async (t) => {
      const { data: spent } = await supabaseAdmin.rpc("team_month_spent", { _team_id: t.id });
      return { ...t, monthly_spent: Number(spent ?? 0) };
    }));
    return withSpent;
  });

// Lightweight team list (id+name only) for use in filter dropdowns by staff users.
export const listTeamsBasic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const { data } = await supabaseAdmin.from("teams").select("id, name, active").eq("unit_id", unitId).order("name");
    return data ?? [];
  });

export const upsertTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    pin: z.string().min(4).max(20),
    monthly_limit: z.number().min(0).max(10_000_000),
    contact_phone: z.string().max(20).optional().nullable(),
    active: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertMinRole(context.userId, "WORK_MANAGER");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin.from("teams").update({
        name: data.name, pin: data.pin, monthly_limit: data.monthly_limit,
        contact_phone: data.contact_phone, active: data.active,
      }).eq("id", data.id).eq("unit_id", unitId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("teams").insert({
        unit_id: unitId,
        name: data.name, pin: data.pin, monthly_limit: data.monthly_limit,
        contact_phone: data.contact_phone, active: data.active,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertMinRole(context.userId, "WORK_MANAGER");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin.from("teams").delete().eq("id", data.id).eq("unit_id", unitId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Products
export const listProductsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const { data } = await scopeByUnit(supabaseAdmin.from("products").select("*"), unitId).order("name");
    const resolved = await Promise.all((data ?? []).map(async (p) => ({
      ...p,
      image_url: await resolveImage(supabaseAdmin, p.image_url),
      _raw_image_url: p.image_url, // for editing
    })));
    return resolved;
  });

// Staff-friendly stock-only update. Allows admin OR staff. Fires low-stock notification on cross.
export const updateProductStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    stock: z.number().int().min(0).max(10_000_000),
    low_stock_threshold: z.number().int().min(0).max(10_000_000).nullable().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const { data: prev } = await supabaseAdmin
      .from("products").select("stock, unit_id").eq("id", data.id).maybeSingle();
    if (!prev) throw new Error("×ž×•×¦×¨ ×œ× × ×ž×¦×");
    const update: { stock: number; low_stock_threshold?: number | null } = { stock: data.stock };
    if (prev.unit_id !== unitId) throw new Error("??? ????? ????? ???? ?? ????? ????");
    if (data.low_stock_threshold !== undefined) update.low_stock_threshold = data.low_stock_threshold;
    const { error } = await scopeByUnit(supabaseAdmin.from("products").update(update).eq("id", data.id), unitId);
    if (error) throw new Error(error.message);
    await maybeNotifyLowStock(supabaseAdmin, data.id, Number(prev.stock));
    return { ok: true };
  });

// image_url accepts: empty, http(s)://..., or "storage:<path>"
const imageUrlSchema = z.string().max(2000).optional().nullable().refine(
  (v) => !v || v.startsWith("http://") || v.startsWith("https://") || v.startsWith("storage:"),
  "×›×ª×•×‘×ª ×ª×ž×•× ×” ×œ× ×ª×§×™× ×”"
);

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0).max(10_000_000),
  stock: z.number().int().min(0).max(10_000_000),
  category_id: z.string().uuid(),
  item_code: z.string().trim().max(50).optional().nullable(),
  unit_of_measure: z.string().trim().min(1).max(50).default("×™×—×™×“×”"),
  can_be_ordered: z.boolean().default(true),
  can_be_replacement: z.boolean().default(true),
  maximum_quantity: z.number().int().min(1).max(1_000_000).optional().nullable(),
  image_url: imageUrlSchema,
  active: z.boolean(),
  low_stock_threshold: z.number().int().min(0).max(10_000_000).nullable().optional(),
});

export const listItemCategoriesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const { data, error } = await (supabaseAdmin as any)
      .from("item_categories").select("*").eq("unit_id", unitId).order("display_order").order("name");
    if (error && error.code !== "42P01") throw new Error(error.message);
    return data ?? [];
  });

export const upsertItemCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid().optional(),
    code: z.string().trim().regex(/^[A-Za-z0-9_-]{1,50}$/),
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional().nullable(),
    is_active: z.boolean(),
    display_order: z.number().int().min(0).max(10000),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const legacyTeamId = await getLegacyCatalogTeamId(supabaseAdmin, unitId);
    const payload = { ...data, unit_id: unitId, team_id: legacyTeamId };
    const query = data.id
      ? scopeByUnit((supabaseAdmin as any).from("item_categories").update(payload).eq("id", data.id), unitId)
      : (supabaseAdmin as any).from("item_categories").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- App settings ----
export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("app_settings").select("key, value");
    const map: Record<string, any> = {};
    for (const r of data ?? []) map[r.key] = r.value;
    return {
      default_low_stock_threshold: Number(map.default_low_stock_threshold ?? 5),
    };
  });

export const setDefaultLowStockThreshold = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ value: z.number().int().min(0).max(10_000_000) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: "default_low_stock_threshold", value: data.value, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const legacyTeamId = await getLegacyCatalogTeamId(supabaseAdmin, unitId);
    const { data: category } = await (supabaseAdmin as any)
      .from("item_categories").select("id, name, unit_id").eq("id", data.category_id).maybeSingle();
    if (!category) throw new Error("?? ????? ??????? ??????");
    if (category.unit_id !== unitId) throw new Error("??? ????? ?????? ???????? ?? ????? ????");
    const payload = { ...data, unit_id: unitId, team_id: legacyTeamId, category: category.name, image_url: data.image_url || null };
    if (data.id) {
      const { error } = await scopeByUnit((supabaseAdmin as any).from("products").update(payload).eq("id", data.id), unitId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await (supabaseAdmin as any).from("products").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    filename: z.string().min(1).max(200),
    content_type: z.string().min(1).max(100),
    data_base64: z.string().min(1).max(15_000_000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = (data.filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(data.data_base64, "base64");
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
      contentType: data.content_type, upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGN_TTL);
    return { storage_ref: `storage:${path}`, preview_url: signed?.signedUrl ?? null };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const { error } = await scopeByUnit(supabaseAdmin.from("products").delete().eq("id", data.id), unitId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkImportProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    rows: z.array(z.object({
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      price: z.number().min(0),
      stock: z.number().int().min(0),
      category: z.string().optional().nullable(),
      image_url: z.string().optional().nullable(),
    })).min(1).max(2000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    const legacyTeamId = await getLegacyCatalogTeamId(supabaseAdmin, unitId);
    const { data: categories } = await (supabaseAdmin as any)
      .from("item_categories").select("id, name").eq("is_active", true).eq("unit_id", unitId);
    const byName = new Map<string, any>((categories ?? []).map((category: any) => [category.name.trim().toLowerCase(), category]));
    const payload = data.rows.map((r) => {
      const category = byName.get((r.category ?? "").trim().toLowerCase());
      if (!category) throw new Error(`×”×§×˜×’×•×¨×™×” "${r.category ?? ""}" ××™× ×” ×§×™×™×ž×ª ××• ××™× ×” ×¤×¢×™×œ×”`);
      return {
        name: r.name, description: r.description ?? null,
        price: r.price, stock: r.stock,
        category: category.name,
        category_id: category.id,
        unit_id: unitId,
        team_id: legacyTeamId,
        image_url: r.image_url || null,
        active: true,
        can_be_ordered: true,
        can_be_replacement: true,
      };
    });
    const { error } = await (supabaseAdmin as any).from("products").insert(payload);
    if (error) throw new Error(error.message);
    return { inserted: payload.length };
  });

// Orders
export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    team_id: z.string().uuid().nullable().optional(),
    status: z.string().nullable().optional(),
    from: z.string().nullable().optional(),
    to: z.string().nullable().optional(),
    search: z.string().max(200).nullable().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    if (data.team_id) {
      const { data: team, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("id")
        .eq("id", data.team_id)
        .eq("unit_id", unitId)
        .maybeSingle();
      if (teamError) throw new Error(teamError.message);
      if (!team) throw new Error("הצוות אינו שייך ליחידה הפעילה");
    }
    let q = supabaseAdmin.from("orders").select("*, teams(name), order_items(*)").order("created_at", { ascending: false });
    q = q.eq("unit_id", unitId);
    if (data.team_id) q = q.eq("team_id", data.team_id);
    if (data.status) q = q.eq("status", data.status as any);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    let rows = orders ?? [];
    const search = (data.search ?? "").trim().toLowerCase();
    if (search) {
      rows = rows.filter((o: any) => {
        if (o.id.toLowerCase().startsWith(search)) return true;
        if ((o.teams?.name ?? "").toLowerCase().includes(search)) return true;
        if ((o.ordered_by_name ?? "").toLowerCase().includes(search)) return true;
        if ((o.contact_phone ?? "").toLowerCase().includes(search)) return true;
        if ((o.order_items as any[])?.some((it) => (it.name ?? "").toLowerCase().includes(search))) return true;
        return false;
      });
    }
    return rows;
  });

export const getOrderDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { order } = await getOrderInActiveUnit(
      supabaseAdmin,
      context.userId,
      data.id,
      "*, teams(id, name, monthly_limit), order_items(*)",
    );
    const { data: history } = await supabaseAdmin
      .from("order_status_history").select("*").eq("order_id", data.id).order("created_at", { ascending: true });
    let monthSpent = 0;
    if (order.team_id) {
      const { data: spent } = await supabaseAdmin.rpc("team_month_spent", { _team_id: order.team_id });
      monthSpent = Number(spent ?? 0);
    }
    return { order, history: history ?? [], monthSpent };
  });

export const updateAdminNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    admin_notes: z.string().max(2000).nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { unitId } = await getOrderInActiveUnit(supabaseAdmin, context.userId, data.id, "id, unit_id");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ admin_notes: data.admin_notes })
      .eq("id", data.id)
      .eq("unit_id", unitId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending","approved","preparing","ready","completed","cancelled","awaiting_approval"]),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { order: prev, unitId } = await getOrderInActiveUnit(
      supabaseAdmin,
      context.userId,
      data.id,
      "*, order_items(*), teams(name)",
    );

    // If approving an awaiting_approval order, deduct stock now
    if (prev.status === "awaiting_approval" && data.status !== "awaiting_approval" && data.status !== "cancelled") {
      for (const it of prev.order_items as any[]) {
        if (!it.product_id) continue;
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", it.product_id)
          .eq("unit_id", unitId)
          .maybeSingle();
        if (prod) {
          await supabaseAdmin
            .from("products")
            .update({ stock: Math.max(0, prod.stock - it.quantity) })
            .eq("id", it.product_id)
            .eq("unit_id", unitId);
          await maybeNotifyLowStock(supabaseAdmin, it.product_id, Number(prod.stock));
        }
      }
    }
    // If cancelling a previously stock-deducted order, restore stock
    if (data.status === "cancelled" && prev.status !== "awaiting_approval" && prev.status !== "cancelled") {
      for (const it of prev.order_items as any[]) {
        if (!it.product_id) continue;
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", it.product_id)
          .eq("unit_id", unitId)
          .maybeSingle();
        if (prod) {
          await supabaseAdmin
            .from("products")
            .update({ stock: prod.stock + it.quantity })
            .eq("id", it.product_id)
            .eq("unit_id", unitId);
        }
      }
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("unit_id", unitId);
    if (error) throw new Error(error.message);

    // Notify when status becomes "ready"
    if (data.status === "ready") {
      const teamName = (prev as any).teams?.name ?? "";
      const text = `×”×”×–×ž× ×” ×©×œ ${teamName} ×ž×•×›× ×” ×œ××™×¡×•×£. ×¡×”"×›: â‚ª${prev.total}`;
      if (prev.contact_phone) {
        const { sendSms } = await import("./sms.server");
        await sendSms(prev.contact_phone, text).catch((e) => console.warn("[sms] failed:", e?.message));
      }
      const { sendPushToTeam } = await import("./push.server");
      await sendPushToTeam(prev.team_id, {
        title: "×”×”×–×ž× ×” ×ž×•×›× ×” ×œ××™×¡×•×£ ðŸŽ‰",
        body: text,
        url: "/shop/orders",
      }).catch((e) => console.warn("[push] failed:", e?.message));
    }
    return { ok: true };
  });

const orderItemEditSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  price: z.number().min(0).max(10_000_000),
  quantity: z.number().int().min(1).max(999),
});

export const updateOrderItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    order_id: z.string().uuid(),
    items: z.array(orderItemEditSchema).min(1).max(200),
    notes: z.string().max(500).optional().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminOrStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { order: prev, unitId } = await getOrderInActiveUnit(
      supabaseAdmin,
      context.userId,
      data.order_id,
      "*, order_items(*)",
    );

    const wasStockDeducted = prev.status !== "awaiting_approval" && prev.status !== "cancelled";

    // Restore stock for previous items if needed
    if (wasStockDeducted) {
      for (const it of prev.order_items as any[]) {
        if (!it.product_id) continue;
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", it.product_id)
          .eq("unit_id", unitId)
          .maybeSingle();
        if (prod) {
          await supabaseAdmin
            .from("products")
            .update({ stock: prod.stock + it.quantity })
            .eq("id", it.product_id)
            .eq("unit_id", unitId);
        }
      }
    }

    const productIds = Array.from(new Set(data.items.map((item) => item.product_id).filter(Boolean))) as string[];
    if (productIds.length) {
      const { data: products, error: productError } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("unit_id", unitId)
        .in("id", productIds);
      if (productError) throw new Error(productError.message);
      if ((products ?? []).length !== productIds.length) {
        throw new Error("אחד המוצרים אינו שייך ליחידה הפעילה");
      }
    }

    // Delete all old items
    await supabaseAdmin.from("order_items").delete().eq("order_id", data.order_id);

    // Insert new items + recompute total
    let total = 0;
    const newItems = data.items.map(it => {
      total += Number(it.price) * it.quantity;
      return {
        order_id: data.order_id,
        product_id: it.product_id ?? null,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
      };
    });
    const { error: insErr } = await supabaseAdmin.from("order_items").insert(newItems);
    if (insErr) throw new Error(insErr.message);

    // Re-deduct stock if needed
    if (wasStockDeducted) {
      for (const it of newItems) {
        if (!it.product_id) continue;
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", it.product_id)
          .eq("unit_id", unitId)
          .maybeSingle();
        if (prod) {
          await supabaseAdmin
            .from("products")
            .update({ stock: Math.max(0, prod.stock - it.quantity) })
            .eq("id", it.product_id)
            .eq("unit_id", unitId);
          await maybeNotifyLowStock(supabaseAdmin, it.product_id, Number(prod.stock));
        }
      }
    }

    const { error: updErr } = await supabaseAdmin.from("orders").update({
      total,
      notes: data.notes ?? prev.notes,
    }).eq("id", data.order_id).eq("unit_id", unitId);
    if (updErr) throw new Error(updErr.message);

    return { ok: true, total };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { unitId } = await getOrderInActiveUnit(supabaseAdmin, context.userId, data.id, "id, unit_id");
    await supabaseAdmin.from("order_items").delete().eq("order_id", data.id);
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", data.id).eq("unit_id", unitId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOldOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    before: z.string().min(1),
    only_completed: z.boolean().optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const unitId = await getAdminUnitScope(supabaseAdmin, context.userId);
    let q = supabaseAdmin.from("orders").select("id").eq("unit_id", unitId).lt("created_at", data.before);
    if (data.only_completed) q = q.in("status", ["completed", "cancelled"]);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r: any) => r.id);
    if (!ids.length) return { deleted: 0 };
    await supabaseAdmin.from("order_items").delete().in("order_id", ids);
    const { error: delErr } = await supabaseAdmin.from("orders").delete().eq("unit_id", unitId).in("id", ids);
    if (delErr) throw new Error(delErr.message);
    return { deleted: ids.length };
  });
