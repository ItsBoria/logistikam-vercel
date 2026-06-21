import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertMinRole, assertOwner as assertSystemOwner, getUserRole } from "./authz.server";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  return assertMinRole(ctx.userId, "ADMIN");
}

async function isApprover(ctx: { supabase: any; userId: string }) {
  const role = await getUserRole(ctx.userId);
  return role === "OWNER" || role === "WORK_MANAGER";
}

export type MissionRow = {
  id: string;
  week_id: string;
  day_of_week: number;
  position: number;
  title: string;
  details: string | null;
  done: boolean;
  due_time: string | null;
  reminder_at: string | null;
  reminder_sent_at: string | null;
  carried_from_id: string | null;
};

export type DayNoteRow = {
  id: string;
  week_id: string;
  day_of_week: number;
  influencers: string;
};

export type WeekRow = {
  id: string;
  year: number;
  week: number;
  owner_user_id: string;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  author_signed_at: string | null;
  author_signature_name: string | null;
  approver_user_id: string | null;
  approver_signed_at: string | null;
  approver_signature_name: string | null;
  locked: boolean;
};

export type AdminOption = { id: string; name: string; is_approver: boolean };

export const listCalendarAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const callerRole = await getUserRole(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles").select("user_id, role").eq("is_active", true)
      .in("role", ["OWNER", "WORK_MANAGER", "ADMIN"]);
    const roleByUser = new Map<string, string>();
    for (const row of (roles ?? []) as any[]) {
      const current = roleByUser.get(row.user_id);
      const level: Record<string, number> = { OWNER: 100, WORK_MANAGER: 80, ADMIN: 50 };
      if (!current || level[row.role] > level[current]) roleByUser.set(row.user_id, row.role);
    }
    const ids = callerRole === "ADMIN" ? [context.userId] : Array.from(roleByUser.keys());
    if (!ids.length) return [] as AdminOption[];
    const { data: profs } = await supabaseAdmin
      .from("profiles").select("id, display_name, email, is_approver").in("id", ids);
    return (profs ?? []).map((p: any) => ({
      id: p.id,
      name: p.display_name || p.email || p.id.slice(0, 8),
      is_approver: roleByUser.get(p.id) === "OWNER" || roleByUser.get(p.id) === "WORK_MANAGER",
    })) as AdminOption[];
  });

export const setAdminApprover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; is_approver: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertSystemOwner(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles").update({ is_approver: data.is_approver }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMissionWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { year: number; week: number; owner_user_id?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase, userId } = context;
    const owner = data.owner_user_id ?? userId;
    const isOwner = owner === userId;
    const approver = await isApprover(context);

    let { data: weekRow, error: selErr } = await supabase
      .from("mission_weeks")
      .select("*")
      .eq("year", data.year)
      .eq("week", data.week)
      .eq("owner_user_id", owner)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);

    if (!weekRow) {
      if (!isOwner) {
        return {
          week: null as any,
          missions: [] as MissionRow[],
          day_notes: [] as DayNoteRow[],
          can_edit: false,
          can_sign_author: false,
          can_sign_approver: approver,
          is_owner: false,
        };
      }
      const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
      const ins = await supabase
        .from("mission_weeks")
        .insert({
          year: data.year, week: data.week, owner_user_id: userId,
          created_by: userId, created_by_name: prof?.display_name ?? null,
        })
        .select("*")
        .single();
      if (ins.error) throw new Error(ins.error.message);
      weekRow = ins.data;
    }

    const [{ data: missions, error: mErr }, { data: notes, error: nErr }] = await Promise.all([
      supabase.from("missions").select("*").eq("week_id", weekRow.id)
        .order("day_of_week", { ascending: true })
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("mission_day_notes").select("*").eq("week_id", weekRow.id),
    ]);
    if (mErr) throw new Error(mErr.message);
    if (nErr) throw new Error(nErr.message);

    return {
      week: weekRow as WeekRow,
      missions: (missions ?? []) as MissionRow[],
      day_notes: (notes ?? []) as DayNoteRow[],
      can_edit: isOwner && !weekRow.locked && !weekRow.author_signed_at,
      can_sign_author: isOwner && !weekRow.author_signed_at,
      can_sign_approver: approver && !isOwner && !!weekRow.author_signed_at && !weekRow.approver_signed_at,
      is_owner: isOwner,
    };
  });

