import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertFunctionMinRole as assertMinRole,
  assertFunctionOwner as assertSystemOwner,
  getFunctionUserRole as getUserRole,
} from "./authz.functions";
import {
  WORK_DAYS,
  formatWorkDate,
  isoWeekToWorkweekRange,
  shiftWorkweek,
  workdayDate,
} from "./workweek";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  return assertMinRole(ctx.userId, "ADMIN");
}

async function isApprover(ctx: { supabase: any; userId: string }) {
  const role = await getUserRole(ctx.userId);
  return role === "OWNER" || role === "WORK_MANAGER";
}

function assertWorkday(day: number) {
  if (!Number.isInteger(day) || day < 0 || day > 4) {
    throw new Error("יום המשימה חייב להיות בין יום ראשון ליום חמישי");
  }
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
  series_id: string | null;
  occurrence_date: string | null;
  original_occurrence_date: string | null;
  is_recurrence_exception: boolean;
  recurrence_status: "active" | "moved" | "deleted";
  recurrence_summary?: string | null;
  recurrence_interval_weeks?: number | null;
  recurrence_weekdays?: number[] | null;
  recurrence_start_date?: string | null;
  recurrence_end_date?: string | null;
  recurrence_occurrence_limit?: number | null;
};

export type RecurrenceInput = {
  enabled: boolean;
  interval_weeks: number;
  weekdays: number[];
  start_date: string;
  end_type: "never" | "date" | "count";
  end_date?: string | null;
  occurrence_limit?: number | null;
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

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function recurrenceSummary(series: any) {
  const names = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];
  const days = (series.weekdays ?? []).map((day: number) => names[day]).join(" ו");
  const frequency = series.interval_weeks === 1
    ? "כל שבוע"
    : `כל ${series.interval_weeks} שבועות`;
  return `${frequency} ב${days}${series.end_date ? ` עד ${formatWorkDate(parseDate(series.end_date))}` : ""}`;
}

function occurrenceOrdinal(series: any, candidate: Date) {
  const start = parseDate(series.start_date);
  const startSunday = new Date(start);
  startSunday.setUTCDate(start.getUTCDate() - start.getUTCDay());
  let count = 0;
  for (let cursor = new Date(startSunday); cursor <= candidate; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
    const cycle = Math.round((cursor.getTime() - startSunday.getTime()) / 604_800_000);
    if (cycle % series.interval_weeks !== 0) continue;
    for (const day of series.weekdays as number[]) {
      const date = new Date(cursor);
      date.setUTCDate(cursor.getUTCDate() + day);
      if (date < start || date > candidate) continue;
      count += 1;
    }
  }
  return count;
}

