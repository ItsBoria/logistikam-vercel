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
  const { data, error } = await (supabaseAdmin as any).rpc("current_role_code", { _user_id: userId });
  if (error) throw new Error(error.message);
  const value = String(data || "USER").toUpperCase();
  if (value === "OWNER" || value === "WORK_MANAGER" || value === "ADMIN") return value;
  return "USER";
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
