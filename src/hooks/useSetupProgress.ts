import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface SetupProgressRow {
  tenant_id: string;
  completion_percentage: number;
  has_academic_year: boolean;
  has_current_term: boolean;
  has_grade_levels: boolean;
  [key: string]: unknown;
}

export function useSetupProgress() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: [tenantId, "setup_progress"],
    enabled: !!tenantId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("setup_progress")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (error) throw error;
      return (data as SetupProgressRow | null) ?? null;
    },
  });
}

export async function recomputeSetupProgress(tenantId: string) {
  const { error } = await supabase.rpc("recompute_setup_progress", { p_tenant_id: tenantId });
  if (error) throw error;
}
