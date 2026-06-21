export type RoleCode = "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER";

export const ROLE_LEVEL: Record<RoleCode, number> = {
  OWNER: 100,
  WORK_MANAGER: 80,
  ADMIN: 50,
  USER: 10,
};

export const ROLE_LABEL: Record<RoleCode, string> = {
  OWNER: "בעלים",
  WORK_MANAGER: "מנהל עבודה",
  ADMIN: "נגד לוגיסטיקה",
  USER: "משתמש",
};

export async function getUserRole(userId: string): Promise<RoleCode> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw new Error(error.message);

  let highest: RoleCode = "USER";
  for (const row of data ?? []) {
    const raw = String(row.role || "").toUpperCase();
    const role: RoleCode =
      raw === "OWNER" ? "OWNER" :
      raw === "WORK_MANAGER" ? "WORK_MANAGER" :
      raw === "ADMIN" || raw === "STAFF" ? "ADMIN" :
      "USER";
    if (ROLE_LEVEL[role] > ROLE_LEVEL[highest]) highest = role;
  }
  return highest;
}

export async function assertMinRole(userId: string, minimum: Exclude<RoleCode, "USER">) {
  const role = await getUserRole(userId);
  if (ROLE_LEVEL[role] < ROLE_LEVEL[minimum]) throw new Error("אין הרשאה לפעולה זו");
  return role;
}

export async function assertOwner(userId: string) {
  const role = await getUserRole(userId);
  if (role !== "OWNER") throw new Error("פעולה זו זמינה לבעלים בלבד");
  return role;
}
