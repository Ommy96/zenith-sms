import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface AuditRow {
  id: string;
  actor_id: string;
  action: string;
  tenant_id: string | null;
  meta: any;
  created_at: string;
}

export default function SuperAdminAudit() {
  const { role } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "super_admin") return;
    (async () => {
      const { data } = await supabase
        .from("super_admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, [role]);

  if (role !== "super_admin") return <Navigate to="/" replace />;
  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin · Audit Log</h1>
        <p className="text-sm text-muted-foreground">Recent platform-level admin actions</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Last 100 events</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No audit events yet.</p>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="outline" className="font-mono text-xs">{r.action}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Actor: <span className="font-mono">{r.actor_id.slice(0, 8)}</span>
                      {r.tenant_id && <> · Tenant: <span className="font-mono">{r.tenant_id.slice(0, 8)}</span></>}
                    </p>
                    {r.meta && Object.keys(r.meta).length > 0 && (
                      <pre className="text-[11px] text-muted-foreground mt-1 bg-muted/40 rounded p-2 overflow-x-auto">{JSON.stringify(r.meta, null, 2)}</pre>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}