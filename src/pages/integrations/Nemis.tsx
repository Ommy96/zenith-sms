import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Database, Download, Upload, KeyRound, Loader2, CheckCircle2, AlertCircle,
  FileSpreadsheet, Users, GraduationCap, Repeat, LogOut, ArrowLeftRight, Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/downloadCsv";

type ReportType = "nemis_enrolment" | "nemis_sne" | "nemis_repeaters" | "nemis_dropouts" | "nemis_transfers" | "nemis_capitation";

const REPORTS: { type: ReportType; title: string; icon: any; description: string }[] = [
  { type: "nemis_enrolment", title: "Enrolment by class & gender", icon: Users, description: "Boys, girls, totals per grade" },
  { type: "nemis_sne", title: "Special Needs Enrolment", icon: GraduationCap, description: "Learners with an SNE category" },
  { type: "nemis_repeaters", title: "Repeat Learners", icon: Repeat, description: "Students marked as repeating" },
  { type: "nemis_dropouts", title: "Dropouts", icon: LogOut, description: "Learners with exit reason recorded" },
  { type: "nemis_transfers", title: "Transfers In / Out", icon: ArrowLeftRight, description: "Date-range transfer movements" },
  { type: "nemis_capitation", title: "Capitation Tracking", icon: Coins, description: "FPE grant by stage" },
];

