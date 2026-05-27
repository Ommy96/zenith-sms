import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Download, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/downloadCsv";

type FilingType = "p10_paye" | "p9a" | "shif_return" | "nssf_return" | "ahl_return" | "helb_return" | "itax_csv";

const STATUTORY: { type: FilingType; title: string; description: string; param: "month" | "year" }[] = [
  { type: "p10_paye", title: "P10 monthly PAYE return", description: "iTax-style per-employee monthly tax", param: "month" },
  { type: "itax_csv", title: "iTax-ready PAYE CSV", description: "Same as P10, KRA upload-friendly column order", param: "month" },
  { type: "shif_return", title: "SHIF return", description: "Social Health Insurance Fund (2.75%)", param: "month" },
  { type: "nssf_return", title: "NSSF return (Tier I + II)", description: "Pension contributions", param: "month" },
  { type: "ahl_return", title: "Affordable Housing Levy", description: "1.5% gross pay", param: "month" },
  { type: "helb_return", title: "HELB deduction return", description: "Loan deductions by employee", param: "month" },
  { type: "p9a", title: "P9A annual tax deduction card", description: "Per employee, full year", param: "year" },
];

export default function StatutoryFilingsPage() {
  const { profile } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const tenantId = profile?.tenant_id;
  const today = new Date();
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
  const [year, setYear] = useState(today.getFullYear());
  const [busy, setBusy] = useState<string | null>(null);
  const [filings, setFilings] = useState<any[]>([]);

  useEffect(() => { void loadFilings(); /* eslint-disable-next-line */ }, [tenantId]);

  async function loadFilings() {
    if (!tenantId) return;
    const { data } = await supabase.from("statutory_filings")
      .select("id, filing_type, period_start, period_end, reference, filed_at, status, amount")
      .eq("tenant_id", tenantId)
      .order("period_end", { ascending: false })
      .limit(50);
    setFilings((data as any) ?? []);
  }

  async function generate(type: FilingType, param: "month" | "year") {
    if (!tenantId) return;
    setBusy(type);
    const params = param === "month" ? { month } : { year };
    const { data, error } = await supabase.functions.invoke("compliance-export", { body: { type, tenant_id: tenantId, params } });
    setBusy(null);
    if (error || !data?.csv) {
      toast({ title: "Export failed", description: error?.message ?? data?.error, variant: "destructive" });
      return;
    }
    downloadCsv(data.csv, data.filename);
    toast({ title: "Generated", description: `${data.row_count} payslips · ${data.filename}` });
  }

  async function markFiled(type: FilingType) {
    if (!tenantId) return;
    const ref = prompt(`Enter the KRA / SHA / NSSF reference number for this ${type} filing:`);
    if (!ref) return;
    const period_start = `${month}-01`;
    const pd = new Date(period_start);
    const period_end = new Date(pd.getFullYear(), pd.getMonth() + 1, 0).toISOString().slice(0, 10);
    const { error } = await supabase.from("statutory_filings").insert({
      tenant_id: tenantId, filing_type: type, period_start, period_end,
      reference: ref, filed_at: new Date().toISOString(), status: "filed",
    });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Filing recorded" });
    void loadFilings();
  }

  const currentMonthFilings = filings.filter((f) => f.period_start?.startsWith(month));
  const filedTypes = new Set(currentMonthFilings.filter((f) => f.status === "filed" || f.status === "acknowledged").map((f) => f.filing_type));

  if (tenant && tenant.country_code !== "KE") {
    return <Card><CardHeader><CardTitle>Statutory filings</CardTitle><CardDescription>Kenya KRA/SHIF/NSSF/AHL exports. Other countries: see their dedicated integration pages.</CardDescription></CardHeader></Card>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>System</span><span>›</span><span>Compliance</span><span>›</span><span className="text-foreground">Statutory Filings (KE)</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Kenya statutory filings</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate KRA, SHIF, NSSF, AHL and HELB returns from your payroll. One click per return.</p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Compliance status — {month}</CardTitle>
          <CardDescription>Track which monthly returns you have filed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["p10_paye", "shif_return", "nssf_return", "ahl_return", "helb_return"].map((t) => {
              const filed = filedTypes.has(t);
              return (
                <div key={t} className={`border rounded-lg p-3 flex items-center gap-2 ${filed ? "border-emerald-500/30 bg-emerald-500/5" : ""}`}>
                  {filed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  <div className="text-xs">
                    <div className="font-medium text-foreground">{t.replace("_return", "").replace("_", " ").toUpperCase()}</div>
                    <div className="text-muted-foreground">{filed ? "Filed" : "Pending"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Period</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div><Label className="text-xs">Month</Label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44" /></div>
          <div><Label className="text-xs">Year (P9A)</Label><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Available returns</CardTitle><CardDescription>Pulls from finalised payslips in the selected period.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {STATUTORY.map((s) => (
            <div key={s.type} className="border rounded-lg p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary"><FileText className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.description}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => generate(s.type, s.param)} disabled={busy === s.type}>
                {busy === s.type ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                Generate
              </Button>
              {s.param === "month" && (
                <Button size="sm" variant="ghost" onClick={() => markFiled(s.type)}>Mark filed</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Filing history</CardTitle></CardHeader>
        <CardContent>
          {filings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No filings recorded yet.</div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead>Reference</TableHead><TableHead>Filed</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {filings.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.filing_type}</TableCell>
                    <TableCell>{f.period_start} → {f.period_end}</TableCell>
                    <TableCell className="font-mono text-xs">{f.reference ?? "—"}</TableCell>
                    <TableCell>{f.filed_at ? new Date(f.filed_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell><Badge variant={f.status === "filed" || f.status === "acknowledged" ? "default" : "secondary"}>{f.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}