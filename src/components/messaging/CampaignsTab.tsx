import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-600",
  sending: "bg-amber-500/10 text-amber-600",
  sent: "bg-emerald-500/10 text-emerald-600",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function CampaignsTab({ tenantId }: { tenantId: string | undefined }) {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("broadcast_campaigns")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (campaigns.length === 0) {
    return <div className="text-center py-12 text-sm text-muted-foreground">No campaigns yet. Send your first one from Compose.</div>;
  }
  return (
    <div className="space-y-2">
      {campaigns.map((c: any) => (
        <div key={c.id} className="rounded-xl border bg-card p-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Megaphone className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">{c.name}</p>
              <Badge className={`text-[10px] ${statusColors[c.status] || ""}`}>{c.status}</Badge>
              {(c.channels || []).map((ch: string) => (
                <Badge key={ch} variant="outline" className="text-[10px] uppercase">{ch}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {c.recipient_count} recipients · {c.sent_count} sent · {c.delivered_count} delivered · {c.failed_count} failed
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(c.created_at).toLocaleString()}
              {c.scheduled_for ? ` · scheduled ${new Date(c.scheduled_for).toLocaleString()}` : ""}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-mono font-semibold">{c.cost_currency} {Number(c.total_cost || 0).toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">total cost</p>
          </div>
        </div>
      ))}
    </div>
  );
}