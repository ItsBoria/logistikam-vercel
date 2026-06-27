import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminRoles } from "@/lib/admin-notifications.functions";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export type AdminRolesData = {
  roles: ("OWNER" | "WORK_MANAGER" | "ADMIN")[];
  role: "OWNER" | "WORK_MANAGER" | "ADMIN" | "USER";
  isOwner: boolean;
  isWorkManager: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  canManageRoles: boolean;
  canResetBudgets: boolean;
  canSignCalendar: boolean;
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