async function materializeRecurringMissions(
  ownerUserId: string,
  weekRow: any,
  year: number,
  week: number,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: seriesRows, error } = await (supabaseAdmin as any)
    .from("recurring_mission_series")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .eq("is_active", true);
  if (error) {
    // Backward-compatible while the migration is being applied.
    if (error.code === "42P01" || error.code === "42703") return;
    throw new Error(error.message);
  }
  const range = isoWeekToWorkweekRange(year, week);
  const inserts: any[] = [];
  for (const series of seriesRows ?? []) {
    const start = parseDate(series.start_date);
    const startSunday = new Date(start);
    startSunday.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const weekOffset = Math.round((range.start.getTime() - startSunday.getTime()) / 604_800_000);
    if (weekOffset < 0 || weekOffset % series.interval_weeks !== 0) continue;
    for (const day of series.weekdays as number[]) {
      assertWorkday(day);
      const occurrence = workdayDate(range, day as any);
      const occurrenceDate = isoDate(occurrence);
      if (occurrence < start) continue;
      if (series.end_date && occurrenceDate > series.end_date) continue;
      if (series.occurrence_limit && occurrenceOrdinal(series, occurrence) > series.occurrence_limit) continue;
      inserts.push({
        week_id: weekRow.id,
        day_of_week: day,
        position: 0,
        title: series.title,
        details: series.details,
        due_time: series.due_time,
        done: false,
        series_id: series.id,
        occurrence_date: occurrenceDate,
        original_occurrence_date: occurrenceDate,
        recurrence_status: "active",
      });
    }
  }
  if (inserts.length) {
    const { error: insertError } = await (supabaseAdmin as any)
      .from("missions")
      .upsert(inserts, { onConflict: "series_id,original_occurrence_date", ignoreDuplicates: true });
    if (insertError) throw new Error(insertError.message);
  }
}

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

    await materializeRecurringMissions(owner, weekRow, data.year, data.week);

    const [{ data: missions, error: mErr }, { data: notes, error: nErr }] = await Promise.all([
      (supabase as any).from("missions").select("*").eq("week_id", weekRow.id)
        .neq("recurrence_status", "deleted")
        .order("day_of_week", { ascending: true })
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("mission_day_notes").select("*").eq("week_id", weekRow.id),
    ]);
    if (mErr) throw new Error(mErr.message);
    if (nErr) throw new Error(nErr.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const seriesIds = [...new Set((missions ?? []).map((m: any) => m.series_id).filter(Boolean))];
    const seriesById = new Map<string, any>();
    if (seriesIds.length) {
      const { data: seriesRows } = await (supabaseAdmin as any)
        .from("recurring_mission_series").select("*").in("id", seriesIds);
      for (const series of seriesRows ?? []) seriesById.set(series.id, series);
    }
    const missionRows = (missions ?? []).map((mission: any) => ({
      ...mission,
      recurrence_summary: mission.series_id && seriesById.has(mission.series_id)
        ? recurrenceSummary(seriesById.get(mission.series_id))
        : null,
      recurrence_interval_weeks: seriesById.get(mission.series_id)?.interval_weeks ?? null,
      recurrence_weekdays: seriesById.get(mission.series_id)?.weekdays ?? null,
      recurrence_start_date: seriesById.get(mission.series_id)?.start_date ?? null,
      recurrence_end_date: seriesById.get(mission.series_id)?.end_date ?? null,
      recurrence_occurrence_limit: seriesById.get(mission.series_id)?.occurrence_limit ?? null,
    }));

    return {
      week: weekRow as WeekRow,
      missions: missionRows as MissionRow[],
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
    recurrence?: RecurrenceInput | null;
    recurrence_scope?: "this" | "future" | "all";
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const calendarWeek = await assertOwner(context, data.week_id);
    assertWorkday(data.day_of_week);
    if (data.recurrence?.enabled) {
      const interval = Number(data.recurrence.interval_weeks);
      if (!Number.isInteger(interval) || interval < 1 || interval > 52) {
        throw new Error("מרווח החזרה חייב להיות בין 1 ל-52 שבועות");
      }
      const weekdays = [...new Set(data.recurrence.weekdays)];
      if (!weekdays.length) throw new Error("יש לבחור לפחות יום חזרה אחד");
      weekdays.forEach(assertWorkday);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.recurrence.start_date)) {
        throw new Error("תאריך ההתחלה אינו תקין");
      }
      if (
        data.recurrence.end_type === "date"
        && (!data.recurrence.end_date || data.recurrence.end_date < data.recurrence.start_date)
      ) {
        throw new Error("תאריך הסיום חייב להיות אחרי תאריך ההתחלה");
      }
      if (
        data.recurrence.end_type === "count"
        && (!Number.isInteger(data.recurrence.occurrence_limit)
          || Number(data.recurrence.occurrence_limit) < 1
          || Number(data.recurrence.occurrence_limit) > 1000)
      ) {
        throw new Error("מספר המופעים חייב להיות בין 1 ל-1000");
      }
    }

    const occurrenceDate = isoDate(workdayDate(
      isoWeekToWorkweekRange(calendarWeek.year, calendarWeek.week),
      data.day_of_week as any,
    ));
    const patch: any = {
      title: data.title,
      details: data.details ?? null,
      day_of_week: data.day_of_week,
      due_time: data.due_time ?? null,
      reminder_at: data.reminder_at ?? null,
      occurrence_date: occurrenceDate,
    };

    if (data.id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: current } = await (supabaseAdmin as any)
        .from("missions").select("*").eq("id", data.id).single();
      if (current?.series_id && data.recurrence_scope && data.recurrence_scope !== "this") {
        await (supabaseAdmin as any).from("recurring_mission_series").update({
          title: patch.title,
          details: patch.details,
          due_time: patch.due_time,
          ...(data.recurrence ? {
            interval_weeks: data.recurrence.interval_weeks,
            weekdays: data.recurrence.weekdays,
            start_date: data.recurrence.start_date,
            end_date: data.recurrence.end_type === "date" ? data.recurrence.end_date : null,
            occurrence_limit: data.recurrence.end_type === "count" ? data.recurrence.occurrence_limit : null,
          } : {}),
        }).eq("id", current.series_id).eq("owner_user_id", context.userId);
        let futureQuery = (supabaseAdmin as any).from("missions").update({
          title: patch.title, details: patch.details, due_time: patch.due_time,
        }).eq("series_id", current.series_id);
        if (data.recurrence_scope === "future") {
          futureQuery = futureQuery.gte("original_occurrence_date", current.original_occurrence_date);
        }
        await futureQuery;
      }
      if (current?.series_id && data.recurrence_scope === "this") {
        patch.is_recurrence_exception = true;
      }
      const { error } = await supabase.from("missions").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    if (data.recurrence?.enabled) {
      const interval = Number(data.recurrence.interval_weeks);
      const weekdays = [...new Set(data.recurrence.weekdays)];
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: series, error: seriesError } = await (supabaseAdmin as any)
        .from("recurring_mission_series")
        .insert({
          owner_user_id: context.userId,
          title: patch.title,
          details: patch.details,
          due_time: patch.due_time,
          interval_weeks: interval,
          weekdays,
          start_date: data.recurrence.start_date,
          end_date: data.recurrence.end_type === "date" ? data.recurrence.end_date : null,
          occurrence_limit: data.recurrence.end_type === "count" ? data.recurrence.occurrence_limit : null,
        }).select("*").single();
      if (seriesError) throw new Error(seriesError.message);
      patch.series_id = series.id;
      patch.original_occurrence_date = occurrenceDate;
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
  .inputValidator((d: { id: string; recurrence_scope?: "this" | "future" | "all" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const { data: row }: { data: any } = await (supabase as any)
      .from("missions").select("*").eq("id", data.id).maybeSingle();
    if (!row) return { ok: true };
    await assertOwner(context, row.week_id);
    if (row.series_id && data.recurrence_scope && data.recurrence_scope !== "this") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (data.recurrence_scope === "all") {
        await (supabaseAdmin as any).from("recurring_mission_series")
          .update({ is_active: false }).eq("id", row.series_id).eq("owner_user_id", context.userId);
        await (supabaseAdmin as any).from("missions").update({ recurrence_status: "deleted" })
          .eq("series_id", row.series_id).eq("done", false);
      } else {
        const previousDate = new Date(`${row.original_occurrence_date}T00:00:00.000Z`);
        previousDate.setUTCDate(previousDate.getUTCDate() - 1);
        await (supabaseAdmin as any).from("recurring_mission_series")
          .update({ end_date: isoDate(previousDate) }).eq("id", row.series_id).eq("owner_user_id", context.userId);
        await (supabaseAdmin as any).from("missions").update({ recurrence_status: "deleted" })
          .eq("series_id", row.series_id).gte("original_occurrence_date", row.original_occurrence_date).eq("done", false);
      }
      return { ok: true };
    }
    const { error } = row.series_id
      ? await (supabase as any).from("missions").update({ recurrence_status: "deleted" }).eq("id", data.id)
      : await supabase.from("missions").delete().eq("id", data.id);
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
    assertWorkday(data.day_of_week);
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
      if (w.owner_user_id !== userId) throw new Error("רק בעל הלוח חותם כנגד לוגיסטיקה");
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

export type MissionMoveAssignment = {
  mission_id: string;
  destination_day: number;
  destination_date: string;
  due_time?: string | null;
  recurrence_scope?: "occurrence" | "future";
  conflict_resolution?: "keep_both" | "replace";
};

export const moveSelectedMissionsToNextWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    week_id: string;
    request_token: string;
    assignments: MissionMoveAssignment[];
  }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { userId } = context;
    const sourceWeek = await assertOwner(context, data.week_id);
    if (!data.assignments.length) throw new Error("יש לבחור לפחות משימה אחת");
    data.assignments.forEach((assignment) => assertWorkday(assignment.destination_day));

    const target = shiftWorkweek(sourceWeek.year, sourceWeek.week, 1);
    const targetRange = isoWeekToWorkweekRange(target.year, target.week);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let { data: targetWeek } = await (supabaseAdmin as any)
      .from("mission_weeks").select("*")
      .eq("year", target.year).eq("week", target.week).eq("owner_user_id", userId)
      .maybeSingle();
    if (!targetWeek) {
      const { data: profile } = await (supabaseAdmin as any)
        .from("profiles").select("display_name").eq("id", userId).maybeSingle();
      const created = await (supabaseAdmin as any).from("mission_weeks").insert({
        year: target.year,
        week: target.week,
        owner_user_id: userId,
        created_by: userId,
        created_by_name: profile?.display_name ?? null,
      }).select("*").single();
      if (created.error) throw new Error(created.error.message);
      targetWeek = created.data;
    }
    if (targetWeek.locked || targetWeek.author_signed_at) throw new Error("שבוע היעד חתום או נעול");

    const normalized = data.assignments.map((assignment) => {
      const expectedDate = isoDate(workdayDate(targetRange, assignment.destination_day as any));
      if (assignment.destination_date !== expectedDate) {
        throw new Error("תאריך היעד אינו תואם ליום שנבחר");
      }
      return assignment;
    });
    const { data: priorMoves } = await (supabaseAdmin as any)
      .from("mission_move_history")
      .select("mission_id")
      .eq("request_token", data.request_token)
      .eq("owner_user_id", userId);
    if ((priorMoves ?? []).length === normalized.length) {
      return {
        ok: true,
        moved: normalized.length,
        target,
        target_week_id: targetWeek.id,
      };
    }
    const ids = normalized.map((assignment) => assignment.mission_id);
    const selected = await (supabaseAdmin as any).from("missions").select("*")
      .in("id", ids).eq("week_id", data.week_id).eq("done", false)
      .neq("recurrence_status", "deleted");
    if (selected.error) throw new Error(selected.error.message);
    if ((selected.data ?? []).length !== ids.length) {
      throw new Error("אחת המשימות כבר הועברה, הושלמה או אינה זמינה");
    }

    const result = await (supabaseAdmin as any).rpc("move_selected_missions", {
      p_source_week_id: data.week_id,
      p_destination_week_id: targetWeek.id,
      p_actor: userId,
      p_request_token: data.request_token,
      p_assignments: normalized,
    });
    if (result.error) throw new Error(result.error.message);
    return {
      ok: true,
      moved: result.data?.moved ?? normalized.length,
      target,
      target_week_id: targetWeek.id,
    };
  });
