import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { createUnit, listOwnerUnits, softDeleteOwnerUnit, updateOwnerUnit } from "@/lib/membership.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/units")({
  ssr: false,
  head: () => ({ meta: [{ title: "יחידות - פאנל ניהול" }] }),
  component: () => <AdminShell adminOnly><UnitsPage /></AdminShell>,
});

type UnitForm = {
  id?: string;
  name: string;
  code: string;
  logo_url: string;
  cover_image_url: string;
  contact_phone: string;
  accent_color: string;
  active: boolean;
  status: "active" | "pending_setup" | "ready" | "inactive";
  setup_status: "pending_setup" | "ready" | "active" | "inactive";
};

const emptyForm: UnitForm = {
  name: "",
  code: "",
  logo_url: "",
  cover_image_url: "",
  contact_phone: "",
  accent_color: "",
  active: true,
  status: "active",
  setup_status: "pending_setup",
};

function UnitsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listOwnerUnits);
  const createFn = useServerFn(createUnit);
  const updateFn = useServerFn(updateOwnerUnit);
  const deleteFn = useServerFn(softDeleteOwnerUnit);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<UnitForm | null>(null);

  const { data: units, isLoading } = useQuery({
    queryKey: ["owner-units", query],
    queryFn: () => listFn({ data: { query } }),
    staleTime: 20_000,
  });

  const editingTitle = useMemo(() => editing?.id ? "עריכת יחידה" : "יחידה חדשה", [editing?.id]);

  function openEdit(unit: any) {
    setEditing({
      id: unit.id,
      name: unit.name ?? "",
      code: unit.code ?? "",
      logo_url: unit.logo_url ?? "",
      cover_image_url: unit.cover_image_url ?? "",
      contact_phone: unit.contact_phone ?? "",
      accent_color: unit.accent_color ?? "",
      active: unit.active !== false,
      status: unit.status ?? "active",
      setup_status: unit.setup_status ?? "pending_setup",
    });
  }

  async function save() {
    if (!editing) return;
    try {
      if (editing.id) {
        await updateFn({ data: editing as any });
        toast.success("היחידה עודכנה");
      } else {
        await createFn({ data: editing as any });
        toast.success("היחידה נוצרה ונבחרה כיחידה פעילה");
      }
      setEditing(null);
      await qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message || "שגיאה בשמירת יחידה");
    }
  }

  async function remove(unit: any) {
    if (!confirm(`להעביר את "${unit.name}" למחיקה רכה? היחידה לא תופיע למשתמשים, אבל הנתונים יישמרו.`)) return;
    try {
      await deleteFn({ data: { id: unit.id } });
      toast.success("היחידה הועברה למחיקה רכה");
      await qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message || "שגיאה במחיקת יחידה");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">יחידות</h1>
          <p className="text-sm text-muted-foreground">ניהול יחידות מערכת, סטטוס, פרטי קשר ומיתוג. מחיקה היא רכה ושומרת נתונים.</p>
        </div>
        <Button onClick={() => setEditing(emptyForm)}>
          <Plus className="w-4 h-4 ml-2" /> יחידה חדשה
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש לפי שם, קוד או טלפון..." className="pr-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">טוען...</Card>
        ) : (units ?? []).length ? (
          (units ?? []).map((unit: any) => (
            <Card key={unit.id} className={`p-4 space-y-3 ${unit.active ? "" : "opacity-70"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold truncate">{unit.name}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{unit.code || unit.id}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(unit)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(unit)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap text-xs">
                <span className="px-2 py-1 rounded bg-muted">{unit.active ? "פעילה" : "לא פעילה"}</span>
                <span className="px-2 py-1 rounded bg-muted">{unit.status}</span>
                <span className="px-2 py-1 rounded bg-muted">{unit.setup_status}</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>צוותים: {unit.active_teams_count} / {unit.teams_count}</div>
                <div>מנהלים משויכים: {unit.admins?.length ?? 0}</div>
                {unit.contact_phone && <div dir="ltr">{unit.contact_phone}</div>}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground">אין יחידות להצגה</Card>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTitle}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div>
                <label className="text-sm">שם יחידה</label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">קוד יחידה</label>
                <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-sm">טלפון קשר</label>
                <Input value={editing.contact_phone} onChange={(e) => setEditing({ ...editing, contact_phone: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-sm">צבע מיתוג</label>
                <Input value={editing.accent_color} onChange={(e) => setEditing({ ...editing, accent_color: e.target.value })} placeholder="#2563eb" dir="ltr" />
              </div>
              <div>
                <label className="text-sm">לוגו URL</label>
                <Input value={editing.logo_url} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} dir="ltr" />
              </div>
              <div>
                <label className="text-sm">תמונת כיסוי URL</label>
                <Input value={editing.cover_image_url} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">סטטוס</label>
                  <Select value={editing.status} onValueChange={(v: any) => setEditing({ ...editing, status: v, active: v !== "inactive" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="pending_setup">pending_setup</SelectItem>
                      <SelectItem value="ready">ready</SelectItem>
                      <SelectItem value="inactive">inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">מצב הקמה</label>
                  <Select value={editing.setup_status} onValueChange={(v: any) => setEditing({ ...editing, setup_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_setup">pending_setup</SelectItem>
                      <SelectItem value="ready">ready</SelectItem>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="inactive">inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={editing.active} onCheckedChange={(active) => setEditing({ ...editing, active, status: active ? "active" : "inactive" })} />
                יחידה פעילה
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>ביטול</Button>
            <Button onClick={save} disabled={!editing?.name.trim()}>שמירה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
