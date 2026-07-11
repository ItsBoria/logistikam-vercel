import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { getMyTeamContext, listActiveUnits, listTeamsForActiveUnit, setMyTeam, setMyUnit } from "@/lib/membership.functions";
import { setAdminActing, setTeamSession } from "@/lib/team-session";
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
  const [unitId, setUnitId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  const { data: units, isLoading: unitsLoading } = useQuery({
    enabled: !!session,
    queryKey: ["active-units"],
    queryFn: () => listUnitsFn(),
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    enabled: !!session && !!unitId,
    queryKey: ["teams-for-active-unit"],
    queryFn: () => listTeamsFn(),
    retry: false,
  });

  async function onUnitChange(nextUnitId: string) {
    setUnitId(nextUnitId);
    setTeamId("");
    setSaving(true);
    try {
      await setUnitFn({ data: { unit_id: nextUnitId } });
      setTeamSession(null);
      setAdminActing(false);
      await qc.invalidateQueries({ queryKey: ["teams-for-active-unit"] });
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
          ) : (
            <>
              <Select value={unitId} onValueChange={onUnitChange}>
                <SelectTrigger><SelectValue placeholder="בחר/י יחידה" /></SelectTrigger>
                <SelectContent>
                  {(units ?? []).map((u: any) => (
                    <SelectItem key={u.unit_id} value={u.unit_id}>
                      {u.unit_name}{u.role ? ` · ${u.role}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={teamId} onValueChange={setTeamId} disabled={!unitId || teamsLoading}>
                <SelectTrigger><SelectValue placeholder={teamsLoading ? "טוען צוותים..." : "בחר/י צוות"} /></SelectTrigger>
                <SelectContent>
                  {(teams ?? []).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{typeof t.monthly_limit === "number" ? ` · ₪${t.monthly_limit.toLocaleString("he-IL")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button disabled={!unitId || !teamId || saving} onClick={onContinue} className="w-full h-11">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "המשך לחנות"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/", replace: true });
              }}>
                <LogOut className="w-4 h-4 ml-2" /> יציאה
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
