import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Check, RotateCcw, Settings2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAdminPreferences } from "@/hooks/use-admin-preferences";
import { DASHBOARD_WIDGETS, saveMyAdminPreferences, type DashboardWidget } from "@/lib/admin-preferences.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/preferences")({
  ssr: false,
  head: () => ({ meta: [{ title: "העדפות אישיות - ניהול" }] }),
  component: () => <AdminShell><PreferencesPage /></AdminShell>,
});

const LABELS: Record<DashboardWidget, string> = {
  kpis: "מדדי מפתח", attention: "דורש תשומת לב", budgets: "תקציבי צוותים",
  stock: "מלאי נמוך", recent_orders: "הזמנות אחרונות",
};
const DEFAULTS = {
  default_section: "/admin", visible_widgets: [...DASHBOARD_WIDGETS],
  widget_order: [...DASHBOARD_WIDGETS], pinned_actions: [], saved_filters: {},
  compact_mode: false, reduced_animations: false, appearance: "system",
};

function PreferencesPage() {
  const qc = useQueryClient();
  const saveFn = useServerFn(saveMyAdminPreferences);
  const { data, isLoading } = useAdminPreferences();
  const [form, setForm] = useState<any>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);

  function move(widget: DashboardWidget, direction: -1 | 1) {
    const order = [...form.widget_order];
    const index = order.indexOf(widget);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    setForm({ ...form, widget_order: order });
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        default_section: form.default_section, visible_widgets: form.visible_widgets,
        widget_order: form.widget_order, pinned_actions: form.pinned_actions ?? [],
        saved_filters: form.saved_filters ?? {}, compact_mode: !!form.compact_mode,
        reduced_animations: !!form.reduced_animations, appearance: form.appearance,
      };
      await saveFn({ data: payload });
      qc.setQueryData(["admin-preferences"], payload);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      toast.success("ההעדפות האישיות נשמרו");
    } catch (error: any) { toast.error(error.message || "שמירת ההעדפות נכשלה"); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="admin-skeleton h-72 rounded-2xl" />;
  return (
    <div className="space-y-5 admin-stagger">
      <div>
        <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">הפאנל שלי</h1></div>
        <p className="mt-1 text-sm text-muted-foreground">הגדרות אישיות לחשבון שלך בלבד.</p>
      </div>
      <Card className="p-5 admin-card">
        <h2 className="font-bold">כניסה ותצוגה</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1.5 block text-sm">עמוד פתיחה</label>
            <Select value={form.default_section} onValueChange={(v) => setForm({ ...form, default_section: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="/admin">סקירה</SelectItem><SelectItem value="/admin/orders">הזמנות</SelectItem>
                <SelectItem value="/admin/products">מוצרים</SelectItem><SelectItem value="/admin/stock">מלאי</SelectItem>
                <SelectItem value="/admin/notifications">התראות</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><label className="mb-1.5 block text-sm">מראה</label>
            <Select value={form.appearance} onValueChange={(v) => setForm({ ...form, appearance: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="system">לפי המכשיר</SelectItem><SelectItem value="light">בהיר</SelectItem><SelectItem value="dark">כהה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 divide-y">
          <PrefSwitch label="תצוגה קומפקטית" help="פחות רווחים ויותר מידע." checked={!!form.compact_mode} onChange={(v) => setForm({ ...form, compact_mode: v })} />
          <PrefSwitch label="הפחתת אנימציות" help="מעברים קצרים ללא תנועה גדולה." checked={!!form.reduced_animations} onChange={(v) => setForm({ ...form, reduced_animations: v })} />
        </div>
      </Card>
      <Card className="p-5 admin-card">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-bold">סדר רכיבי לוח הבקרה</h2><p className="mt-1 text-xs text-muted-foreground">הסתרה והזזה נגישה גם בנייד.</p></div>
          <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, visible_widgets: [...DASHBOARD_WIDGETS], widget_order: [...DASHBOARD_WIDGETS] })}><RotateCcw className="h-4 w-4" /> איפוס</Button>
        </div>
        <div className="mt-4 space-y-2">
          {form.widget_order.map((widget: DashboardWidget, index: number) => (
            <div key={widget} className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40">
              <Switch checked={form.visible_widgets.includes(widget)} onCheckedChange={(checked) => setForm({
                ...form, visible_widgets: checked ? [...form.visible_widgets, widget] : form.visible_widgets.filter((v: string) => v !== widget),
              })} />
              <span className="flex-1 text-sm font-medium">{LABELS[widget]}</span>
              <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => move(widget, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" disabled={index === form.widget_order.length - 1} onClick={() => move(widget, 1)}><ArrowDown className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </Card>
      <div className="sticky bottom-24 z-20 flex justify-end">
        <Button onClick={save} disabled={saving} className="min-w-36 shadow-lg active:scale-[.98]">
          {saved ? <><Check className="h-4 w-4" /> נשמר</> : saving ? "שומר..." : "שמירת העדפות"}
        </Button>
      </div>
    </div>
  );
}

function PrefSwitch({ label, help, checked, onChange }: { label: string; help: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 py-4"><div><div className="text-sm font-medium">{label}</div><div className="text-xs text-muted-foreground">{help}</div></div><Switch checked={checked} onCheckedChange={onChange} /></div>;
}
