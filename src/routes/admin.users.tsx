import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin-shell";
import {
  listAdminUsers,
  createAdminUser,
  deleteAdminUser,
  updateAdminUserRole,
  searchRegisteredUsers,
} from "@/lib/admin.functions";
import { getMyActiveUnit, listActiveTeams, listUnitAccessRequests, resolveUnitAccessRequest, setUserTeamAdmin } from "@/lib/membership.functions";
import { setAdminApprover } from "@/lib/missions.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShieldCheck, Package, User as UserIcon, Star } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "sonner";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  head: () => ({ meta: [{ title: "מנהלים - פאנל ניהול" }] }),
  component: () => <AdminShell adminOnly><Admins /></AdminShell>,
});

function Admins() {
  const qc = useQueryClient();
  const { session } = useSupabaseSession();
  const listFn = useServerFn(listAdminUsers);
  const createFn = useServerFn(createAdminUser);
  const deleteFn = useServerFn(deleteAdminUser);
  const roleFn = useServerFn(updateAdminUserRole);
  const searchFn = useServerFn(searchRegisteredUsers);
  const activeUnitFn = useServerFn(getMyActiveUnit);
  const teamsFn = useServerFn(listActiveTeams);
  const setTeamFn = useServerFn(setUserTeamAdmin);
  const requestsFn = useServerFn(listUnitAccessRequests);
  const resolveRequestFn = useServerFn(resolveUnitAccessRequest);
  const approverFn = useServerFn(setAdminApprover);

  const { data: activeUnit } = useQuery({ queryKey: ["active-unit"], queryFn: () => activeUnitFn() });
  const unitKey = activeUnit?.unit_id ?? "none";
  const { data: admins } = useQuery({
    queryKey: ["unit", unitKey, "admin-users"],
    queryFn: () => listFn(),
    enabled: !!activeUnit?.unit_id,
  });
  const { data: teams } = useQuery({
    queryKey: ["unit", unitKey, "active-teams-admin"],
    queryFn: () => teamsFn(),
    enabled: !!activeUnit?.unit_id,
  });
  const { data: accessRequests } = useQuery({
    queryKey: ["unit", unitKey, "unit-access-requests"],
    queryFn: () => requestsFn(),
    enabled: !!activeUnit?.unit_id,
  });
  const [query, setQuery] = useState("");
  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["unit", unitKey, "registered-users", query],
    queryFn: () => searchFn({ data: { query } }),
    enabled: !!activeUnit?.unit_id,
  });

  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"WORK_MANAGER" | "ADMIN">("ADMIN");


  async function create() {
    try {
      await createFn({ data: { email, username, password, role } });
      toast.success("המשתמש נוסף");
      setEmail(""); setUsername(""); setPassword(""); setRole("ADMIN"); setCreating(false);
      qc.invalidateQueries({ queryKey: ["unit", unitKey] });
    } catch (e: any) { toast.error(e.message); }
  }
  async function remove(id: string) {
    if (!confirm("למחוק את המשתמש? הפעולה תסיר הרשאות, תחסום כניסה ותנסה למחוק אותו ממערכת ההתחברות.")) return;
    try {
      const result = await deleteFn({ data: { user_id: id } });
      toast.success((result as any)?.auth_deleted ? "המשתמש נמחק" : "המשתמש הוסר מהאפליקציה ונחסם");
      qc.invalidateQueries({ queryKey: ["unit", unitKey] });
    } catch (e: any) { toast.error(e.message); }
  }
  async function changeRole(id: string, newRole: "WORK_MANAGER" | "ADMIN" | "USER") {
    try {
      await roleFn({ data: { user_id: id, role: newRole } });
      toast.success("התפקיד עודכן");
      qc.invalidateQueries({ queryKey: ["unit", unitKey] });
    } catch (e: any) { toast.error(e.message); }
  }
  async function changeTeam(userId: string, value: string) {
    try {
      await setTeamFn({ data: { user_id: userId, team_id: value === "none" ? null : value } });
      toast.success("הצוות עודכן");
      qc.invalidateQueries({ queryKey: ["unit", unitKey] });
    } catch (e: any) { toast.error(e.message); }
  }
  async function toggleApprover(userId: string, val: boolean) {
    try {
      await approverFn({ data: { user_id: userId, is_approver: val } });
      toast.success(val ? "סומן כמאשר" : "הוסר סימון מאשר");
      qc.invalidateQueries({ queryKey: ["unit", unitKey, "admin-users"] });
      qc.invalidateQueries({ queryKey: ["calendar-admins"] });
    } catch (e: any) { toast.error(e.message); }
  }
  async function resolveRequest(
    requestId: string,
    decision: "approved" | "rejected",
    accessRole: "UNIT_USER" | "LOGISTICS_NCO" | "WORK_MANAGER" | "UNIT_ADMIN",
    teamId?: string | null,
    reviewNotes?: string,
  ) {
    try {
      await resolveRequestFn({
        data: {
          request_id: requestId,
          decision,
          role: accessRole,
          team_id: teamId ?? null,
          review_notes: reviewNotes ?? "",
        },
      });
      toast.success(decision === "approved" ? "המשתמש אושר ליחידה" : "בקשת הגישה נדחתה");
      qc.invalidateQueries({ queryKey: ["unit", unitKey] });
    } catch (e: any) {
      toast.error(e.message || "שגיאה בעדכון בקשת הגישה");
    }
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">משתמשים ובקשות גישה</h1>
          <p className="text-sm text-muted-foreground">ניהול תפקידים והרשאות</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4 ml-2" /> משתמש חדש</Button>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">בקשות גישה</TabsTrigger>
          <TabsTrigger value="system">משתמשי מערכת</TabsTrigger>
          <TabsTrigger value="all">כל המשתמשים</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card className="divide-y">
            {(accessRequests ?? []).map((request: any) => (
              <AccessRequestRow
                key={request.id}
                request={request}
                teams={teams ?? []}
                onResolve={resolveRequest}
              />
            ))}
            {!accessRequests?.length && (
              <div className="p-12 text-center text-muted-foreground text-sm">
                אין בקשות גישה פתוחות ליחידה הפעילה
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card className="divide-y">
            {admins?.map((a: any) => {
              const isMe = a.user_id === session?.user.id;
              const isAdmin = a.is_admin;
              return (
                <div key={a.user_id} className="flex items-center justify-between p-4 gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isAdmin ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                      {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {a.username ? `@${a.username}` : a.email}
                        <span className={`text-xs px-2 py-0.5 rounded ${isAdmin ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
                          {isAdmin ? "מנהל" : "צוות מחסן"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.username ? `${a.email} · ` : ""}נוסף: {new Date(a.created_at).toLocaleDateString("he-IL")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isAdmin && (
                      <label className="flex items-center gap-1.5 text-xs bg-muted/60 rounded-full px-2.5 h-9" title="מאשר חתימות שבועיות">
                        <Star className={`w-3.5 h-3.5 ${a.is_approver ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                        <span>מאשר</span>
                        <Switch checked={!!a.is_approver} onCheckedChange={(v) => toggleApprover(a.user_id, v)} />
                      </label>
                    )}
                    {!isMe && (
                      <Select value={a.current_role ?? "ADMIN"} onValueChange={(v) => changeRole(a.user_id, v as any)}>
                        <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WORK_MANAGER">מנהל עבודה</SelectItem>
                          <SelectItem value="ADMIN">נגד לוגיסטיקה</SelectItem>
                          <SelectItem value="USER">משתמש</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {!isMe ? (
                      <Button variant="ghost" size="icon" onClick={() => remove(a.user_id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    ) : <span className="text-xs text-muted-foreground">(אתה)</span>}
                    {!isMe && u.currentRole !== "OWNER" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(u.id)}
                        title="מחיקת משתמש"
                        aria-label="מחיקת משתמש"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {!admins?.length && <div className="p-12 text-center text-muted-foreground">אין משתמשים</div>}
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-3">
          <SearchInput
            containerClassName="max-w-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery("")}
            placeholder="חיפוש לפי אימייל או שם..."
          />
          <Card className="divide-y">
            {searching && !searchResults?.length && (
              <div className="p-8 text-center text-muted-foreground text-sm">טוען...</div>
            )}
            {searchResults?.map((u: any) => {
              const isMe = u.id === session?.user.id;
              const initials = (u.displayName || u.email || "?").trim().charAt(0).toUpperCase();
              const roleLabel = u.currentRole === "OWNER" ? "בעלים" : u.currentRole === "WORK_MANAGER" ? "מנהל עבודה" : u.currentRole === "ADMIN" ? "נגד לוגיסטיקה" : "משתמש";
              const roleClass = u.currentRole !== "USER"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-foreground";
              return (
                <div key={u.id} className="flex items-center justify-between p-4 gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium">
                      {initials || <UserIcon className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        <span className="truncate">{u.displayName || u.email}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${roleClass}`}>{roleLabel}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {u.provider === "google" ? "Google" : u.provider === "email" ? "אימייל" : u.provider}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate" dir="ltr">{u.email}</div>
                      {u.team_name && (
                        <div className="text-xs text-muted-foreground mt-0.5">צוות: {u.team_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={u.team_id ?? "none"} onValueChange={(v) => changeTeam(u.id, v)}>
                      <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="צוות" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">ללא צוות</SelectItem>
                        {teams?.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isMe ? (
                      <Select value={u.currentRole} onValueChange={(v) => changeRole(u.id, v as any)}>
                        <SelectTrigger className="w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WORK_MANAGER">מנהל עבודה</SelectItem>
                          <SelectItem value="ADMIN">נגד לוגיסטיקה</SelectItem>
                          <SelectItem value="USER">משתמש</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : <span className="text-xs text-muted-foreground">(אתה)</span>}
                  </div>
                </div>
              );
            })}
            {!searching && !searchResults?.length && (
              <div className="p-12 text-center text-muted-foreground text-sm">אין משתמשים תואמים</div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>הוספת משתמש</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm">תפקיד</label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WORK_MANAGER">מנהל עבודה</SelectItem>
                  <SelectItem value="ADMIN">נגד לוגיסטיקה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm">אימייל</label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" placeholder="name@example.com" /></div>
            <div>
              <label className="text-sm">שם משתמש</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} type="text" dir="ltr" placeholder="user" />
              <p className="text-xs text-muted-foreground mt-1">אותיות באנגלית, מספרים, נקודה, קו תחתון, מקף (2-40 תווים)</p>
            </div>
            <div><label className="text-sm">סיסמה (לפחות 8 תווים)</label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" dir="ltr" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>ביטול</Button>
            <Button onClick={create} disabled={!email || !/^[a-zA-Z0-9_.-]{2,40}$/.test(username) || password.length < 8}>הוסף</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccessRequestRow({
  request,
  teams,
  onResolve,
}: {
  request: any;
  teams: any[];
  onResolve: (
    id: string,
    decision: "approved" | "rejected",
    role: "UNIT_USER" | "LOGISTICS_NCO" | "WORK_MANAGER" | "UNIT_ADMIN",
    teamId?: string | null,
    reviewNotes?: string,
  ) => void;
}) {
  const [accessRole, setAccessRole] = useState<"UNIT_USER" | "LOGISTICS_NCO" | "WORK_MANAGER" | "UNIT_ADMIN">(
    request.requested_role ?? "UNIT_USER",
  );
  const [teamId, setTeamId] = useState<string>("none");
  const [reviewNotes, setReviewNotes] = useState("");
  const displayName = request.display_name || request.email || "משתמש חדש";
  const requestedAt = request.created_at ? new Date(request.created_at).toLocaleString("he-IL") : "";
  const needsTeam = accessRole === "UNIT_USER";

  return (
    <div className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="font-medium flex flex-wrap items-center gap-2">
          <span>{displayName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            בקשת גישה
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate" dir="ltr">{request.email}</div>
        {request.note && (
          <div className="text-xs text-muted-foreground mt-1">הערה: {request.note}</div>
        )}
        {requestedAt && (
          <div className="text-[11px] text-muted-foreground mt-1">נשלח: {requestedAt}</div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={accessRole} onValueChange={(v) => setAccessRole(v as any)}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="UNIT_ADMIN">מנהל יחידה</SelectItem>
            <SelectItem value="WORK_MANAGER">מנהל עבודה</SelectItem>
            <SelectItem value="LOGISTICS_NCO">נגד לוגיסטיקה</SelectItem>
            <SelectItem value="UNIT_USER">לקוח / רס״פ</SelectItem>
          </SelectContent>
        </Select>

        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="צוות" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">ללא צוות</SelectItem>
            {teams.map((team: any) => (
              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={() => onResolve(request.id, "approved", accessRole, teamId === "none" ? null : teamId, reviewNotes)}
          disabled={needsTeam && teamId === "none"}
        >
          אשר
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onResolve(request.id, "rejected", accessRole, null, reviewNotes)}
        >
          דחה
        </Button>
        <Input
          className="w-full md:w-56 h-9 text-xs"
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="הערת אישור / דחייה"
        />
      </div>
    </div>
  );
}
