import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminRoles } from "@/lib/admin-notifications.functions";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export type AdminRolesData = {
  roles: ("admin" | "staff")[];
  isAdmin: boolean;
  isStaff: boolean;
  hasAccess: boolean;
};

export function useAdminRoles() {
  const { session } = useSupabaseSession();
  const fn = useServerFn(getMyAdminRoles);
  const q = useQuery({
    enabled: !!session,
    queryKey: ["my-admin-roles", session?.user.id],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  return {
    session,
    loading: !!session && q.isLoading,
    data: q.data as AdminRolesData | undefined,
  };
}
