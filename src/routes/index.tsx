import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { verifyTeamPin } from "@/lib/team.functions";
import { setTeamSession, getTeamSession } from "@/lib/team-session";
import { useAdminRoles } from "@/hooks/use-admin-roles";
import { supabase } from "@/integrations/supabase/client";
import { adminAuthStatus, resolveAdminEmail, bootstrapAdminUsername } from "@/lib/admin-auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";

type SearchParams = { tab?: "team" | "admin" };

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [{ title: "כניסה - מערכת הזמנות" }] }),
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    tab: search.tab === "admin" || search.tab === "team" ? (search.tab as any) : undefined,
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { session, loading: rolesLoading, data: myRoles } = useAdminRoles();

  const [tab, setTab] = useState<"team" | "admin">(search.tab ?? "team");

  // Route logged-in admin/staff to their landing
  useEffect(() => {
    if (!session || rolesLoading || !myRoles) return;
    if (myRoles.isAdmin) navigate({ to: "/admin", replace: true });
    else if (myRoles.isStaff) navigate({ to: "/admin/orders", replace: true });
    else { supabase.auth.signOut(); }
  }, [session, rolesLoading, myRoles, navigate]);

  // Already PIN-authed → shop
  useEffect(() => {
    if (getTeamSession()) navigate({ to: "/shop", replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-secondary/40 to-accent/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo size={96} className="mx-auto mb-5 drop-shadow-xl rounded-3xl" />
          <h1 className="text-3xl font-bold tracking-tight">ברוכים הבאים</h1>
          <p className="text-muted-foreground mt-2">בחר/י את סוג ההתחברות</p>
        </div>

        <Card className="p-6 shadow-xl">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 mb-4 w-full">
              <TabsTrigger value="team"><UsersIcon className="w-4 h-4 ml-2" /> צוות</TabsTrigger>
              <TabsTrigger value="admin"><ShieldCheck className="w-4 h-4 ml-2" /> מנהל / מחסן</TabsTrigger>
            </TabsList>
            <TabsContent value="team"><TeamForm /></TabsContent>
            <TabsContent value="admin"><AdminForm /></TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function TeamForm() {
  const navigate = useNavigate();
  const verify = useServerFn(verifyTeamPin);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const team = await verify({ data: { pin } });
      setTeamSession({
        team_id: team.id, team_name: team.name, pin,
        monthly_limit: Number(team.monthly_limit),
        contact_phone: team.contact_phone,
      });
      toast.success(`ברוכים הבאים, ${team.name}`);
      navigate({ to: "/shop" });
    } catch (err: any) {
      toast.error(err.message || "שגיאה");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">קוד צוות (PIN)</label>
        <Input
          value={pin} onChange={(e) => setPin(e.target.value)} required
          placeholder="הכנס/י קוד" className="text-center text-lg tracking-widest h-12" autoFocus
        />
      </div>
      <Button type="submit" disabled={loading || !pin} className="w-full h-12 text-base">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "כניסת צוות"}
      </Button>
    </form>
  );
}

function AdminForm() {
  const navigate = useNavigate();
  const statusFn = useServerFn(adminAuthStatus);
  const resolveFn = useServerFn(resolveAdminEmail);
  const bootstrapFn = useServerFn(bootstrapAdminUsername);
  const { data: status } = useQuery({ queryKey: ["admin-auth-status"], queryFn: () => statusFn() });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const needsBootstrap = status?.needsBootstrap;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (needsBootstrap) {
        const { email } = await bootstrapFn({ data: { username, password } });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("מנהל ראשי נוצר");
      } else {
        const { email } = await resolveFn({ data: { identifier: username } });
        if (!email) throw new Error("שם משתמש או סיסמה שגויים");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("שם משתמש או סיסמה שגויים");
        toast.success("ברוך/ה הבא/ה");
      }
    } catch (e: any) {
      toast.error(e.message || "שגיאה");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {needsBootstrap ? "שם משתמש" : "שם משתמש או אימייל"}
        </label>
        <Input
          value={username} onChange={(e) => setUsername(e.target.value)} required
          type="text" dir="ltr" autoComplete="username"
          placeholder={needsBootstrap ? "admin" : "admin או name@example.com"}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">סיסמה</label>
        <Input
          value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          type="password" dir="ltr" autoComplete={needsBootstrap ? "new-password" : "current-password"}
        />
        {needsBootstrap && <p className="text-xs text-muted-foreground mt-1">בחר/י סיסמה חזקה (לפחות 8 תווים)</p>}
      </div>
      <Button type="submit" disabled={loading} className="w-full h-11">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : needsBootstrap ? "צור מנהל וכנס" : "כניסה"}
      </Button>
    </form>
  );
}
