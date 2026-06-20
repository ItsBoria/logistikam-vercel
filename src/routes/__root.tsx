import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/page-transition";
import { CartProvider } from "@/lib/cart-context";
import { getTeamSession } from "@/lib/team-session";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">העמוד לא נמצא</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground">חזרה לדף הבית</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">משהו השתבש</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          נסה שוב
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "מערכת הזמנות פלוגתיות" },
      { name: "description", content: "מערכת ניהול הזמנות פלוגתיות" },
      { property: "og:title", content: "מערכת הזמנות פלוגתיות" },
      { name: "twitter:title", content: "מערכת הזמנות פלוגתיות" },
      { property: "og:description", content: "מערכת ניהול הזמנות פלוגתיות" },
      { name: "twitter:description", content: "מערכת ניהול הזמנות פלוגתיות" },
      { property: "og:image", content: "/logikam-logo.svg" },
      { name: "twitter:image", content: "/logikam-logo.svg" },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/logikam-logo.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/logikam-logo.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [pin, setPin] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => setPin(getTeamSession()?.pin ?? null);
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("team-session-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("team-session-changed", sync);
    };
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <CartProvider pin={pin}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </CartProvider>
      <Toaster position="top-center" richColors dir="rtl" />
    </QueryClientProvider>
  );
}

function AuthSync() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }

      router.invalidate();

      if (event !== "SIGNED_OUT") {
        qc.invalidateQueries();
      }
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}
