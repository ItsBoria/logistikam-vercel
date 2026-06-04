import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_EMAIL_DOMAIN = "admins.local";
const usernameSchema = z.string().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/, "שם משתמש לא תקין");

function synthEmail(username: string) {
  return `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
}

export const adminAuthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
  return { needsBootstrap: (count ?? 0) === 0 };
});

// Resolves a username to the actual email used by Supabase Auth.
// Tries synthetic `<username>@admins.local` first, then falls back to any
// existing admin whose email local-part matches the username (legacy admins).
export const resolveAdminEmail = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ username: usernameSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wanted = data.username.trim().toLowerCase();
    const synth = synthEmail(wanted);

    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const users = list?.users ?? [];

    // 1) exact synthetic match
    const direct = users.find((u) => (u.email || "").toLowerCase() === synth);
    if (direct) return { email: direct.email! };

    // 2) legacy admin: match by local-part among users who have admin role
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    const adminIds = new Set((roles ?? []).map((r: any) => r.user_id));
    const legacy = users.find((u) => adminIds.has(u.id) && ((u.email || "").split("@")[0] || "").toLowerCase() === wanted);
    if (legacy) return { email: legacy.email! };

    return { email: null as string | null };
  });

export const bootstrapAdminUsername = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      username: usernameSchema,
      password: z.string().min(8).max(72),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("מנהל ראשי כבר קיים");

    const email = synthEmail(data.username);
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const existing = list.users.find((u) => (u.email || "").toLowerCase() === email);
    let userId: string;
    if (existing) {
      userId = existing.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        email_confirm: true,
      });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
      });
      if (error || !created.user) throw new Error(error?.message || "שגיאה ביצירת משתמש");
      userId = created.user.id;
    }
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (roleErr) throw new Error(roleErr.message);
    return { email };
  });
