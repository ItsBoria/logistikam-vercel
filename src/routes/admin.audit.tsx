import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listAuditLog } from "@/lib/audit.functions";

export const Route = createFileRoute("/admin/audit" as any)({
  ssr: false,
  head: () => ({ meta: [{ title: "יומן פעילות" }] }),
  component: () => <AdminShell adminOnly><AuditPage /></AdminShell>,
});

function AuditPage() {
  const listFn = useServerFn(listAuditLog);
  const [action, setAction] = useState("");
  const [target, setTarget] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", action, target],
    queryFn: () => listFn({ data: { action_type: action, target_type: target, limit: 150 } }),
  });

  return (
    <div className="space-y-5 admin-stagger" dir="rtl">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardList className="h-6 w-6" /> יומן פעילות</h1>
        <p className="mt-1 text-sm text-muted-foreground">תיעוד שינויים בתפקידים, תקציבים, לוחות וחשבונות. זמין לבעלים בלבד.</p>
      </div>
      <Card className="grid gap-3 p-4 sm:grid-cols-2 admin-card">
        <Input value={action} onChange={(event) => setAction(event.target.value)} placeholder="סינון לפי פעולה" />
        <Input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="סינון לפי סוג יעד" />
      </Card>
      <Card className="overflow-hidden admin-card">
        {isLoading ? <div className="admin-skeleton h-72" /> : (
          <div className="divide-y">
            {(data ?? []).map((row: any) => (
              <div key={row.id} className="grid gap-2 p-4 text-sm md:grid-cols-[170px_1fr_180px]">
                <div>
                  <div className="font-semibold">{row.action_type}</div>
                  <div className="text-xs text-muted-foreground">{row.target_type}{row.target_id ? ` · ${row.target_id}` : ""}</div>
                </div>
                <div className="min-w-0">
                  {row.reason && <div>{row.reason}</div>}
                  <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {JSON.stringify(row.new_value ?? row.metadata ?? {})}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground md:text-left" dir="ltr">
                  {new Date(row.created_at).toLocaleString("he-IL")}
                  <div>{row.performer_role ?? "SYSTEM"}</div>
                </div>
              </div>
            ))}
            {!data?.length && <div className="p-8 text-center text-sm text-muted-foreground">לא נמצאו אירועים.</div>}
          </div>
        )}
      </Card>
    </div>
  );
}
