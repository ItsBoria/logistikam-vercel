import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { useAdminRoles } from "@/hooks/use-admin-roles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { clearClientSessionState, setAdminActing, setTeamSession } from "@/lib/team-session";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyActiveUnit, listActiveUnits, setMyUnit } from "@/lib/membership.functions";
import { AdminBottomTabBar } from "@/components/admin-bottom-tab-bar";
import { Building2, Loader2, LogOut } from "lucide-react";
import { useHideOnScroll } from "@/hooks/use-scroll-direction";
import { useAdminPreferences } from "@/hooks/use-admin-preferences";

export function AdminShell({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const navigate = useNavigate();
  const { session, loading } = useSupabaseSession();
  const { data: roles, loading: rolesLoading } = useAdminRoles();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (session && !rolesLoading && roles && !roles.hasAccess) {
      supabase.auth.signOut();
      navigate({ to: "/", replace: true });
    }
  }, [session, rolesLoading, roles, navigate]);

  useEffect(() => {
    if (!session || rolesLoading || !roles) return;
    if (adminOnly && !roles.isAdmin && roles.isStaff) {
      navigate({ to: "/admin/orders", replace: true });
    }
  }, [adminOnly, session, rolesLoading, roles, navigate]);

  if (loading || !session || rolesLoading || !roles || !roles.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (adminOnly && !roles.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-lg font-bold mb-2">אין הרשאה</h2>
          <p className="text-sm text-muted-foreground">דף זה זמין רק למנהלים.</p>
        </div>
      </div>
    );
  }

  return <AdminShellInner session={session} roles={roles}>{children}</AdminShellInner>;
}

function AdminShellInner({ session, roles, children }: { session: any; roles: any; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hidden = useHideOnScroll();
  const { data: preferences } = useAdminPreferences();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await queryClient.cancelQueries();
      clearClientSessionState();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      navigate({ to: "/", replace: true });
    } catch (e) {
      console.error(e);
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    const root = document.documentElement;
    const appearance = preferences?.appearance ?? "system";
    const shouldDark = appearance === "dark" ||
      (appearance === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", shouldDark);
    root.classList.toggle("reduce-app-motion", !!preferences?.reduced_animations);
    root.classList.toggle("admin-compact", !!preferences?.compact_mode);
  }, [preferences]);

  return (
    <div className="min-h-screen bg-secondary/30 admin-surface">
      <header
        className={[
          "bg-card/80 backdrop-blur border-b sticky top-0 z-30 transition-transform duration-300 ease-out",
          hidden ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/admin" className="font-semibold text-sm tracking-tight">
            {roles.isOwner ? "בעלים" : "ניהול יחידה"}
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            {roles.isAdmin && <ActiveUnitPicker />}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="יציאה"
              title={session?.user?.email ?? "יציאה"}
              onClick={logout}
              disabled={loggingOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 admin-main">{children}</main>
      <AdminBottomTabBar role={roles.role} />
    </div>
  );
}

function ActiveUnitPicker() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listActiveUnits);
  const setUnitFn = useServerFn(setMyUnit);
  const activeFn = useServerFn(getMyActiveUnit);
  const { data: units } = useQuery({ queryKey: ["active-units"], queryFn: () => listFn() });
  const { data: activeUnit } = useQuery({ queryKey: ["active-unit"], queryFn: () => activeFn() });

  async function onPick(unitId: string) {
    try {
      await setUnitFn({ data: { unit_id: unitId } });
      setTeamSession(null);
      setAdminActing(false);
      await qc.cancelQueries();
      qc.removeQueries({ queryKey: ["unit"] });
      await qc.invalidateQueries({ queryKey: ["active-unit"] });
      await qc.invalidateQueries({ queryKey: ["active-units"] });
      navigate({ to: "/admin" });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Select value={activeUnit?.unit_id ?? undefined} onValueChange={onPick}>
      <SelectTrigger className="h-8 w-[190px] text-xs">
        <Building2 className="w-3.5 h-3.5 ml-1" />
        <SelectValue placeholder="בחר יחידה" />
      </SelectTrigger>
      <SelectContent>
        {(units ?? []).map((unit: any) => (
          <SelectItem key={unit.unit_id} value={unit.unit_id}>{unit.unit_name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
