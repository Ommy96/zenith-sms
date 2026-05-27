import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/downloadCsv";

export interface ExportItem {
  type: string;
  title: string;
  description: string;
  needsGrade?: string[]; // if set, render a grade selector and pass params.grade
  needsMonth?: boolean;
}

export interface CountryConfig {
  countryCode: string;        // ISO ("UG", "TZ"…)
  countryName: string;
  ministryName: string;       // e.g. "Ministry of Education and Sports"
  systemAcronym: string;      // e.g. "EMIS"
  systemFullName: string;
  idLabel: string;            // e.g. "LIN" or "PREMS ID"
  idColumn: string;           // column on students
  exports: ExportItem[];
  language?: string;          // optional language note (Kinyarwanda, Amharic)
}

export function CountryIntegrationPage({ config }: { config: CountryConfig }) {
  const { profile } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const tenantId = profile?.tenant_id;

  const [stats, setStats] = useState({ total: 0, withId: 0, loading: true });
  const [busy, setBusy] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const today = new Date();
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);

  useEffect(() => {
    if (!tenantId) return;
    let alive = true;
    (async () => {
      const [{ count: total }, { count: withId }] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
        supabase.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active").not(config.idColumn as any, "is", null),
      ]);
      if (alive) setStats({ total: total ?? 0, withId: withId ?? 0, loading: false });
    })();
    return () => { alive = false; };
  }, [tenantId, config.idColumn]);

  const coveragePct = useMemo(
    () => (stats.total ? Math.round(100 * stats.withId / stats.total) : 0),
    [stats]
  );

  async function runExport(item: ExportItem) {
    if (!tenantId) return;
    setBusy(item.type);
    const params: any = {};
    if (item.needsGrade) params.grade = grades[item.type] ?? item.needsGrade[0];
    if (item.needsMonth) params.month = month;
    const { data, error } = await supabase.functions.invoke("compliance-export", {
      body: { type: item.type, tenant_id: tenantId, params },
    });
    setBusy(null);
    if (error || !data?.csv) {
      toast({ title: "Export failed", description: error?.message ?? data?.error ?? "Unknown error", variant: "destructive" });
      return;
    }
    downloadCsv(data.csv, data.filename);
    toast({ title: "Exported", description: `${data.row_count} rows · ${data.filename}` });
  }

  if (tenant && tenant.country_code !== config.countryCode) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> {config.systemAcronym}</CardTitle>
            <CardDescription>
              {config.systemFullName} is a {config.countryName} integration. This tenant's country is set to {tenant.country_code}.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>System</span><span>›</span><span>Integrations</span><span>›</span>
          <span className="text-foreground">{config.systemAcronym} ({config.countryCode})</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {config.systemAcronym} — {config.systemFullName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {config.ministryName}, {config.countryName}.
          {config.language && <span> Reports rendered with {config.language} labels where applicable.</span>}
        </p>
      </motion.div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{config.idLabel} coverage</CardTitle>
          <CardDescription>Active learners with a {config.idLabel} recorded.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold text-foreground">{coveragePct}%</div>
                <div className="text-sm text-muted-foreground">{stats.withId} of {stats.total} learners</div>
              </div>
              <Progress value={coveragePct} />
              {coveragePct < 100 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> Update each student's {config.idLabel} in the Students module to improve coverage.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="exports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exports"><Download className="h-3.5 w-3.5 mr-1.5" />Exports & Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="exports">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ministry-ready exports</CardTitle>
              <CardDescription>CSV files in the column layout each authority expects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.exports.some(e => e.needsMonth) && (
                <div className="flex items-end gap-3">
                  <div>
                    <Label className="text-xs">Payroll month</Label>
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {config.exports.map((it) => (
                  <div key={it.type} className="border rounded-lg p-3 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <div className="text-sm font-medium text-foreground">{it.title}</div>
                        <div className="text-xs text-muted-foreground">{it.description}</div>
                      </div>
                      {it.needsGrade && (
                        <select
                          value={grades[it.type] ?? it.needsGrade[0]}
                          onChange={(e) => setGrades((g) => ({ ...g, [it.type]: e.target.value }))}
                          className="h-8 text-xs rounded-md border border-input bg-background px-2"
                        >
                          {it.needsGrade.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => runExport(it)} disabled={busy === it.type}>
                      {busy === it.type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}