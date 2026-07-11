import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import {
  getMyTeamContext,
  listActiveUnits,
  listMyUnitAccessRequests,
  listRequestableUnits,
  listTeamsForActiveUnit,
  setMyTeam,
  setMyUnit,
  submitUnitAccessRequest,
} from "@/lib/membership.functions";
import { clearClientSessionState, setAdminActing, setTeamSession } from "@/lib/team-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/select-team")({
  ssr: false,
  head: () => ({ meta: [{ title: "בחירת יחידה וצוות" }] }),
  component: SelectTeam,
});

function SelectTeam() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session, loading } = useSupabaseSession();
  const listUnitsFn = useServerFn(listActiveUnits);
  const listTeamsFn = useServerFn(listTeamsForActiveUnit);
  const setUnitFn = useServerFn(setMyUnit);
  const setTeamFn = useServerFn(setMyTeam);
  const ctxFn = useServerFn(getMyTeamContext);
  const requestableUnitsFn = useServerFn(listRequestableUnits);
  const myAccessRequestsFn = useServerFn(listMyUnitAccessRequests);
  const submitAccessRequestFn = useServerFn(submitUnitAccessRequest);
  const [unitId, setUnitId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestUnitId, setRequestUnitId] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  const { data: units, isLoading: unitsLoading } = useQuery({
    enabled: !!session,
    queryKey: ["active-units"],
    queryFn: () => listUnitsFn(),
  });
  const { data: requestableUnits } = useQuery({
    enabled: !!session && !unitsLoading && !(units ?? []).length,
    queryKey: ["requestable-units"],
    queryFn: () => requestableUnitsFn(),
  });
  const { data: myAccessRequests } = useQuery({
    enabled: !!session && !unitsLoading && !(units ?? []).length,
    queryKey: ["my-unit-access-requests"],
    queryFn: () => myAccessRequestsFn(),
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    enabled: !!session && !!unitId,
    queryKey: ["teams-for-active-unit", unitId],
    queryFn: () => listTeamsFn(),
    retry: false,
  });

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await qc.cancelQueries();
      clearClientSessionState();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      qc.clear();
      navigate({ to: "/", replace: true });
    } catch (e: any) {
      toast.error(e.message || "שגיאה ביציאה");
      setLoggingOut(false);
    }
  }

  async function onUnitChange(nextUnitId: string) {
    setUnitId(nextUnitId);
    setTeamId("");
    setSaving(true);
    try {
      await setUnitFn({ data: { unit_id: nextUnitId } });
      setTeamSession(null);
      setAdminActing(false);
      await qc.invalidateQueries({ queryKey: ["teams-for-active-unit", nextUnitId] });
    } catch (e: any) {
      toast.error(e.message || "שגיאה בבחירת יחידה");
    } finally {
      setSaving(false);
    }
  }

  async function onContinue() {
    if (!unitId || !teamId) return;
    setSaving(true);
    try {
      await setTeamFn({ data: { team_id: teamId } });
      const ctx = await ctxFn();
      if (ctx) {
        setTeamSession(ctx);
        setAdminActing(false);
        navigate({ to: "/shop", replace: true });
      }
    } catch (e: any) {
      toast.error(e.message || "שגיאה");
    } finally {
      setSaving(false);
    }
  }

  async function requestAccess() {
    if (!requestUnitId || hasPendingRequest) return;
    setSaving(true);
    try {
      const res = await submitAccessRequestFn({ data: { unit_id: requestUnitId, note: requestNote } });
      if ((res as any)?.status === "rejected_cooldown") {
        toast.error("הבקשה נדחתה לאחרונה. ניתן לנסות שוב לאחר תקופת ההמתנה.");
      } else {
        toast.info("בקשתך ממתינה לאישור מנהל היחידה");
      }
      setRequestNote("");
      await qc.invalidateQueries({ queryKey: ["my-unit-access-requests"] });
    } catch (e: any) {
      toast.error(e.message || "שגיאה בשליחת בקשת גישה");
    } finally {
      setSaving(false);
    }
  }

  const selectedRequest = (myAccessRequests ?? []).find((request: any) => request.unit_id === requestUnitId);
  const hasPendingRequest = selectedRequest?.status === "pending";
  const rejectedRequest = selectedRequest?.status === "rejected" ? selectedRequest : null;

  if (loading || !session) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-secondary/40 to-accent/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo size={80} className="mx-auto mb-4 rounded-3xl" />
          <h1 className="text-2xl font-bold">בחירת יחידה וצוות</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            קודם בוחרים יחידה, ואז מוצגים רק הצוותים שמורשים בתוך אותה יחידה.
          </p>
        </div>
        <Card className="p-6 shadow-xl space-y-4">
          {unitsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : !(units ?? []).length ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl bg-muted/70 p-4 text-sm text-muted-foreground">
                לא נמצאה לך גישה פעילה ליחידה. בחר יחידה ושלח בקשת גישה למנהל היחידה.
              </div>
              <div className="space-y-3 text-right">
                <Select value={requestUnitId} onValueChange={setRequestUnitId}>
                  <SelectTrigger><SelectValue placeholder="בחר/י יחידה לשליחת בקשת גישה" /></SelectTrigger>
                  <SelectContent>
                    {(requestableUnits ?? []).map((unit: any) => (
                      <SelectItem key={unit.unit_id} value={unit.unit_id}>{unit.unit_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasPendingRequest && (
                  <div className="rounded-lg bg-warning/15 p-3 text-sm text-warning-foreground">
                    בקשתך ממתינה לאישור מנהל היחידה
                  </div>
                )}
                {rejectedRequest && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    הבקשה הקודמת נדחתה. {rejectedRequest.review_notes ? `הערה: ${rejectedRequest.review_notes}` : ""}
                  </div>
                )}
                <textarea
                  className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="הערה קצרה למנהל היחידה, אופציונלי"
                  disabled={hasPendingRequest}
                />
                <Button className="w-full" disabled={!requestUnitId || saving || hasPendingRequest} onClick={requestAccess}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "שלח בקשת גישה"}
                </Button>
              </div>
              <Button variant="ghost" className="w-full" onClick={logout} disabled={loggingOut}>
                {loggingOut ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <LogOut className="w-4 h-4 ml-2" />}
                יציאה
              </Button>
            </div>
          ) : (
            <>
              <Select value={unitId} onValueChange={onUnitChange}>
                <SelectTrigger><SelectValue placeholder="בחר/י יחידה" /></SelectTrigger>
                <SelectContent>
                  {(units ?? []).map((unit: any) => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_name}{unit.role ? ` · ${unit.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={teamId} onValueChange={setTeamId} disabled={!unitId || teamsLoading}>
                <SelectTrigger><SelectValue placeholder={teamsLoading ? "טוען צוותים..." : "בחר/י צוות"} /></SelectTrigger>
                <SelectContent>
                  {(teams ?? []).map((team: any) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}{typeof team.monthly_limit === "number" ? ` · ₪${team.monthly_limit.toLocaleString("he-IL")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button disabled={!unitId || !teamId || saving} onClick={onContinue} className="w-full h-11">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "המשך לחנות"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={logout} disabled={loggingOut}>
                {loggingOut ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <LogOut className="w-4 h-4 ml-2" />}
                יציאה
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
