import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getTeamOrders } from "@/lib/team.functions";
import { getTeamSession } from "@/lib/team-session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/shop/orders")({
  ssr: false,
  head: () => ({ meta: [{ title: "ההזמנות שלי" }] }),
  component: Orders,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "ממתינה",
  awaiting_approval: "ממתינה לאישור מנהל",
  approved: "אושרה",
  preparing: "בהכנה",
  ready: "מוכנה לאיסוף",
  completed: "הושלמה",
  cancelled: "בוטלה",
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

function Orders() {
  const navigate = useNavigate();
  const session = typeof window !== "undefined" ? getTeamSession() : null;
  useEffect(() => { if (!session) navigate({ to: "/", replace: true }); }, [session, navigate]);

  const fetchFn = useServerFn(getTeamOrders);
  const { data, isLoading } = useQuery({
    enabled: !!session,
    queryKey: ["team-orders", session?.pin],
    queryFn: () => fetchFn({ data: { pin: session!.pin } }),
  });

  if (!session) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">ההזמנות שלי</h1>
            <p className="text-xs text-muted-foreground">{data?.team.name}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/shop"><ArrowRight className="w-4 h-4 ml-2" /> חזרה לחנות</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !data?.orders.length ? (
          <Card className="p-12 text-center text-muted-foreground">עוד לא ביצעת הזמנות</Card>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {data.orders.map((o: any) => (
              <AccordionItem key={o.id} value={o.id} className="border rounded-lg bg-card px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex-1 flex items-center justify-between gap-3 pr-2">
                    <div className="text-right">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                        <span className="text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString("he-IL")}</div>
                    </div>
                    <div className="font-bold text-lg">₪{Number(o.total).toFixed(0)}</div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <div className="text-xs text-muted-foreground">
                      מזמין: {o.ordered_by_name} · <span dir="ltr">{o.contact_phone}</span>
                    </div>
                    <div className="border rounded divide-y">
                      {(o.order_items as any[]).map(it => (
                        <div key={it.id} className="flex justify-between p-2 text-sm">
                          <span>{it.name} × {it.quantity}</span>
                          <span>₪{(Number(it.price) * it.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    {o.notes && <div className="text-sm bg-muted p-2 rounded">הערות: {o.notes}</div>}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
