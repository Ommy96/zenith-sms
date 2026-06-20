import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Building2, Users, DollarSign, Activity } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TenantRow {
  id: string;
  name: string;
  country_code: string;
  subscription_plan: string;
  subscription_status: string;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  student_count?: number;
  staff_count?: number;
}

export default function SuperAdminTenants() {
  const { role } = useAuth();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [metrics, setMetrics] = useState({ total: 0, active: 0, trial: 0, mrr: 0 });

  useEffect(() => {
    if (role !== "super_admin") return;
    (async () => {
      const { data: ts } = await supabase
        .from("tenants")
        .select("id, name, country_code, subscription_plan, subscription_status, is_demo, is_active, created_at")
        .order("created_at", { ascending: false });
      const list = (ts as any[]) ?? [];
      const { data: plans } = await supabase.from("subscription_plans").select("code, price_monthly_usd");
      const priceMap = new Map<string, number>((plans ?? []).map((p: any) => [p.code, Number(p.price_monthly_usd)]));
      const mrr = list
        .filter((t) => t.subscription_status === "active" && !t.is_demo)
        .reduce((s, t) => s + (priceMap.get(t.subscription_plan) ?? 0), 0);
      setMetrics({
        total: list.length,
        active: list.filter((t) => t.subscription_status === "active").length,
        trial: list.filter((t) => t.subscription_status === "trial").length,
        mrr,
      });
      setTenants(list);
      setLoading(false);
    })();
  }, [role]);

  if (role !== "super_admin") return <Navigate to="/app" replace />;

  const toggleActive = async (t: TenantRow) => {
    const { error } = await supabase.from("tenants").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) return toast.error(error.message);
    await supabase.from("super_admin_audit_log").insert({
      actor_id: (await supabase.auth.getUser()).data.user!.id,
      action: t.is_active ? "tenant.suspend" : "tenant.activate",
      tenant_id: t.id,
      meta: { name: t.name },
    });
    setTenants((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_active: !x.is_active } : x)));
    toast.success(`Tenant ${t.is_active ? "suspended" : "activated"}`);
  };

  const filtered = tenants.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin · Tenants</h1>
        <p className="text-sm text-muted-foreground">Manage every school on the Zenith platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Building2} label="Total schools" value={metrics.total} />
        <MetricCard icon={Activity} label="Active" value={metrics.active} />
        <MetricCard icon={Users} label="On trial" value={metrics.trial} />
        <MetricCard icon={DollarSign} label="MRR (USD)" value={`$${metrics.mrr.toFixed(0)}`} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>All tenants ({filtered.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search…" className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium">{t.name}</div>
                    {t.is_demo && <Badge variant="outline" className="text-[10px] mt-0.5">DEMO</Badge>}
                  </TableCell>
                  <TableCell>{t.country_code}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{t.subscription_plan}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={t.subscription_status === "active" ? "default" : "secondary"} className="capitalize">
                      {t.subscription_status}
                    </Badge>
                    {!t.is_active && <Badge variant="destructive" className="ml-1">Suspended</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(t)}>
                      {t.is_active ? "Suspend" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}