import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAdminPreferences } from "@/lib/admin-preferences.functions";

export function useAdminPreferences() {
  const fn = useServerFn(getMyAdminPreferences);
  return useQuery({
    queryKey: ["admin-preferences"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
}
