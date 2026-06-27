import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const ACCESS_TOKEN_COOKIE = "logistikam_access_token";

function syncAccessTokenCookie(session: Session | null) {
  if (typeof document === "undefined") return;
  if (!session?.access_token) {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
    return;
  }
  const maxAge = Math.max(0, (session.expires_at ?? Math.floor(Date.now() / 1000) + 3600) - Math.floor(Date.now() / 1000));
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}

function getInitialSession(): { session: Session | null; loading: boolean } {
  const raw = (supabase.auth as any)._currentSession;
  if (raw !== undefined) return { session: raw ?? null, loading: false };
  return { session: null, loading: true };
}

export function useSupabaseSession() {
  const initial = getInitialSession();
  const [session, setSession] = useState<Session | null>(initial.session);
  const [loading, setLoading] = useState(initial.loading);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        syncAccessTokenCookie(data.session);
        setSession(data.session);
        setLoading(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      syncAccessTokenCookie(nextSession);
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
