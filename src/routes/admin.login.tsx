import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "כניסת מנהלים" }] }),
  component: Redirect,
});

function Redirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/", search: { tab: "admin" }, replace: true });
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
