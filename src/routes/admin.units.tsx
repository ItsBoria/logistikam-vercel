import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { createUnit, listActiveUnits } from "@/lib/membership.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/units")({
  ssr: false,
  head: () => ({ meta: [{ title: "יחידות - פאנל ניהול" }] }),
  component: () => <AdminShell adminOnly><UnitsPage /></AdminShell>,
});

function UnitsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listActiveUnits);
  const createFn = useServerFn(createUnit);
  const { data: units, isLoading } = useQuery({ queryKey: ["active-units"], queryFn: () => listFn() });
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  async function create() {
    try {
      await createFn({ data: { name, code } });
      toast.success("היחידה נוצרה ונבחרה כיחידה פעילה");
      setName("");
      setCode("");
      qc.invalidateQueries({ queryKey: ["active-units"] });
      qc.invalidateQueries({ queryKey: ["active-unit"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } catch (e: any) {
      toast.error(e.message || "שגיאה ביצירת יחידה");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">יחידות</h1>
        <p className="text-sm text-muted-foreground">בעל המערכת יוצר כאן יחידות. אחרי יצירת יחידה, אפשר לבחור אותה למעלה ולהוסיף לה צוותים.</p>
      </div>

      <Card className="p-4 grid gap-3 md:grid-cols-[1fr_180px_auto] items-end">
        <div>
          <label className="text-sm">שם יחידה</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: גדוד לוגיסטיקה" />
        </div>
        <div>
          <label className="text-sm">קוד, אופציונלי</label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="LOG-1" dir="ltr" />
        </div>
        <Button onClick={create} disabled={name.trim().length < 2}>
          <Plus className="w-4 h-4 ml-2" /> צור יחידה
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">טוען...</Card>
        ) : (units ?? []).length ? (
          (units ?? []).map((unit: any) => (
            <Card key={unit.unit_id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">{unit.unit_name}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{unit.unit_code || unit.unit_id}</div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground">אין יחידות עדיין</Card>
        )}
      </div>
    </div>
  );
}