async function assertOwner(ctx: { supabase: any; userId: string }, week_id: string) {
  const { data: w } = await ctx.supabase.from("mission_weeks")
    .select("owner_user_id, locked, author_signed_at, year, week")
    .eq("id", week_id).maybeSingle();
  if (!w) throw new Error("שבוע לא נמצא");
  if (w.owner_user_id !== ctx.userId) throw new Error("רק בעל הלוח יכול לערוך");
  if (w.locked) throw new Error("השבוע נעול — לא ניתן לערוך");
  if (w.author_signed_at) throw new Error("הלוח כבר נחתם וממתין לאישור מנהל עבודה");
  return w;
}

export const upsertMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; week_id: string; day_of_week: number;
    title: string; details?: string | null;
    due_time?: string | null; reminder_at?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    await assertOwner(context, data.week_id);

    const patch = {
      title: data.title,
      details: data.details ?? null,
      day_of_week: data.day_of_week,
      due_time: data.due_time ?? null,
      reminder_at: data.reminder_at ?? null,
    };

    if (data.id) {
      const { error } = await supabase.from("missions").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { data: existing } = await supabase
      .from("missions").select("position")
      .eq("week_id", data.week_id).eq("day_of_week", data.day_of_week)
      .order("position", { ascending: false }).limit(1);
    const nextPos = existing && existing[0] ? (existing[0].position ?? 0) + 1 : 0;
    const { error } = await supabase.from("missions").insert({
      week_id: data.week_id, position: nextPos, ...patch,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const { data: row } = await supabase.from("missions").select("week_id").eq("id", data.id).maybeSingle();
    if (!row) return { ok: true };
    await assertOwner(context, row.week_id);
    const { error } = await supabase.from("missions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleMissionDone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; done: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const { data: row } = await supabase.from("missions").select("week_id").eq("id", data.id).maybeSingle();
    if (!row) return { ok: true };
    await assertOwner(context, row.week_id);
    const { error } = await supabase.from("missions").update({ done: data.done }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateWeekNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { week_id: string; notes: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await assertOwner(context, data.week_id);
    const { error } = await context.supabase.from("mission_weeks").update({ notes: data.notes }).eq("id", data.week_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertDayNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { week_id: string; day_of_week: number; influencers: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await assertOwner(context, data.week_id);
    const { error } = await context.supabase
      .from("mission_day_notes")
      .upsert(
        { week_id: data.week_id, day_of_week: data.day_of_week, influencers: data.influencers },
        { onConflict: "week_id,day_of_week" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signMissionWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { week_id: string; role: "author" | "approver"; signature_name: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase, userId } = context;
    const signerRole = await getUserRole(userId);
    const name = data.signature_name.trim();
    if (!name) throw new Error("נדרש שם");

    const { data: w } = await supabase.from("mission_weeks").select("owner_user_id, author_signed_at, approver_signed_at").eq("id", data.week_id).maybeSingle();
    if (!w) throw new Error("שבוע לא נמצא");

    const patch: any = {};
    if (data.role === "author") {
      if (w.owner_user_id !== userId) throw new Error("רק בעל הלוח חותם כרכז");
      patch.author_signed_at = new Date().toISOString();
      patch.author_signature_name = name;
    } else {
      if (!(await isApprover(context))) throw new Error("רק מנהל מאשר יכול לחתום");
      if (w.owner_user_id === userId) throw new Error("לא ניתן לאשר את הלוח של עצמך");
      if (!w.author_signed_at) throw new Error("יש להמתין לחתימת נגד הלוגיסטיקה לפני אישור מנהל העבודה");
      patch.approver_signed_at = new Date().toISOString();
      patch.approver_signature_name = name;
      patch.approver_user_id = userId;
    }

    const { data: updated, error } = await supabase
      .from("mission_weeks").update(patch).eq("id", data.week_id)
      .select("author_signed_at, approver_signed_at").single();
    if (error) throw new Error(error.message);

    if (updated.author_signed_at && updated.approver_signed_at) {
      await supabase.from("mission_weeks").update({ locked: true }).eq("id", data.week_id);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("calendar_approval_history").insert({
      calendar_entry_id: data.week_id,
      signer_user_id: userId,
      signer_name: name,
      signer_role: signerRole,
      previous_status: "open",
      new_status: updated.author_signed_at && updated.approver_signed_at ? "approved" : "partially_signed",
      action: data.role === "approver" ? "approve" : "sign",
    });
    await (supabaseAdmin as any).from("audit_log").insert({
      action_type: data.role === "approver" ? "CALENDAR_APPROVED" : "CALENDAR_SIGNED",
      target_type: "mission_week",
      target_id: data.week_id,
      performed_by_user_id: userId,
      performer_role: signerRole,
      new_value: { signature_name: name, signature_role: data.role },
    });
    return { ok: true };
  });

export const reopenMissionWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { week_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase, userId } = context;
    const { data: w } = await supabase.from("mission_weeks").select("owner_user_id").eq("id", data.week_id).maybeSingle();
    if (!w) throw new Error("שבוע לא נמצא");
    const approver = await isApprover(context);
    if (w.owner_user_id !== userId && !approver) throw new Error("רק הבעלים או מאשר יכול לפתוח מחדש");
    const { error } = await supabase
      .from("mission_weeks")
      .update({
        locked: false,
        author_signed_at: null, author_signature_name: null,
        approver_signed_at: null, approver_signature_name: null, approver_user_id: null,
      })
      .eq("id", data.week_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Carry unfinished missions to next ISO week -----
function nextIsoWeek(year: number, week: number): { year: number; week: number } {
  // Last ISO week of a year is 52 or 53. Use Date math to be safe.
  const simple = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = simple.getUTCDay() || 7;
  const isoMon = new Date(simple);
  isoMon.setUTCDate(simple.getUTCDate() - (dayOfWeek - 1) + (week - 1) * 7);
  const nextMon = new Date(isoMon);
  nextMon.setUTCDate(isoMon.getUTCDate() + 7);
  const d = new Date(Date.UTC(nextMon.getUTCFullYear(), nextMon.getUTCMonth(), nextMon.getUTCDate()));
  const dn = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dn);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: wk };
}

export const carryUnfinishedToNextWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { week_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase, userId } = context;
    const w = await assertOwner(context, data.week_id);

    const { data: unfinished, error: uErr } = await supabase
      .from("missions").select("*").eq("week_id", data.week_id).eq("done", false);
    if (uErr) throw new Error(uErr.message);
    if (!unfinished || !unfinished.length) return { ok: true, moved: 0 };

    const next = nextIsoWeek(w.year, w.week);

    // Find or create next week's row for this owner.
    let { data: nextWeek } = await supabase
      .from("mission_weeks").select("*")
      .eq("year", next.year).eq("week", next.week).eq("owner_user_id", userId)
      .maybeSingle();
    if (!nextWeek) {
      const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
      const ins = await supabase.from("mission_weeks").insert({
        year: next.year, week: next.week, owner_user_id: userId,
        created_by: userId, created_by_name: prof?.display_name ?? null,
      }).select("*").single();
      if (ins.error) throw new Error(ins.error.message);
      nextWeek = ins.data;
    }
    if (nextWeek.locked) throw new Error("שבוע היעד נעול");

    const inserts = (unfinished as any[]).map((m, i) => ({
      week_id: nextWeek!.id,
      day_of_week: 0, // start of next week
      position: i,
      title: m.title,
      details: m.details,
      due_time: m.due_time,
      reminder_at: null,
      carried_from_id: m.id,
    }));

    const { error: insErr } = await supabase.from("missions").insert(inserts);
    if (insErr) throw new Error(insErr.message);
    return { ok: true, moved: inserts.length, target: next };
  });
