import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Monthly AI report-comment usage for the tenant, read from ai_usage_logs. */
export function useCommentQuota(tenantId?: string | null) {
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!tenantId) return;
    const start = new Date();
    start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("feature", "report_comment")
      .gte("created_at", start.toISOString());
    setUsed(count ?? 0);
    const { data: q } = await supabase.rpc("ai_check_quota", { _tenant: tenantId });
    const lim = (q as any)?.request_limit;
    setLimit(typeof lim === "number" ? lim : null);
  }, [tenantId]);

  useEffect(() => { refresh(); }, [refresh]);

  const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return { used, limit, pct, warn: pct >= 80 && pct < 100, blocked: !!limit && used >= limit, refresh, setUsed, setLimit };
}