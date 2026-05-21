import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortal } from "@/contexts/PortalContext";
import { Megaphone, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const priorityClass: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

export default function PortalAnnouncements() {
  const { activeChild } = usePortal();
  const tenantId = activeChild?.tenant_id;

  const { data = [], isLoading } = useQuery({
    queryKey: ["portal-announcements", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase
        .from("announcements")
        .select("id, title, content, audience, priority, created_at")
        .eq("tenant_id", tenantId)
        .in("audience", ["all", "parents", "students"])
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!tenantId,
  });

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold">Announcements</h1>
        <p className="text-xs text-muted-foreground">Updates from {activeChild?.full_name ? `${activeChild.full_name}'s school` : "your school"}</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No announcements yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((a: any) => (
            <li key={a.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold">{a.title}</div>
                    <Badge variant="outline" className={`text-[10px] ${priorityClass[a.priority || "medium"]}`}>
                      {a.priority || "medium"}
                    </Badge>
                  </div>
                  {a.content && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>}
                  <div className="text-[11px] text-muted-foreground mt-2">
                    {new Date(a.created_at).toLocaleString()} · {a.audience}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}