import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_EMAIL_DOMAIN = "admins.local";
const identifierSchema = z.string().min(2).max(254);

function synthEmail(username: string) {
  return `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
}

export const adminAuthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
  return { needsBootstrap: (count ?? 0) === 0 };
});

// Resolves either an email or a username to the actual auth email.
export const resolveAdminEmail = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ identifier: identifierSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const raw = data.identifier.trim();
    const lower = raw.toLowerCase();

    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const users = list?.users ?? [];

    // Direct email match
    if (lower.includes("@")) {
      const found = users.find((u) => (u.email || "").toLowerCase() === lower);
      return { email: found?.email ?? null };
    }

    // Synthetic <username>@admins.local
    const synth = synthEmail(lower);
    const direct = users.find((u) => (u.email || "").toLowerCase() === synth);
    if (direct) return { email: direct.email! };

    // user_metadata.username match (admins created with real email + username)
    const byMeta = users.find(
      (u) => ((u.user_metadata as any)?.username || "").toString().toLowerCase() === lower,
    );
    if (byMeta) return { email: byMeta.email! };

    // Legacy: admin whose email local-part matches the username
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    const adminIds = new Set((roles ?? []).map((r: any) => r.user_id));
    const legacy = users.find(
      (u) => adminIds.has(u.id) && ((u.email || "").split("@")[0] || "").toLowerCase() === lower,
    );
    if (legacy) return { email: legacy.email! };

    return { email: null as string | null };
  });

