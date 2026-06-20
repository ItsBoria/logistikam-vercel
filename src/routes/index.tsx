import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { useAdminRoles } from "@/hooks/use-admin-roles";
import { getMyTeamContext, claimAdminWithLegacyCreds } from "@/lib/membership.functions";
import { setTeamSession, setAdminActing } from "@/lib/team-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [{ title: "כניסה - מערכת הזמנות" }] }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSupabaseSession();
  const { data: roles, loading: rolesLoading } = useAdminRoles();
  const teamCtxFn = useServerFn(getMyTeamContext);
  const teamQ = useQuery({
    enabled: !!session,
    queryKey: ["my-team-context", session?.user.id],
    queryFn: () => teamCtxFn(),
  });

  useEffect(() => {
    if (!session || rolesLoading || !roles) return;
    if (roles.isAdmin) {
      setAdminActing(false);
      navigate({ to: "/admin", replace: true });
      return;
    }
    if (roles.isStaff) {
      navigate({ to: "/admin/orders", replace: true });
      return;
    }
    if (teamQ.isLoading) return;
    if (teamQ.data) {
      setTeamSession(teamQ.data);
      setAdminActing(false);
      navigate({ to: "/shop", replace: true });
    } else {
      navigate({ to: "/select-team", replace: true });
    }
  }, [session, rolesLoading, roles, teamQ.isLoading, teamQ.data, navigate]);

  if (sessionLoading || (session && (rolesLoading || teamQ.isLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-secondary/40 to-accent/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo size={96} className="mx-auto mb-5 drop-shadow-xl rounded-3xl" />
          <h1 className="text-3xl font-bold tracking-tight">ברוכים הבאים</h1>
          <p className="text-muted-foreground mt-2">התחבר/י כדי להמשיך</p>
        </div>
        <Card className="p-6 shadow-xl space-y-4">
          <GoogleButton />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px bg-border flex-1" /> או <div className="h-px bg-border flex-1" />
          </div>
          <EmailAuthForm />
          <div className="text-xs text-center text-muted-foreground pt-2">
            מנהל קיים? <ClaimAdminLink />
          </div>
        </Card>
      </div>
    </div>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error(e.message || "שגיאת התחברות");
      setLoading(false);
    }
  }
  return (
    <Button type="button" onClick={onClick} disabled={loading} variant="outline" className="w-full h-11 gap-2">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
      התחברות עם Google
    </Button>
  );
}

function EmailAuthForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("נרשמת בהצלחה. בדוק/י את האימייל לאישור אם נדרש.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("אימייל או סיסמה שגויים");
      }
    } catch (e: any) {
      toast.error(e.message || "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {mode === "signup" && (
        <div>
          <label className="block text-sm font-medium mb-1">שם מלא</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שמך" />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">אימייל</label>
        <Input type="email" dir="ltr" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">סיסמה</label>
        <Input type="password" dir="ltr" required minLength={mode === "signup" ? 8 : 1}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="w-full h-11">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "signup" ? "יצירת חשבון" : "כניסה"}
      </Button>
      <div className="text-xs text-center">
        <button type="button" className="text-primary hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "אין לך חשבון? הירשם/י" : "כבר יש לך חשבון? התחבר/י"}
        </button>
      </div>
    </form>
  );
}

function ClaimAdminLink() {
  const { session } = useSupabaseSession();
  const claimFn = useServerFn(claimAdminWithLegacyCreds);
  const [open, setOpen] = useState(false);
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <button type="button" className="text-primary hover:underline"
        onClick={() => setOpen(true)}>
        קישור חשבון מנהל קיים
      </button>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { toast.error("התחבר/י קודם עם Google או אימייל"); return; }
    setLoading(true);
    try {
      await claimFn({ data: { identifier: u, password: p } });
      toast.success("חשבונך שודרג למנהל");
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "שגיאה");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2 text-right">
      <p className="text-[11px] text-muted-foreground">
        התחבר/י קודם עם Google או אימייל, ואז הזן/י את פרטי חשבון המנהל הקיים שלך כדי להעביר את ההרשאה לחשבון החדש.
      </p>
      <Input placeholder="שם משתמש מנהל קיים" dir="ltr" value={u} onChange={(e) => setU(e.target.value)} />
      <Input placeholder="סיסמה" dir="ltr" type="password" value={p} onChange={(e) => setP(e.target.value)} />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !session} size="sm" className="flex-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "קשר חשבון"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>בטל</Button>
      </div>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}
