export type FunctionRoleCode = "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER";

const FUNCTION_ROLE_LEVEL: Record<FunctionRoleCode, number> = {
  OWNER: 100,
  WORK_MANAGER: 50,
  ADMIN: 50,
  USER: 10,
};

export async function getFunctionUserRole(userId: string): Promise<FunctionRoleCode> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw new Error(error.message);

  let highest: FunctionRoleCode = "USER";
  for (const row of data ?? []) {
    const raw = String((row as any).role || "").toUpperCase();
    const role: FunctionRoleCode =
      raw === "OWNER" ? "OWNER" :
      raw === "WORK_MANAGER" ? "WORK_MANAGER" :
      raw === "ADMIN" || raw === "STAFF" ? "ADMIN" :
      "USER";
    if (FUNCTION_ROLE_LEVEL[role] > FUNCTION_ROLE_LEVEL[highest]) highest = role;
  }
  return highest;
}

export async function assertFunctionMinRole(userId: string, minimum: Exclude<FunctionRoleCode, "USER">) {
  const role = await getFunctionUserRole(userId);
  if (FUNCTION_ROLE_LEVEL[role] >= FUNCTION_ROLE_LEVEL[minimum]) return role;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: unitRoles } = await supabaseAdmin
    .from("unit_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);

  const hasUnitAdmin = (unitRoles ?? []).some((row: any) =>
    ["PLATFORM_OWNER", "UNIT_OWNER", "UNIT_ADMIN", "WORK_MANAGER", "LOGISTICS_NCO"].includes(String(row.role)),
  );
  const hasUnitOwner = (unitRoles ?? []).some((row: any) =>
    ["PLATFORM_OWNER", "UNIT_OWNER", "WORK_MANAGER"].includes(String(row.role)),
  );
  const unitRole: FunctionRoleCode = hasUnitOwner ? "WORK_MANAGER" : hasUnitAdmin ? "ADMIN" : "USER";
  if (FUNCTION_ROLE_LEVEL[unitRole] < FUNCTION_ROLE_LEVEL[minimum]) throw new Error("אין הרשאה לפעולה זו");
  return unitRole;
}

export async function assertFunctionOwner(userId: string) {
  const role = await getFunctionUserRole(userId);
  if (role !== "OWNER") throw new Error("פעולה זו זמינה לבעלים בלבד");
  return role;
}