export default function NemisPage() {
  const { profile } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const tenantId = profile?.tenant_id;

  // Coverage stats
  const [stats, setStats] = useState({ total: 0, withUpi: 0, loading: true });

  // Credentials
  const [creds, setCreds] = useState<{ username: string | null; last_synced_at: string | null; updated_at: string | null } | null>(null);
  const [credUsername, setCredUsername] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credBusy, setCredBusy] = useState(false);

  // Export
  const [exporting, setExporting] = useState<string | null>(null);

  // Import
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<any | null>(null);
  const [importBusy, setImportBusy] = useState(false);

  // Reports date range
  const today = new Date();
  const [dateFrom, setDateFrom] = useState(`${today.getFullYear()}-01-01`);
  const [dateTo, setDateTo] = useState(today.toISOString().slice(0, 10));

  useEffect(() => { void loadAll(); /* eslint-disable-next-line */ }, [tenantId]);

  async function loadAll() {
    if (!tenantId) return;
    setStats((s) => ({ ...s, loading: true }));
    const [{ count: total }, { count: withUpi }, credsRes] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
      supabase.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active").not("nemis_upi", "is", null),
      supabase.functions.invoke("nemis-credentials", { body: { tenant_id: tenantId, action: "get" } }),
    ]);
    setStats({ total: total ?? 0, withUpi: withUpi ?? 0, loading: false });
    if (!credsRes.error && credsRes.data) {
      setCreds(credsRes.data as any);
      setCredUsername((credsRes.data as any).username ?? "");
    }
  }

  const coveragePct = useMemo(() => stats.total ? Math.round(100 * stats.withUpi / stats.total) : 0, [stats]);

  async function saveCredentials() {
    if (!tenantId) return;
    if (!credUsername || !credPassword) {
      toast({ title: "Username and password required", variant: "destructive" });
      return;
    }
    setCredBusy(true);
    const { error } = await supabase.functions.invoke("nemis-credentials", {
      body: { tenant_id: tenantId, action: "save", username: credUsername, password: credPassword },
    });
    setCredBusy(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "NEMIS credentials saved", description: "Stored securely on the server." });
    setCredPassword("");
    void loadAll();
  }

  async function runExport(type: string, params: any = {}) {
    if (!tenantId) return;
    setExporting(type);
    const { data, error } = await supabase.functions.invoke("compliance-export", {
      body: { type, tenant_id: tenantId, params },
    });
    setExporting(null);
    if (error || !data?.csv) {
      toast({ title: "Export failed", description: error?.message ?? data?.error ?? "Unknown error", variant: "destructive" });
      return;
    }
    downloadCsv(data.csv, data.filename);
    toast({ title: "Exported", description: `${data.row_count} rows · ${data.filename}` });
  }

  async function runImport(commit: boolean) {
    if (!tenantId || !csvText.trim()) {
      toast({ title: "Paste a NEMIS CSV first", variant: "destructive" });
      return;
    }
    setImportBusy(true);
    const { data, error } = await supabase.functions.invoke("nemis-import", {
      body: { tenant_id: tenantId, csv: csvText, commit },
    });
    setImportBusy(false);
    if (error || !data) {
      toast({ title: "Import failed", description: error?.message ?? (data as any)?.error, variant: "destructive" });
      return;
    }
    setPreview(data);
    if (commit) {
      toast({ title: "Import complete", description: `Updated ${data.summary.matched} learners` });
      void loadAll();
    }
  }

  if (tenant && tenant.country_code !== "KE") {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> NEMIS</CardTitle>
            <CardDescription>NEMIS is a Kenyan Ministry of Education system. This tenant's country is set to {tenant.country_code}.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span>System</span><span>›</span><span>Integrations</span><span>›</span><span className="text-foreground">NEMIS</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">NEMIS — National Education Management Information System</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage learner UPIs, export Ministry-ready files, and run statutory reports.</p>
      </motion.div>

      {/* Coverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">NEMIS UPI coverage</CardTitle>
          <CardDescription>How many of your active learners have a NEMIS UPI on file.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-semibold text-foreground">{coveragePct}%</div>
                <div className="text-sm text-muted-foreground">{stats.withUpi} of {stats.total} learners have UPI registered</div>
              </div>
              <Progress value={coveragePct} />
              {coveragePct < 100 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> Export learners → upload at nemis.education.go.ke → import the returned CSV to backfill UPIs.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export"><Download className="h-3.5 w-3.5 mr-1.5" />Export</TabsTrigger>
          <TabsTrigger value="import"><Upload className="h-3.5 w-3.5 mr-1.5" />Import</TabsTrigger>
          <TabsTrigger value="reports"><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />Reports</TabsTrigger>
          <TabsTrigger value="credentials"><KeyRound className="h-3.5 w-3.5 mr-1.5" />Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export learners for NEMIS upload</CardTitle>
              <CardDescription>Generates a CSV in NEMIS's exact column layout (M/D/YYYY dates, birth-certificate names, M/F gender codes).</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button onClick={() => runExport("nemis_learners")} disabled={exporting === "nemis_learners"}>
                {exporting === "nemis_learners" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export learners CSV
              </Button>
              <span className="text-xs text-muted-foreground">Active learners only · {stats.total} rows</span>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import NEMIS progression CSV</CardTitle>
              <CardDescription>Paste or drop the CSV NEMIS returns after a successful upload. We'll match by admission number, birth certificate number, or full name and update each student's UPI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">CSV contents</Label>
                <Textarea rows={8} value={csvText} onChange={(e) => { setCsvText(e.target.value); setPreview(null); }} placeholder="UPI,Admission No,Full Name,..." className="font-mono text-xs" />
              </div>
              <div className="flex flex-wrap gap-2">
                <input type="file" accept=".csv,text/csv" className="hidden" id="nemis-csv-file" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setCsvText(await f.text()); setPreview(null);
                }} />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("nemis-csv-file")?.click()}>Choose file</Button>
                <Button size="sm" onClick={() => runImport(false)} disabled={importBusy}>
                  {importBusy && !preview?.committed ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Preview matches
                </Button>
                {preview && !preview.committed && preview.summary.matched > 0 && (
                  <Button size="sm" onClick={() => runImport(true)} disabled={importBusy}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />Commit {preview.summary.matched} updates
                  </Button>
                )}
              </div>
              {preview && (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-3 text-sm">
                    <Badge variant="default">{preview.summary.matched} to update</Badge>
                    <Badge variant="secondary">{preview.unchanged_count} unchanged</Badge>
                    <Badge variant="destructive">{preview.summary.unmatched} unmatched</Badge>
                  </div>
                  {preview.matched?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1">Updates</div>
                      <div className="border rounded-md max-h-64 overflow-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Old UPI</TableHead><TableHead>New UPI</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {preview.matched.map((m: any) => (
                              <TableRow key={m.student_id}><TableCell>{m.name}</TableCell><TableCell className="text-muted-foreground">{m.old_upi ?? "—"}</TableCell><TableCell className="font-mono">{m.new_upi}</TableCell></TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                  {preview.unmatched?.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1 text-destructive">Unmatched rows</div>
                      <div className="border rounded-md max-h-40 overflow-auto text-xs">
                        <Table>
                          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Adm</TableHead><TableHead>BCN</TableHead><TableHead>UPI</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {preview.unmatched.map((u: any, i: number) => (
                              <TableRow key={i}><TableCell>{u.csv_name}</TableCell><TableCell>{u.csv_adm}</TableCell><TableCell>{u.csv_bcn}</TableCell><TableCell className="font-mono">{u.new_upi}</TableCell></TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">NEMIS-ready reports</CardTitle>
              <CardDescription>Pre-built reports the Ministry of Education commonly requests. All CSVs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div><Label className="text-xs">From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" /></div>
                <div><Label className="text-xs">To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" /></div>
                <span className="text-xs text-muted-foreground self-center">(used for Dropouts & Transfers)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REPORTS.map((r) => (
                  <div key={r.type} className="border rounded-lg p-3 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary"><r.icon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.description}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => runExport(r.type, { from: dateFrom, to: dateTo })} disabled={exporting === r.type}>
                      {exporting === r.type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">NEMIS portal credentials</CardTitle>
              <CardDescription>NEMIS doesn't expose a public API. We store your portal login on the server so assisted workflows can later sync without re-prompting. Stored encrypted at rest, not visible to clients.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-w-md">
              <div>
                <Label className="text-xs">Username</Label>
                <Input value={credUsername} onChange={(e) => setCredUsername(e.target.value)} placeholder="School NEMIS username" />
              </div>
              <div>
                <Label className="text-xs">Password</Label>
                <Input type="password" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} placeholder={creds?.username ? "•••••••• (stored)" : "Enter password"} />
              </div>
              {creds?.updated_at && (
                <div className="text-xs text-muted-foreground">Last updated: {new Date(creds.updated_at).toLocaleString()}</div>
              )}
              <Button onClick={saveCredentials} disabled={credBusy}>
                {credBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}Save credentials
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}