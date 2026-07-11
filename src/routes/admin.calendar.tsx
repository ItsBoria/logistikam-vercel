import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  FileText,
  FileType,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Bell,
  ArrowRightCircle,
  Repeat2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMissionWeek,
  upsertMission,
  deleteMission,
  toggleMissionDone,
  updateWeekNotes,
  signMissionWeek,
  reopenMissionWeek,
  listCalendarAdmins,
  upsertDayNote,
  moveSelectedMissionsToNextWeek,
  type MissionRow,
} from "@/lib/missions.functions";
import { downloadWeeklyPDF, downloadWeeklyDOCX, isoWeekToRange } from "@/lib/weekly-export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import {
  WORK_DAYS,
  formatWorkDate,
  getWorkweekForInstant,
  shiftWorkweek,
  workdayDate,
} from "@/lib/workweek";

export const Route = createFileRoute("/admin/calendar")({
  ssr: false,
  head: () => ({ meta: [{ title: "תכנית שבועית - פאנל" }] }),
  component: () => (
    <AdminShell adminOnly>
      <Calendar />
    </AdminShell>
  ),
});

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי"];

function Calendar() {
  const qc = useQueryClient();
  const { session } = useSupabaseSession();
  const myId = session?.user?.id ?? "";
  const today = useMemo(() => getWorkweekForInstant(), []);
  const [year, setYear] = useState(today.year);
  const [week, setWeek] = useState(today.week);
  const [ownerId, setOwnerId] = useState<string>("");

  const adminsFn = useServerFn(listCalendarAdmins);
  const { data: admins } = useQuery({ queryKey: ["calendar-admins"], queryFn: () => adminsFn() });

  useEffect(() => {
    if (!ownerId && myId) setOwnerId(myId);
  }, [myId, ownerId]);

  const getFn = useServerFn(getMissionWeek);
  const { data, isLoading } = useQuery({
    enabled: !!ownerId,
    queryKey: ["mission-week", year, week, ownerId],
    queryFn: () => getFn({ data: { year, week, owner_user_id: ownerId } }),
  });

  const upsertFn = useServerFn(upsertMission);
  const delFn = useServerFn(deleteMission);
  const toggleFn = useServerFn(toggleMissionDone);
  const notesFn = useServerFn(updateWeekNotes);
  const signFn = useServerFn(signMissionWeek);
  const reopenFn = useServerFn(reopenMissionWeek);
  const dayNoteFn = useServerFn(upsertDayNote);
  const moveFn = useServerFn(moveSelectedMissionsToNextWeek);

  const [editor, setEditor] = useState<{ open: boolean; day: number; mission?: MissionRow }>({
    open: false,
    day: 0,
  });
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatStart, setRepeatStart] = useState("");
  const [repeatEndType, setRepeatEndType] = useState<"never" | "date" | "count">("never");
  const [repeatEndDate, setRepeatEndDate] = useState("");
  const [repeatCount, setRepeatCount] = useState(10);
  const [recurrenceScope, setRecurrenceScope] = useState<"this" | "future" | "all">("this");
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveStep, setMoveStep] = useState<1 | 2 | 3>(1);
  const [selectedMoveIds, setSelectedMoveIds] = useState<string[]>([]);
  const [moveDays, setMoveDays] = useState<Record<string, number>>({});
  const [moveTimes, setMoveTimes] = useState<Record<string, string>>({});
  const [moveScopes, setMoveScopes] = useState<Record<string, "occurrence" | "future">>({});
  const [moveConflicts, setMoveConflicts] = useState<Record<string, "keep_both" | "replace">>({});
  const [bulkMoveDay, setBulkMoveDay] = useState("");
  const [moveRequestToken, setMoveRequestToken] = useState("");
  const [moving, setMoving] = useState(false);

  const [notesDraft, setNotesDraft] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [approverName, setApproverName] = useState("");

  // Local day-notes editing (debounced auto-save)
  const [dayNotes, setDayNotes] = useState<Record<number, string>>({});
  const dayNoteTimers = useRef<Record<number, any>>({});

  useEffect(() => {
    if (data?.week) {
      setNotesDraft(data.week.notes ?? "");
      setNotesDirty(false);
    }
    if (data?.day_notes) {
      const map: Record<number, string> = {};
      for (const n of data.day_notes) map[n.day_of_week] = n.influencers;
      setDayNotes(map);
    }
  }, [data?.week?.id]);

  // ---- In-app reminder notifications (while the calendar is open) ----
  const firedReminders = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!data?.missions) return;
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const i = setInterval(() => {
      const now = Date.now();
      for (const m of data.missions) {
        if (!m.reminder_at || m.done) continue;
        if (firedReminders.current.has(m.id)) continue;
        const t = new Date(m.reminder_at).getTime();
        if (t <= now && now - t < 60_000 * 60) {
          firedReminders.current.add(m.id);
          toast.info(`תזכורת: ${m.title}`, { description: m.details ?? undefined });
          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`תזכורת: ${m.title}`, { body: m.details ?? "" });
            }
          } catch {}
        }
      }
    }, 30_000);
    return () => clearInterval(i);
  }, [data?.missions]);

  const range = useMemo(() => isoWeekToRange(year, week), [year, week]);
  const days = WORK_DAYS;
  const grouped: Record<number, MissionRow[]> = {};
  (data?.missions ?? []).forEach((m) => {
    (grouped[m.day_of_week] ??= []).push(m);
  });

  const locked = !!data?.week?.locked;
  const canEdit = !!data?.can_edit;
  const canSignAuthor = !!data?.can_sign_author;
  const canSignApprover = !!data?.can_sign_approver;
  const invalidateKey = ["mission-week", year, week, ownerId] as const;
  const unfinishedCount = (data?.missions ?? []).filter((m) => !m.done).length;

  function openCreate(day: number) {
    setEditor({ open: true, day });
    setTitle("");
    setDetails("");
    setDueTime("");
    setReminderAt("");
    setRepeatEnabled(false);
    setRepeatInterval(1);
    setRepeatDays([day]);
    setRepeatStart(workdayDate(range, day as any).toISOString().slice(0, 10));
    setRepeatEndType("never");
    setRepeatEndDate("");
    setRepeatCount(10);
    setRecurrenceScope("this");
  }
  function openEdit(m: MissionRow) {
    setEditor({ open: true, day: m.day_of_week, mission: m });
    setTitle(m.title);
    setDetails(m.details ?? "");
    setDueTime(m.due_time ? m.due_time.slice(0, 5) : "");
    setReminderAt(m.reminder_at ? new Date(m.reminder_at).toISOString().slice(0, 16) : "");
    setRepeatEnabled(!!m.series_id);
    setRepeatInterval(m.recurrence_interval_weeks ?? 1);
    setRepeatDays(m.recurrence_weekdays ?? [m.day_of_week]);
    setRepeatStart(m.recurrence_start_date ?? m.occurrence_date ?? "");
    setRepeatEndType(
      m.recurrence_end_date ? "date" : m.recurrence_occurrence_limit ? "count" : "never",
    );
    setRepeatEndDate(m.recurrence_end_date ?? "");
    setRepeatCount(m.recurrence_occurrence_limit ?? 10);
    setRecurrenceScope("this");
  }
  async function saveMission() {
    if (!data?.week || !title.trim()) return;
    if (repeatEnabled && (!repeatDays.length || !repeatStart)) {
      toast.error("בחר לפחות יום חזרה אחד ותאריך התחלה");
      return;
    }
    setSaving(true);
    try {
      await upsertFn({
        data: {
          id: editor.mission?.id,
          week_id: data.week.id,
          day_of_week: editor.day,
          title: title.trim(),
          details: details.trim() || null,
          due_time: dueTime || null,
          reminder_at: reminderAt ? new Date(reminderAt).toISOString() : null,
          recurrence_scope: editor.mission?.series_id ? recurrenceScope : undefined,
          recurrence: repeatEnabled
            ? {
                enabled: true,
                interval_weeks: repeatInterval,
                weekdays: repeatDays,
                start_date: repeatStart,
                end_type: repeatEndType,
                end_date: repeatEndType === "date" ? repeatEndDate : null,
                occurrence_limit: repeatEndType === "count" ? repeatCount : null,
              }
            : null,
        },
      });
      setEditor({ open: false, day: 0 });
      qc.invalidateQueries({ queryKey: invalidateKey });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function removeMission(mission: MissionRow) {
    let scope: "this" | "future" | "all" = "this";
    if (mission.series_id) {
      const answer = prompt(
        "מחיקת משימה חוזרת: הקלד 1 למופע הזה, 2 למופע הזה ולהבא, או 3 לכל הסדרה",
        "1",
      );
      if (answer === null) return;
      scope = answer === "3" ? "all" : answer === "2" ? "future" : "this";
    }
    if (!confirm("למחוק משימה?")) return;
    try {
      await delFn({ data: { id: mission.id, recurrence_scope: scope } });
      qc.invalidateQueries({ queryKey: invalidateKey });
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function toggleDone(m: MissionRow) {
    try {
      await toggleFn({ data: { id: m.id, done: !m.done } });
      qc.invalidateQueries({ queryKey: invalidateKey });
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function saveNotes() {
    if (!data?.week) return;
    try {
      await notesFn({ data: { week_id: data.week.id, notes: notesDraft } });
      setNotesDirty(false);
      toast.success("נשמר");
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  function onDayNoteChange(d: number, value: string) {
    setDayNotes((m) => ({ ...m, [d]: value }));
    if (!data?.week || !canEdit) return;
    if (dayNoteTimers.current[d]) clearTimeout(dayNoteTimers.current[d]);
    dayNoteTimers.current[d] = setTimeout(async () => {
      try {
        await dayNoteFn({ data: { week_id: data.week.id, day_of_week: d, influencers: value } });
      } catch (e: any) {
        toast.error(e.message);
      }
    }, 700);
  }
  async function sign(role: "author" | "approver") {
    if (!data?.week) return;
    const name = (role === "author" ? authorName : approverName).trim();
    if (!name) {
      toast.error("הזן שם לחתימה");
      return;
    }
    try {
      await signFn({ data: { week_id: data.week.id, role, signature_name: name } });
      qc.invalidateQueries({ queryKey: invalidateKey });
      toast.success("נחתם");
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function reopen() {
    if (!data?.week || !confirm("לפתוח את השבוע מחדש ולמחוק חתימות?")) return;
    try {
      await reopenFn({ data: { week_id: data.week.id } });
      qc.invalidateQueries({ queryKey: invalidateKey });
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  function openMoveWizard() {
    const incomplete = (data?.missions ?? []).filter((mission) => !mission.done);
    if (!incomplete.length) {
      toast.info("כל המשימות לשבוע זה הושלמו. אין משימות להעברה.");
      return;
    }
    const ids = incomplete.map((mission) => mission.id);
    const dayMap: Record<string, number> = {};
    const timeMap: Record<string, string> = {};
    const scopeMap: Record<string, "occurrence" | "future"> = {};
    incomplete.forEach((mission) => {
      dayMap[mission.id] = mission.day_of_week;
      timeMap[mission.id] = mission.due_time?.slice(0, 5) ?? "";
      scopeMap[mission.id] = "occurrence";
    });
    setSelectedMoveIds(ids);
    setMoveDays(dayMap);
    setMoveTimes(timeMap);
    setMoveScopes(scopeMap);
    setMoveConflicts({});
    setBulkMoveDay("");
    setMoveRequestToken(crypto.randomUUID());
    setMoveStep(1);
    setMoveOpen(true);
  }

  async function confirmMove() {
    if (!data?.week || !selectedMoveIds.length) return;
    const target = shiftWorkweek(year, week, 1);
    const targetRange = isoWeekToRange(target.year, target.week);
    setMoving(true);
    try {
      const assignments = selectedMoveIds.map((id) => {
        const day = moveDays[id] ?? 0;
        const mission = data.missions.find((item) => item.id === id);
        return {
          mission_id: id,
          destination_day: day,
          destination_date: workdayDate(targetRange, day as any).toISOString().slice(0, 10),
          due_time: moveTimes[id] || null,
          recurrence_scope: moveScopes[id] ?? "occurrence",
          conflict_resolution: mission?.series_id ? (moveConflicts[id] ?? "keep_both") : undefined,
        };
      });
      const res: any = await moveFn({
        data: { week_id: data.week.id, request_token: moveRequestToken, assignments },
      });
      qc.invalidateQueries({ queryKey: invalidateKey });
      qc.invalidateQueries({ queryKey: ["mission-week", res.target.year, res.target.week, ownerId] });
      setMoveOpen(false);
      toast.success(`הועברו ${res.moved} משימות לשבוע הבא`, {
        action: {
          label: "פתח שבוע הבא",
          onClick: () => {
            setYear(res.target.year);
            setWeek(res.target.week);
          },
        },
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setMoving(false);
    }
  }

  async function exportPdf() {
    if (!data?.week) return;
    try {
      await downloadWeeklyPDF(data.week, data.missions, data.day_notes ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function exportDocx() {
    if (!data?.week) return;
    try {
      await downloadWeeklyDOCX(data.week, data.missions, data.day_notes ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function step(delta: number) {
    const next = shiftWorkweek(year, week, delta);
    setYear(next.year);
    setWeek(next.week);
  }
  function goToday() {
    setYear(today.year);
    setWeek(today.week);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">תכנית שבועית</h1>
          <p className="text-sm text-muted-foreground">
            שבוע {week} · {formatWorkDate(range.start)} – {formatWorkDate(range.end)} · {year}
            {ownerId && ownerId !== myId && data?.is_owner === false && (
              <>
                {" "}
                · <span className="text-amber-600">צפייה בלוח של מנהל אחר</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {admins && admins.length > 0 && (
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger className="h-9 w-48 text-xs">
                <SelectValue placeholder="בחר מנהל" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.id === myId ? "הלוח שלי" : a.name}
                    {a.is_approver ? " ⭐" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => step(-1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            השבוע
          </Button>
          <Button variant="outline" size="sm" onClick={() => step(1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={openMoveWizard}
              title="העבר משימות שלא הושלמו לשבוע הבא"
            >
              <ArrowRightCircle className="w-4 h-4 ml-1" />
              העבר לשבוע הבא{unfinishedCount ? ` (${unfinishedCount})` : ""}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={!data?.week}>
                <FileText className="w-4 h-4 ml-1" />
                ייצוא
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportPdf}>
                <FileText className="w-4 h-4 ml-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportDocx}>
                <FileType className="w-4 h-4 ml-2" />
                DOCX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {locked && (
        <Card className="p-3 flex items-center justify-between gap-3 bg-emerald-500/10 border-emerald-500/30">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span className="font-medium">השבוע נחתם ונעול.</span>
            <span className="text-muted-foreground">
              {data?.week.author_signature_name ? `נגד לוגיסטיקה: ${data.week.author_signature_name} · ` : ""}
              {data?.week.approver_signature_name
                ? `מאשר: ${data.week.approver_signature_name}`
                : ""}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={reopen}>
            <Unlock className="w-4 h-4 ml-1" />
            פתח מחדש
          </Button>
        </Card>
      )}

      {isLoading || !data ? (
        <Card className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </Card>
      ) : !data.week ? (
        <Card className="p-12 text-center text-muted-foreground">
          המנהל לא יצר עדיין תכנית לשבוע זה.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {days.map((d) => {
            const date = workdayDate(range, d);
            const list = grouped[d] ?? [];
            return (
              <Card key={d} className="p-3 flex flex-col gap-2 min-h-[180px]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm">{DAY_NAMES[d]}</div>
                    <div className="text-xs text-muted-foreground">{formatWorkDate(date)}</div>
                  </div>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openCreate(d)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground/80">
                    גורמים משפיעים
                  </label>
                  <Textarea
                    rows={2}
                    value={dayNotes[d] ?? ""}
                    disabled={!canEdit}
                    onChange={(e) => onDayNoteChange(d, e.target.value)}
                    placeholder="..."
                    className="text-[11px] min-h-[40px] resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  {list.length === 0 && (
                    <div className="text-xs text-muted-foreground/70 py-2 text-center">
                      אין משימות
                    </div>
                  )}
                  {list.map((m) => (
                    <div
                      key={m.id}
                      className={`group rounded-md p-2 text-xs border bg-card ${m.done ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => canEdit && toggleDone(m)}
                          disabled={!canEdit}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${m.done ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground/40"} ${!canEdit ? "cursor-default" : ""}`}
                          aria-label="סמן כבוצע"
                        >
                          {m.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${m.done ? "line-through" : ""}`}>
                            <span className="inline-flex items-center gap-1">
                              {m.series_id && <Repeat2 className="w-3 h-3 text-sky-600" />}
                              {m.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            {m.due_time && (
                              <span className="inline-flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                {m.due_time.slice(0, 5)}
                              </span>
                            )}
                            {m.reminder_at && (
                              <span className="inline-flex items-center gap-0.5">
                                <Bell className="w-3 h-3" />
                                {new Date(m.reminder_at).toLocaleString("he-IL", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                            {m.carried_from_id && (
                              <span className="inline-flex items-center gap-0.5 text-amber-600">
                                <ArrowRightCircle className="w-3 h-3" />
                                הועבר
                              </span>
                            )}
                            {m.recurrence_summary && (
                              <span className="text-sky-700">{m.recurrence_summary}</span>
                            )}
                          </div>
                          {m.details && (
                            <div className="text-muted-foreground text-[11px] mt-0.5 whitespace-pre-wrap break-words">
                              {m.details}
                            </div>
                          )}
                        </div>
                        {canEdit && (
                          <div className="opacity-0 group-hover:opacity-100 transition flex gap-0.5">
                            <button
                              onClick={() => openEdit(m)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeMission(m)}
                              className="p-1 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notes + signatures */}
      {data?.week && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-3 md:col-span-1">
            <div className="text-sm font-semibold mb-2">הערות שבועיות</div>
            <Textarea
              rows={5}
              value={notesDraft}
              disabled={!canEdit}
              onChange={(e) => {
                setNotesDraft(e.target.value);
                setNotesDirty(true);
              }}
              placeholder="הערות, סיכומים, יעדים..."
            />
            {notesDirty && canEdit && (
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={saveNotes}>
                  שמור הערות
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-3">
            <div className="text-sm font-semibold mb-2">חתימת נגד לוגיסטיקה</div>
            {data.week.author_signed_at ? (
              <div className="text-sm">
                <div className="font-medium">{data.week.author_signature_name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(data.week.author_signed_at).toLocaleString("he-IL")}
                </div>
              </div>
            ) : canSignAuthor ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="שם נגד הלוגיסטיקה"
                />
                <Button size="sm" onClick={() => sign("author")}>
                  חתום כנגד לוגיסטיקה
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">ממתין לחתימת בעל הלוח</div>
            )}
          </Card>

          <Card className="p-3">
            <div className="text-sm font-semibold mb-2">אישור מנהל עבודה</div>
            {data.week.approver_signed_at ? (
              <div className="text-sm">
                <div className="font-medium">{data.week.approver_signature_name}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(data.week.approver_signed_at).toLocaleString("he-IL")}
                </div>
              </div>
            ) : canSignApprover ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="שם המנהל"
                />
                <Button size="sm" onClick={() => sign("approver")}>
                  אשר ונעל את השבוע
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">רק מנהל עבודה רשאי לחתום כאן</div>
            )}
          </Card>
        </div>
      )}

      <Dialog open={editor.open} onOpenChange={(o) => setEditor((e) => ({ ...e, open: o }))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editor.mission ? "עריכת משימה" : `משימה חדשה · ${DAY_NAMES[editor.day]}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת המשימה"
              autoFocus
            />
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="פרטים (אופציונלי)"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  שעה
                </span>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  dir="ltr"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  תזכורת
                </span>
                <Input
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(e) => setReminderAt(e.target.value)}
                  dir="ltr"
                />
              </label>
            </div>
            <div className="rounded-lg border p-3 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={repeatEnabled}
                  onChange={(event) => setRepeatEnabled(event.target.checked)}
                  disabled={!!editor.mission?.series_id}
                  className="w-4 h-4"
                />
                <Repeat2 className="w-4 h-4 text-sky-600" />
                משימה חוזרת
              </label>
              {repeatEnabled && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span>חזור כל</span>
                    <Input
                      type="number"
                      min={1}
                      max={52}
                      value={repeatInterval}
                      onChange={(event) => setRepeatInterval(Number(event.target.value))}
                      className="w-20"
                    />
                    <span>שבועות</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {WORK_DAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={repeatDays.includes(day) ? "default" : "outline"}
                        onClick={() =>
                          setRepeatDays((current) =>
                            current.includes(day)
                              ? current.filter((value) => value !== day)
                              : [...current, day].sort(),
                          )
                        }
                      >
                        {DAY_NAMES[day]}
                      </Button>
                    ))}
                  </div>
                  <label className="grid grid-cols-[90px_1fr] items-center gap-2 text-xs">
                    <span>תאריך התחלה</span>
                    <Input
                      type="date"
                      value={repeatStart}
                      onChange={(event) => setRepeatStart(event.target.value)}
                      dir="ltr"
                    />
                  </label>
                  <label className="grid grid-cols-[90px_1fr] items-center gap-2 text-xs">
                    <span>סיום</span>
                    <Select value={repeatEndType} onValueChange={(value: any) => setRepeatEndType(value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">ללא תאריך סיום</SelectItem>
                        <SelectItem value="date">בתאריך</SelectItem>
                        <SelectItem value="count">אחרי מספר מופעים</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  {repeatEndType === "date" && (
                    <Input
                      type="date"
                      value={repeatEndDate}
                      onChange={(event) => setRepeatEndDate(event.target.value)}
                      dir="ltr"
                    />
                  )}
                  {repeatEndType === "count" && (
                    <Input
                      type="number"
                      min={1}
                      value={repeatCount}
                      onChange={(event) => setRepeatCount(Number(event.target.value))}
                    />
                  )}
                  {editor.mission?.series_id && (
                    <label className="grid grid-cols-[90px_1fr] items-center gap-2 text-xs">
                      <span>החל שינויים על</span>
                      <Select value={recurrenceScope} onValueChange={(value: any) => setRecurrenceScope(value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="this">המופע הזה בלבד</SelectItem>
                          <SelectItem value="future">המופע הזה והבאים</SelectItem>
                          <SelectItem value="all">כל הסדרה</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                  )}
                </>
              )}
            </div>
            {editor.mission && (
              <label className="flex items-center gap-2 text-sm pt-1">
                <input
                  type="checkbox"
                  checked={!!editor.mission?.done}
                  onChange={() => editor.mission && toggleDone(editor.mission)}
                  className="w-4 h-4"
                />
                סמן כבוצע
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor({ open: false, day: 0 })}>
              ביטול
            </Button>
            <Button onClick={saveMission} disabled={saving || !title.trim()}>
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-1" />}שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={(open) => !moving && setMoveOpen(open)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>העברת משימות לשבוע הבא · שלב {moveStep} מתוך 3</DialogTitle>
          </DialogHeader>

          {moveStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">בחר את המשימות שלא הושלמו שברצונך להעביר.</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setSelectedMoveIds((data?.missions ?? []).filter((m) => !m.done).map((m) => m.id))
                    }
                  >
                    בחר הכל
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedMoveIds([])}>
                    נקה
                  </Button>
                </div>
              </div>
              <div className="text-sm font-medium">{selectedMoveIds.length} משימות נבחרו</div>
              {WORK_DAYS.map((day) => {
                const missions = (data?.missions ?? []).filter(
                  (mission) => !mission.done && mission.day_of_week === day,
                );
                if (!missions.length) return null;
                return (
                  <div key={day} className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground">{DAY_NAMES[day]}</div>
                    {missions.map((mission) => (
                      <label key={mission.id} className="flex items-start gap-3 rounded-lg border p-3">
                        <input
                          type="checkbox"
                          checked={selectedMoveIds.includes(mission.id)}
                          onChange={(event) =>
                            setSelectedMoveIds((current) =>
                              event.target.checked
                                ? [...current, mission.id]
                                : current.filter((id) => id !== mission.id),
                            )
                          }
                          className="w-5 h-5 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{mission.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {DAY_NAMES[mission.day_of_week]} · {mission.occurrence_date ?? ""}
                            {mission.due_time ? ` · ${mission.due_time.slice(0, 5)}` : ""}
                          </div>
                          {mission.details && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {mission.details}
                            </div>
                          )}
                        </div>
                        {mission.series_id && <Repeat2 className="w-4 h-4 text-sky-600" />}
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {moveStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                קבע יום ושעה לכל משימה בשבוע {shiftWorkweek(year, week, 1).week}.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg bg-muted/50 p-3">
                <span className="text-sm font-medium">הקצה את כל הנבחרות ליום:</span>
                <Select
                  value={bulkMoveDay}
                  onValueChange={(value) => {
                    setBulkMoveDay(value);
                    const day = Number(value);
                    setMoveDays((current) => {
                      const next = { ...current };
                      selectedMoveIds.forEach((id) => { next[id] = day; });
                      return next;
                    });
                  }}
                >
                  <SelectTrigger className="sm:w-64"><SelectValue placeholder="בחר יום" /></SelectTrigger>
                  <SelectContent>
                    {WORK_DAYS.map((day) => {
                      const target = shiftWorkweek(year, week, 1);
                      const targetRange = isoWeekToRange(target.year, target.week);
                      return (
                        <SelectItem key={day} value={String(day)}>
                          {DAY_NAMES[day]} · {formatWorkDate(workdayDate(targetRange, day as any))}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedMoveIds.map((id) => {
                const mission = data?.missions.find((item) => item.id === id);
                if (!mission) return null;
                const target = shiftWorkweek(year, week, 1);
                const targetRange = isoWeekToRange(target.year, target.week);
                return (
                  <div key={id} className="rounded-lg border p-3 space-y-2">
                    <div className="font-medium text-sm">{mission.title}</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Select
                        value={String(moveDays[id] ?? 0)}
                        onValueChange={(value) =>
                          setMoveDays((current) => ({ ...current, [id]: Number(value) }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WORK_DAYS.map((day) => (
                            <SelectItem key={day} value={String(day)}>
                              {DAY_NAMES[day]} · {formatWorkDate(workdayDate(targetRange, day as any))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="time"
                        value={moveTimes[id] ?? ""}
                        onChange={(event) =>
                          setMoveTimes((current) => ({ ...current, [id]: event.target.value }))
                        }
                        dir="ltr"
                      />
                    </div>
                    {mission.series_id && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Select
                          value={moveScopes[id] ?? "occurrence"}
                          onValueChange={(value: any) =>
                            setMoveScopes((current) => ({ ...current, [id]: value }))
                          }
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="occurrence">העבר רק את המופע הזה</SelectItem>
                            <SelectItem value="future">שנה גם את המופעים הבאים</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={moveConflicts[id] ?? "keep_both"}
                          onValueChange={(value: any) =>
                            setMoveConflicts((current) => ({ ...current, [id]: value }))
                          }
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keep_both">במקרה התנגשות: השאר את שתיהן</SelectItem>
                            <SelectItem value="replace">במקרה התנגשות: החלף את הקיימת</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {moveStep === 3 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                בדיקה אחרונה — השינוי יתבצע רק לאחר האישור.
              </p>
              {selectedMoveIds.map((id) => {
                const mission = data?.missions.find((item) => item.id === id);
                if (!mission) return null;
                const target = shiftWorkweek(year, week, 1);
                const targetRange = isoWeekToRange(target.year, target.week);
                const day = moveDays[id] ?? 0;
                return (
                  <div key={id} className="flex justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                    <span className="font-medium">{mission.title}</span>
                    <span className="text-muted-foreground">
                      {DAY_NAMES[day]} · {formatWorkDate(workdayDate(targetRange, day as any))}
                      {moveTimes[id] ? ` · ${moveTimes[id]}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={moving} onClick={() => setMoveOpen(false)}>
              ביטול
            </Button>
            {moveStep > 1 && (
              <Button variant="outline" disabled={moving} onClick={() => setMoveStep((moveStep - 1) as 1 | 2)}>
                חזרה
              </Button>
            )}
            {moveStep < 3 ? (
              <Button
                disabled={moveStep === 1 && selectedMoveIds.length === 0}
                onClick={() => setMoveStep((moveStep + 1) as 2 | 3)}
              >
                המשך
              </Button>
            ) : (
              <Button disabled={moving} onClick={confirmMove}>
                {moving && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
                אשר והעבר {selectedMoveIds.length} משימות
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
