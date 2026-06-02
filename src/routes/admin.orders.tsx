import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import { listOrders, updateOrderStatus, listTeams } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Filter, X, Phone, User, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/orders")({
  ssr: false,
  head: () => ({ meta: [{ title: "הזמנות - פאנל ניהול" }] }),
  component: () => <AdminShell><OrdersPage /></AdminShell>,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "ממתינה",
  awaiting_approval: "ממתינה לאישור",
  approved: "אושרה",
  preparing: "בהכנה",
  ready: "מוכנה לאיסוף",
  completed: "הושלמה",
  cancelled: "בוטלה",
};
const STATUS_VARIANT: Record<string, string> = {
  pending: "secondary", awaiting_approval: "destructive", approved: "default",
  preparing: "default", ready: "default", completed: "outline", cancelled: "outline",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  awaiting_approval: "bg-warning text-warning-foreground",
  approved: "bg-primary/15 text-primary",
  preparing: "bg-primary/15 text-primary",
  ready: "bg-success text-success-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

function OrdersPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listOrders);
  const updateFn = useServerFn(updateOrderStatus);
  const teamsFn = useServerFn(listTeams);

  const [teamId, setTeamId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<any>(null);

  const { data: teams } = useQuery({ queryKey: ["admin-teams"], queryFn: () => teamsFn() });
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", teamId, status, from, to],
    queryFn: () => listFn({ data: {
      team_id: teamId === "all" ? null : teamId,
      status: status === "all" ? null : status,
      from: from || null,
      to: to ? new Date(to + "T23:59:59").toISOString() : null,
    } }),
  });

  async function changeStatus(id: string, s: string) {
    try {
      await updateFn({ data: { id, status: s as any } });
      toast.success("הסטטוס עודכן");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) { toast.error(e.message); }
  }

  function exportExcel() {
    if (!orders?.length) return;
    const rows = orders.flatMap((o: any) => (o.order_items as any[]).map(it => ({
      "מס׳ הזמנה": o.id.slice(0, 8),
      "תאריך": new Date(o.created_at).toLocaleString("he-IL"),
      "צוות": o.teams?.name ?? "",
      "סטטוס": STATUS_LABEL[o.status] ?? o.status,
      "מזמין": o.ordered_by_name ?? "",
      "טלפון": o.contact_phone ?? "",
      "מוצר": it.name,
      "מחיר": Number(it.price),
      "כמות": it.quantity,
      "סכום שורה": Number(it.price) * it.quantity,
      "סה״כ הזמנה": Number(o.total),
      "הערות": o.notes ?? "",
    })));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "הזמנות");
    XLSX.writeFile(wb, `orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function resetFilters() { setTeamId("all"); setStatus("all"); setFrom(""); setTo(""); }

  const totalSum = useMemo(() => (orders ?? []).reduce((s, o: any) => s + Number(o.total), 0), [orders]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">הזמנות</h1>
          <p className="text-sm text-muted-foreground">{orders?.length ?? 0} הזמנות · סה״כ ₪{totalSum.toFixed(0)}</p>
        </div>
        <Button onClick={exportExcel} disabled={!orders?.length}>
          <Download className="w-4 h-4 ml-2" /> ייצוא לאקסל
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground"><Filter className="w-4 h-4" /> סינון</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger><SelectValue placeholder="צוות" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הצוותים</SelectItem>
              {teams?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="מתאריך" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="עד תאריך" />
          <Button variant="outline" onClick={resetFilters}><X className="w-4 h-4 ml-2" /> נקה</Button>
        </div>
      </Card>

      {isLoading ? <Card className="p-12 text-center">טוען...</Card> :
        !orders?.length ? <Card className="p-12 text-center text-muted-foreground">אין הזמנות</Card> :
        <div className="space-y-2">
          {orders.map((o: any) => (
            <Card key={o.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{o.teams?.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                    <span className="text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString("he-IL")}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{o.ordered_by_name}</span>
                    <span className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" />{o.contact_phone}</span>
                    <span>{(o.order_items as any[]).length} פריטים</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">₪{Number(o.total).toFixed(0)}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setDetail(o)}><FileText className="w-4 h-4 ml-1" /> פרטים</Button>
                  <Select value={o.status} onValueChange={(v) => changeStatus(o.id, v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>פרטי הזמנה</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {detail.teams?.name} · {new Date(detail.created_at).toLocaleString("he-IL")}
              </div>
              <div className="border rounded divide-y">
                {(detail.order_items as any[]).map(it => (
                  <div key={it.id} className="flex justify-between p-2 text-sm">
                    <span>{it.name} × {it.quantity}</span>
                    <span>₪{(Number(it.price) * it.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-lg"><span>סה״כ</span><span>₪{Number(detail.total).toFixed(0)}</span></div>
              {detail.notes && <div className="text-sm bg-muted p-2 rounded">הערות: {detail.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
