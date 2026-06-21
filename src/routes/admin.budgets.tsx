import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { History, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBudgetManagement, resetTeamBudget } from "@/lib/budget.functions";
import { formatCurrency } from "@/lib/pricing";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/budgets")({
  ssr: false,
  head: () => ({ meta: [{ title: "תקציבים ואיפוסים" }] }),
  component: () => <AdminShell><BudgetPage /></AdminShell>,
});

function BudgetPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getBudgetManagement);
  const resetFn = useServerFn(resetTeamBudget);
  const { data, isLoading } = useQuery({ queryKey: ["budget-management"], queryFn: () => getFn() });
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [carry, setCarry] = useState(true);
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!selected) return;
    setBusy(true);
    try {
      await resetFn({ data: { team_id: selected.id, new_budget: Number(amount), reason, apply_carry_over: carry } });
      toast.success("נפתחה תקופת תקציב חדשה");
      setSelected(null); setReason("");
      await qc.invalidateQueries({ queryKey: ["budget-management"] });
      await qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      await qc.invalidateQueries({ queryKey: ["shop"] });
    } catch (error: any) { toast.error(error.message); }
    finally { setBusy(false); }
  }

  if (isLoading) return <div className="admin-skeleton h-72 rounded-2xl" />;
  const activeByTeam = new Map((data?.periods ?? []).filter((p: any) => p.status === "active").map((p: any) => [p.team_id, p]));
  return (
    <div className="space-y-5 admin-stagger">
      <div><h1 className="text-2xl font-bold">תקציבים ואיפוסים</h1><p className="text-sm text-muted-foreground">כל איפוס שומר את התקופה הקודמת ויוצר היסטוריה חדשה.</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        {(data?.teams ?? []).map((team: any) => {
          const period: any = activeByTeam.get(team.id);
          const allocated = period ? Number(period.starting_budget) + Number(period.carry_over_amount) : Number(team.monthly_limit);
          return <Card key={team.id} className="p-4 admin-card">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-bold">{team.name}</h2><div className="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(allocated)}</div><p className="text-xs text-muted-foreground">תקופה פעילה: {period ? new Date(period.starts_at).toLocaleDateString("he-IL") : "ללא תקופה"}</p></div>
              <Button size="sm" variant="outline" onClick={() => { setSelected(team); setAmount(String(allocated)); }}><RotateCcw className="h-4 w-4" /> איפוס</Button>
            </div>
          </Card>;
        })}
      </div>
      <Card className="p-4 admin-card">
        <h2 className="flex items-center gap-2 font-bold"><History className="h-4 w-4" /> היסטוריית תקופות</h2>
        <div className="mt-3 divide-y">
          {(data?.periods ?? []).slice(0, 30).map((period: any) => (
            <div key={period.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span>{data?.teams.find((t: any) => t.id === period.team_id)?.name ?? "צוות"}</span>
              <span>{formatCurrency(Number(period.starting_budget) + Number(period.carry_over_amount))}</span>
              <span className="text-xs text-muted-foreground">{new Date(period.starts_at).toLocaleString("he-IL")} · {period.reset_type}</span>
            </div>
          ))}
        </div>
      </Card>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>איפוס תקציב — {selected?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm">תקציב התחלתי חדש</label><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" /></div>
            <div><label className="text-sm">סיבה או הערה תפעולית</label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <label className="flex items-center justify-between gap-3 rounded-xl border p-3"><span className="text-sm">החל את כלל העברת היתרה</span><Switch checked={carry} onCheckedChange={setCarry} /></label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>ביטול</Button><Button disabled={busy || reason.trim().length < 3 || !Number.isFinite(Number(amount))} onClick={reset}>{busy ? "מאפס..." : "אישור ופתיחת תקופה"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
