import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TeamContext = {
  team_id: string;
  team_name: string;
  pin: string;
  monthly_limit: number;
  contact_phone: string | null;
} | null;

// Returns the current user's team (or null) including the PIN that the
// existing shop functions need. Service-role read keeps it simple while RLS
// is being phased in for the shop tables.
export const getMyTeamContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamContext> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!m) return null;
    const { data: t } = await supabaseAdmin
      .from("teams")
      .select("id, name, pin, monthly_limit, contact_phone, active")
      .eq("id", m.team_id)
      .maybeSingle();
    if (!t || !t.active) return null;
    return {
      team_id: t.id,
      team_name: t.name,
      pin: t.pin,
      monthly_limit: Number(t.monthly_limit),
      contact_phone: t.contact_phone,
    };
  });

// Grants the first admin role only to the signed-in account explicitly
// configured by the project owner in Vercel.
export const claimConfiguredFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getUserRole } = await import("./authz.server");
    const role = await getUserRole(context.userId);
    return { claimed: false, reason: role !== "USER" ? "already_assigned" as const : "owner_managed" as const };
  });

export const listActiveTeams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    let q = supabaseAdmin
      .from("teams")
      .select("id, name, is_admin_only")
      .eq("active", true)
      .order("name");
    if (!isAdmin) q = q.eq("is_admin_only", false);
    const { data } = await q;
    return (data ?? []).map(({ id, name }) => ({ id, name }));
  });

export const setMyTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ team_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: existing } = await supabaseAdmin
      .from("team_members").select("team_id").eq("user_id", context.userId).maybeSingle();
    if (existing && !isAdmin) {
      throw new Error("הצוות שלך כבר נקבע — פנה למנהל לשינוי");
    }
    const { data: t } = await supabaseAdmin
      .from("teams").select("id, active, is_admin_only").eq("id", data.team_id).maybeSingle();
    if (!t || !t.active) throw new Error("צוות לא תקין");
    if (t.is_admin_only && !isAdmin) throw new Error("צוות לא תקין");
    const { error } = await supabaseAdmin
      .from("team_members")
      .upsert({ user_id: context.userId, team_id: data.team_id }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserTeamAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    user_id: z.string().uuid(),
    team_id: z.string().uuid().nullable(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertOwner } = await import("./authz.server");
    await assertOwner(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.team_id === null) {
      const { error } = await supabaseAdmin.from("team_members").delete().eq("user_id", data.user_id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { data: t } = await supabaseAdmin
      .from("teams").select("id, active").eq("id", data.team_id).maybeSingle();
    if (!t || !t.active) throw new Error("צוות לא תקין");
    const { error } = await supabaseAdmin
      .from("team_members")
      .upsert({ user_id: data.user_id, team_id: data.team_id }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// Admin "view shop as": resolves any team to the same context shape the shop uses.
export const getTeamContextById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ team_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<TeamContext> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: t } = await supabaseAdmin
      .from("teams").select("id, name, pin, monthly_limit, contact_phone, active")
      .eq("id", data.team_id).maybeSingle();
    if (!t || !t.active) throw new Error("צוות לא תקין");
    return {
      team_id: t.id,
      team_name: t.name,
      pin: t.pin,
      monthly_limit: Number(t.monthly_limit),
      contact_phone: t.contact_phone,
    };
  });

// Claim admin role on current account using legacy admin username + password.
// Lets the existing admins migrate to Google sign-in without touching SQL.
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
