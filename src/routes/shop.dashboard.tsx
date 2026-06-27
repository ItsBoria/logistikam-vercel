import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Coins,
  Loader2,
  PackagePlus,
  RotateCcw,
  Search,
  ShoppingCart,
  WalletCards,
} from "lucide-react";
import { getTeamSession } from "@/lib/team-session";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createTeamReplacementItem,
  getRaspDashboard,
  requestCatalogItem,
  returnTeamReplacementItem,
  uploadReplacementAttachment,
} from "@/lib/rasp-dashboard.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "מסך לרס״פ" }] }),
  component: RaspDashboard,
});

const currency = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});
const dateFormat = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const orderLabels: Record<string, string> = {
  pending: "ממתינות לטיפול",
  awaiting_approval: "ממתינות לאישור",
  approved: "אושרו",
  preparing: "בהכנה",
  ready: "מוכנות לאיסוף",
  completed: "הושלמו",
  cancelled: "בוטלו",
};
const replacementLabels: Record<string, string> = {
  held: "נמצא אצל הרס״פ",
  awaiting_return: "ממתין להחזרה",
  returned: "הוחזר",
  overdue: "באיחור",
  lost_or_damaged: "אבד או ניזוק",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function RaspDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const teamSession = typeof window !== "undefined" ? getTeamSession() : null;
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-01-01`);
  const [to, setTo] = useState(todayIso());
  const [categoryId, setCategoryId] = useState("all");
  const [ranking, setRanking] = useState<"quantity" | "spending" | "frequency">("quantity");
  const [replacementFilter, setReplacementFilter] = useState("all");
  const [replacementSearch, setReplacementSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [returning, setReturning] = useState<any>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const dashboardFn = useServerFn(getRaspDashboard);
  const createReplacementFn = useServerFn(createTeamReplacementItem);
  const returnReplacementFn = useServerFn(returnTeamReplacementItem);
  const requestItemFn = useServerFn(requestCatalogItem);
  const uploadAttachmentFn = useServerFn(uploadReplacementAttachment);
  const queryKey = ["rasp-dashboard", from, to, categoryId];
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => dashboardFn({
      data: { from, to, replacement_category: categoryId === "all" ? null : categoryId },
    }),
  });

  const [replacementForm, setReplacementForm] = useState({
    category: "",
    product_id: "",
    quantity: 1,
    received_from_name: "",
    received_from_phone: "",
    received_from_unit: "",
    received_date: todayIso(),
    expected_return_date: "",
    condition_received: "",
    serial_number: "",
    notes: "",
    attachment_path: "",
  });
  const [returnForm, setReturnForm] = useState({
    actual_return_date: todayIso(),
    returned_to_name: "",
    condition_returned: "",
    notes: "",
    confirmed: false,
  });
  const [requestForm, setRequestForm] = useState({
    suggested_name: "",
    suggested_category: "",
    reason: "",
  });

  const rankingRows = ranking === "spending"
    ? data?.items_by_spending ?? []
    : ranking === "frequency"
      ? data?.items_by_frequency ?? []
      : data?.items_by_quantity ?? [];
  const rankingMax = Math.max(1, ...rankingRows.map((item: any) =>
    ranking === "spending" ? item.amount : ranking === "frequency" ? item.orders : item.quantity,
  ));
  const replacementProducts = (data?.products ?? []).filter(
    (product: any) => !replacementForm.category || (product.category?.trim() || "ללא קטגוריה") === replacementForm.category,
  );
  const visibleReplacements = useMemo(() => {
    const q = replacementSearch.trim().toLowerCase();
    return (data?.replacements ?? []).filter((item: any) => {
      if (replacementFilter === "held" && !["held", "awaiting_return"].includes(item.status)) return false;
      if (replacementFilter === "due_soon") {
        if (!item.expected_return_date || item.status === "returned") return false;
        const days = Math.ceil((new Date(item.expected_return_date).getTime() - Date.now()) / 86_400_000);
        if (days < 0 || days > 7) return false;
      }
      if (replacementFilter === "overdue" && item.status !== "overdue") return false;
      if (replacementFilter === "returned" && item.status !== "returned") return false;
      if (q && !`${item.replacement_products?.name ?? ""} ${item.received_from_name} ${item.serial_number ?? ""}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [data?.replacements, replacementFilter, replacementSearch]);

  async function addReplacement() {
    setSaving(true);
    try {
      await createReplacementFn({
        data: {
          product_id: replacementForm.product_id,
          quantity: Number(replacementForm.quantity),
          received_from_name: replacementForm.received_from_name,
          received_from_phone: replacementForm.received_from_phone || null,
          received_from_unit: replacementForm.received_from_unit || null,
          received_date: replacementForm.received_date,
          expected_return_date: replacementForm.expected_return_date || null,
          condition_received: replacementForm.condition_received || null,
          serial_number: replacementForm.serial_number || null,
          notes: replacementForm.notes || null,
          attachment_path: replacementForm.attachment_path || null,
        },
      });
      setAddOpen(false);
      setReplacementForm((form) => ({
        ...form,
        product_id: "",
        quantity: 1,
        received_from_name: "",
        received_from_phone: "",
        received_from_unit: "",
        expected_return_date: "",
        condition_received: "",
        serial_number: "",
        notes: "",
        attachment_path: "",
      }));
      await qc.invalidateQueries({ queryKey: ["rasp-dashboard"] });
      toast.success("פריט ההחלפה נוסף");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadAttachment(file: File) {
    setSaving(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadAttachmentFn({
        data: {
          filename: file.name,
          content_type: file.type as any,
          data_base64: dataBase64,
        },
      });
      setReplacementForm((form) => ({ ...form, attachment_path: result.path }));
      toast.success("הקובץ צורף");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function markReturned() {
    if (!returning || !returnForm.confirmed) return;
    setSaving(true);
    try {
      await returnReplacementFn({
        data: {
          id: returning.id,
          actual_return_date: returnForm.actual_return_date,
          returned_to_name: returnForm.returned_to_name,
          condition_returned: returnForm.condition_returned || null,
          notes: returnForm.notes || null,
          confirmed: true,
        },
      });
      setReturning(null);
      await qc.invalidateQueries({ queryKey: ["rasp-dashboard"] });
      toast.success("הפריט סומן כמוחזר");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitCatalogRequest() {
    setSaving(true);
    try {
      await requestItemFn({
        data: {
          suggested_name: requestForm.suggested_name,
          suggested_category: requestForm.suggested_category || null,
          reason: requestForm.reason,
        },
      });
      setRequestOpen(false);
      setRequestForm({ suggested_name: "", suggested_category: "", reason: "" });
      toast.success("הבקשה נשלחה לבדיקת מנהל");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="p-8 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="font-semibold">לא ניתן לטעון את מסך הרס״פ</div>
          <div className="text-sm text-muted-foreground">{(error as Error)?.message}</div>
          <Button onClick={() => navigate({ to: "/" })}>חזרה</Button>
        </Card>
      </div>
    );
  }

  const usedTone = data.budget.used_percentage >= 90
    ? "text-destructive"
    : data.budget.used_percentage >= 75 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="min-h-screen bg-secondary/25" dir="rtl">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">מסך לרס״פ</h1>
            <p className="text-sm text-muted-foreground">{data.team.name} · מתחילת השנה ועד היום</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/shop"><ShoppingCart className="w-4 h-4 ml-1" />הזמנה חדשה</Link></Button>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <PackagePlus className="w-4 h-4 ml-1" />הוספת פריט החלפה
            </Button>
            <Button asChild size="sm" variant="outline"><Link to="/shop/orders"><ClipboardList className="w-4 h-4 ml-1" />צפייה בהזמנות</Link></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-5">
        <Card className="p-3 flex flex-col lg:flex-row gap-3 lg:items-end">
          <label className="text-xs space-y-1"><span>מתאריך</span><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} dir="ltr" /></label>
          <label className="text-xs space-y-1"><span>עד תאריך</span><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} dir="ltr" /></label>
          <label className="text-xs space-y-1 lg:w-56">
            <span>קטגוריה</span>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {data.categories.map((category: any) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <Button variant="ghost" onClick={() => {
            setFrom(`${now.getFullYear()}-01-01`);
            setTo(todayIso());
            setCategoryId("all");
          }}><RotateCcw className="w-4 h-4 ml-1" />איפוס</Button>
        </Card>

        <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <SummaryCard icon={Coins} title="הוצאות מתחילת השנה" value={currency.format(data.budget.spent)}>
            {data.comparison.previous_year_percentage !== null && (
              <div className={`text-xs flex items-center gap-1 ${data.comparison.previous_year_percentage > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {data.comparison.previous_year_percentage > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                {Math.abs(data.comparison.previous_year_percentage)}% לעומת התקופה המקבילה
              </div>
            )}
          </SummaryCard>
          <SummaryCard icon={WalletCards} title="תקציב זמין" value={currency.format(data.budget.remaining)}>
            <Progress value={data.budget.used_percentage} className="mt-2" />
            <div className={`text-xs mt-1 ${usedTone}`}>{data.budget.used_percentage}% נוצל או שמור</div>
          </SummaryCard>
          <SummaryCard icon={ClipboardList} title="הזמנות פעילות" value={String(
            data.order_counts.pending + data.order_counts.awaiting_approval + data.order_counts.preparing + data.order_counts.ready,
          )}>
            <div className="text-xs text-muted-foreground">
              {data.order_counts.ready} מוכנות לאיסוף · {data.order_counts.preparing} בהכנה
            </div>
          </SummaryCard>
          <SummaryCard icon={RotateCcw} title="פריטי החלפה פתוחים" value={String(
            data.replacement_summary.held + data.replacement_summary.overdue,
          )}>
            <div className="text-xs text-muted-foreground">
              {data.replacement_summary.overdue} באיחור · {data.replacement_summary.due_soon} להחזרה בקרוב
            </div>
          </SummaryCard>
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          <Card className="p-4 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-bold">הפריטים בשימוש הגבוה ביותר</h2>
                <p className="text-xs text-muted-foreground">מבוסס על הזמנות שהושלמו בטווח שנבחר</p>
              </div>
              <Tabs value={ranking} onValueChange={(value) => setRanking(value as any)}>
                <TabsList>
                  <TabsTrigger value="quantity">כמות</TabsTrigger>
                  <TabsTrigger value="spending">עלות</TabsTrigger>
                  <TabsTrigger value="frequency">תדירות</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-3">
              {!rankingRows.length && <EmptyText text="אין עדיין נתוני שימוש בטווח הזה" />}
              {rankingRows.map((item: any, index: number) => {
                const value = ranking === "spending" ? item.amount : ranking === "frequency" ? item.orders : item.quantity;
                return (
                  <div key={item.product_id ?? item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{index + 1}. {item.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {ranking === "spending" ? currency.format(value) : ranking === "frequency" ? `${value} הזמנות` : `${value} יחידות`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(4, (value / rankingMax) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-bold mb-3">תמונת תקציב</h2>
            <dl className="space-y-3 text-sm">
              <BudgetLine label="תקציב כולל" value={data.budget.allocated} />
              <BudgetLine label="נוצל" value={data.budget.spent} />
              <BudgetLine label="בהזמנות פתוחות" value={data.budget.reserved} />
              <BudgetLine label="נותר" value={data.budget.remaining} strong />
            </dl>
            {data.budget.used_percentage >= 75 && (
              <div className={`mt-4 rounded-lg p-3 text-sm ${data.budget.used_percentage >= 90 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"}`}>
                <AlertTriangle className="w-4 h-4 inline ml-1" />
                {data.budget.used_percentage >= 90 ? "נוצלו מעל 90% מהתקציב" : "נוצלו מעל 75% מהתקציב"}
              </div>
            )}
          </Card>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="font-bold mb-4">מגמת הוצאות חודשית</h2>
            <div className="flex items-end gap-2 h-52 overflow-x-auto pb-2">
              {data.monthly.length === 0 && <EmptyText text="אין הוצאות חודשיות להצגה" />}
              {data.monthly.map((month: any) => {
                const max = Math.max(1, ...data.monthly.map((row: any) => row.amount));
                return (
                  <div key={month.month} className="min-w-16 flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${currency.format(month.amount)} · ${month.orders} הזמנות · ${month.top_item ?? ""}`}>
                    <div className="text-[10px] tabular-nums">{currency.format(month.amount)}</div>
                    <div className="w-8 rounded-t-md bg-violet-500/80 min-h-1" style={{ height: `${Math.max(3, (month.amount / max) * 75)}%` }} />
                    <div className="text-xs">{month.month.slice(5)}/{month.month.slice(2, 4)}</div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="font-bold mb-4">הוצאות לפי קטגוריה</h2>
            <div className="space-y-3">
              {!data.categories_spending.length && <EmptyText text="אין נתוני קטגוריות להצגה" />}
              {data.categories_spending.map((category: any) => (
                <div key={category.id ?? category.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: category.color }} />
                  <span className="flex-1 text-sm">{category.name}</span>
                  <span className="font-medium tabular-nums">{category.quantity} יחידות</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-xl font-bold">ניהול פריטי החלפה</h2>
              <p className="text-sm text-muted-foreground">מעקב אחר ציוד שהתקבל מאדם אחר ונדרש להחזירו</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setAddOpen(true)}><PackagePlus className="w-4 h-4 ml-1" />הוספת פריט החלפה</Button>
              <Button variant="outline" onClick={() => setRequestOpen(true)}>בקשה להוספת פריט</Button>
            </div>
          </div>
          <Card className="p-3 mb-3 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input className="pr-9" placeholder="חיפוש לפי פריט, אדם או מספר סידורי" value={replacementSearch} onChange={(e) => setReplacementSearch(e.target.value)} />
            </div>
            <Select value={replacementFilter} onValueChange={setReplacementFilter}>
              <SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="held">נמצאים אצל הרס״פ</SelectItem>
                <SelectItem value="due_soon">להחזרה בקרוב</SelectItem>
                <SelectItem value="overdue">באיחור</SelectItem>
                <SelectItem value="returned">הוחזרו</SelectItem>
              </SelectContent>
            </Select>
          </Card>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {!visibleReplacements.length && <Card className="p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">לא נמצאו פריטי החלפה</Card>}
            {visibleReplacements.map((item: any) => (
              <Card key={item.id} className={`p-4 space-y-3 ${item.status === "overdue" ? "border-destructive/40" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.replacement_products?.name}</h3>
                    <p className="text-xs text-muted-foreground">כמות {item.quantity} · התקבל מאת {item.received_from_name}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">תאריך קבלה</span><div>{dateFormat.format(new Date(`${item.received_date}T00:00:00`))}</div></div>
                  <div><span className="text-muted-foreground">החזרה מתוכננת</span><div>{item.expected_return_date ? dateFormat.format(new Date(`${item.expected_return_date}T00:00:00`)) : "לא נקבע"}</div></div>
                </div>
                {item.notes && <div className="text-xs rounded bg-muted/60 p-2">{item.notes}</div>}
                {!["returned", "lost_or_damaged"].includes(item.status) && (
                  <Button className="w-full" variant="outline" onClick={() => {
                    setReturning(item);
                    setReturnForm({ actual_return_date: todayIso(), returned_to_name: item.received_from_name, condition_returned: "", notes: "", confirmed: false });
                  }}>
                    <CheckCircle2 className="w-4 h-4 ml-1" />סימון כהוחזר
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="font-bold mb-3">פעילות אחרונה</h2>
            <div className="divide-y">
              {data.recent_activity.map((activity: any) => (
                <div key={activity.id} className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center">
                    {activity.type === "order" ? <ClipboardList className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{activity.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(activity.at).toLocaleString("he-IL")}</div>
                  </div>
                  <Badge variant="secondary">{orderLabels[activity.status] ?? replacementLabels[activity.status] ?? activity.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="font-bold mb-3">דורש תשומת לב</h2>
            <div className="space-y-2">
              <AttentionRow icon={Clock3} label="הזמנות ממתינות לאישור" value={data.order_counts.awaiting_approval} />
              <AttentionRow icon={AlertTriangle} label="פריטי החלפה באיחור" value={data.replacement_summary.overdue} danger={data.replacement_summary.overdue > 0} />
              <AttentionRow icon={ShoppingCart} label="הזמנות מוכנות לאיסוף" value={data.order_counts.ready} />
              <AttentionRow icon={CalendarDays} label="פריטים להחזרה בקרוב" value={data.replacement_summary.due_soon} />
            </div>
          </Card>
        </section>
      </main>

      <BottomTabBar pin={teamSession?.pin} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>הוספת פריט החלפה</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="text-sm space-y-1 block">
              <span>קטגוריית פריט *</span>
              <Select value={replacementForm.category} onValueChange={(value) => setReplacementForm((form) => ({ ...form, category: value, product_id: "" }))}>
                <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                <SelectContent>{data.categories.map((category: any) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="text-sm space-y-1 block">
              <span>פריט *</span>
              <Select disabled={!replacementForm.category} value={replacementForm.product_id} onValueChange={(value) => setReplacementForm((form) => ({ ...form, product_id: value }))}>
                <SelectTrigger><SelectValue placeholder={replacementForm.category ? "בחר פריט החלפה" : "בחר קטגוריה תחילה"} /></SelectTrigger>
                <SelectContent>{replacementProducts.map((product: any) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="כמות *"><Input type="number" min={1} value={replacementForm.quantity} onChange={(e) => setReplacementForm({ ...replacementForm, quantity: Number(e.target.value) })} /></Field>
              <Field label="התקבל מאת *"><Input value={replacementForm.received_from_name} onChange={(e) => setReplacementForm({ ...replacementForm, received_from_name: e.target.value })} /></Field>
              <Field label="תאריך קבלה *"><Input type="date" dir="ltr" value={replacementForm.received_date} onChange={(e) => setReplacementForm({ ...replacementForm, received_date: e.target.value })} /></Field>
              <Field label="תאריך החזרה מתוכנן"><Input type="date" dir="ltr" value={replacementForm.expected_return_date} onChange={(e) => setReplacementForm({ ...replacementForm, expected_return_date: e.target.value })} /></Field>
              <Field label="טלפון / פרטי קשר"><Input dir="ltr" value={replacementForm.received_from_phone} onChange={(e) => setReplacementForm({ ...replacementForm, received_from_phone: e.target.value })} /></Field>
              <Field label="יחידה של נותן הפריט"><Input value={replacementForm.received_from_unit} onChange={(e) => setReplacementForm({ ...replacementForm, received_from_unit: e.target.value })} /></Field>
              <Field label="מצב הפריט בקבלה"><Input value={replacementForm.condition_received} onChange={(e) => setReplacementForm({ ...replacementForm, condition_received: e.target.value })} /></Field>
              <Field label="מספר סידורי"><Input dir="ltr" value={replacementForm.serial_number} onChange={(e) => setReplacementForm({ ...replacementForm, serial_number: e.target.value })} /></Field>
            </div>
            <Field label="הערות"><Textarea value={replacementForm.notes} onChange={(e) => setReplacementForm({ ...replacementForm, notes: e.target.value })} /></Field>
            <Field label="צילום או מסמך">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAttachment(file);
                }}
              />
              {replacementForm.attachment_path && <span className="text-xs text-emerald-700">הקובץ צורף בהצלחה</span>}
            </Field>
            <Button variant="link" className="px-0" onClick={() => { setAddOpen(false); setRequestOpen(true); }}>הפריט לא קיים? בקשה להוספת פריט</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>ביטול</Button>
            <Button disabled={saving || !replacementForm.product_id || !replacementForm.received_from_name} onClick={addReplacement}>
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-1" />}שמירה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!returning} onOpenChange={(open) => !open && setReturning(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>סימון פריט כהוחזר</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm">{returning?.replacement_products?.name} · כמות {returning?.quantity}</div>
            <Field label="תאריך החזרה"><Input type="date" dir="ltr" value={returnForm.actual_return_date} onChange={(e) => setReturnForm({ ...returnForm, actual_return_date: e.target.value })} /></Field>
            <Field label="הוחזר אל"><Input value={returnForm.returned_to_name} onChange={(e) => setReturnForm({ ...returnForm, returned_to_name: e.target.value })} /></Field>
            <Field label="מצב בהחזרה"><Input value={returnForm.condition_returned} onChange={(e) => setReturnForm({ ...returnForm, condition_returned: e.target.value })} /></Field>
            <Field label="הערות"><Textarea value={returnForm.notes} onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm rounded-lg border p-3">
              <input type="checkbox" className="w-5 h-5" checked={returnForm.confirmed} onChange={(e) => setReturnForm({ ...returnForm, confirmed: e.target.checked })} />
              אני מאשר/ת שהפריט הוחזר
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)}>ביטול</Button>
            <Button disabled={saving || !returnForm.confirmed || !returnForm.returned_to_name} onClick={markReturned}>אישור החזרה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>בקשה להוספת פריט לקטלוג</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="שם הפריט המוצע"><Input value={requestForm.suggested_name} onChange={(e) => setRequestForm({ ...requestForm, suggested_name: e.target.value })} /></Field>
            <label className="text-sm space-y-1 block">
              <span>קטגוריה מוצעת</span>
              <Select value={requestForm.suggested_category} onValueChange={(value) => setRequestForm({ ...requestForm, suggested_category: value })}>
                <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                <SelectContent>{data.categories.map((category: any) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <Field label="הסבר"><Textarea value={requestForm.reason} onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })} /></Field>
            <p className="text-xs text-muted-foreground">הבקשה תישלח למנהל לבדיקה ולא תיצור פריט באופן אוטומטי.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>ביטול</Button>
            <Button disabled={saving || !requestForm.suggested_name || !requestForm.reason} onClick={submitCatalogRequest}>שליחת בקשה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, children }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="w-4 h-4" />{title}</div>
      <div className="text-2xl font-bold mt-2 tabular-nums">{value}</div>
      <div className="mt-2">{children}</div>
    </Card>
  );
}

function BudgetLine({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? "font-bold text-base border-t pt-3" : ""}`}><dt>{label}</dt><dd className="tabular-nums">{currency.format(value)}</dd></div>;
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "overdue" || status === "lost_or_damaged"
    ? "bg-destructive/10 text-destructive"
    : status === "returned"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "awaiting_return" ? "bg-amber-500/10 text-amber-700" : "";
  return <Badge variant="secondary" className={cls}>{replacementLabels[status] ?? status}</Badge>;
}

function AttentionRow({ icon: Icon, label, value, danger = false }: any) {
  return <div className={`flex items-center gap-3 rounded-lg border p-3 ${danger ? "border-destructive/30 bg-destructive/5" : ""}`}><Icon className={`w-4 h-4 ${danger ? "text-destructive" : "text-muted-foreground"}`} /><span className="flex-1 text-sm">{label}</span><strong>{value}</strong></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm space-y-1 block"><span>{label}</span>{children}</label>;
}

function EmptyText({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground text-center py-8">{text}</div>;
}
