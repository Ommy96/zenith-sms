import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Loader2, Play, Download, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

export default function ReportCards() {
  const { profile } = useAuth();
  const { can } = useTenant();
  const tenantId = profile?.tenant_id;
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [autoDeliver, setAutoDeliver] = useState(true);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [c, t, r] = await Promise.all([
      supabase.from("classes").select("id,name").eq("tenant_id", tenantId),
      supabase.from("terms").select("id,name,academic_year_id").eq("tenant_id", tenantId).order("start_date", { ascending: false }),
      supabase.from("report_card_runs").select("*, classes:class_id(name), terms:term_id(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(20),
    ]);
    setClasses(c.data || []); setTerms(t.data || []); setRuns(r.data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  // Light polling for in-progress runs
  useEffect(() => {
    if (!runs.some((r) => r.status === "queued" || r.status === "running")) return;
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [runs, load]);

  const generate = async () => {
    if (!classId || !termId) return toast({ title: "Pick a class and term", variant: "destructive" });
    setGenerating(true);
    const { error } = await supabase.functions.invoke("generate-report-cards", { body: { tenantId, classId, termId, autoDeliver } });
    setGenerating(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: autoDeliver ? "Reports queued — will be sent to parents on completion" : "Report generation queued" });
    load();
  };

  const deliverRun = async (runId: string) => {
    setDeliveringId(runId);
    const { data, error } = await supabase.functions.invoke("deliver-report-cards", { body: { runId } });
    setDeliveringId(null);
    if (error) return toast({ title: "Delivery failed", description: error.message, variant: "destructive" });
    const d = (data as any) || {};
    toast({ title: "Reports sent", description: `${d.delivered ?? 0}/${d.total ?? 0} delivered to parents` });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div><h1 className="text-2xl font-bold">Report Cards</h1>
          <p className="text-sm text-muted-foreground">Generate term reports for a whole class as a background job.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>New report run</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Class</div>
            <select className="border rounded px-2 py-1.5 text-sm bg-background min-w-[180px]" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Term</div>
            <select className="border rounded px-2 py-1.5 text-sm bg-background min-w-[180px]" value={termId} onChange={(e) => setTermId(e.target.value)}>
              <option value="">Select…</option>
              {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <Button onClick={generate} disabled={generating || !can("reports.generate")}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            Generate
          </Button>
          <label className="flex items-center gap-2 text-sm ml-2 cursor-pointer">
            <Checkbox checked={autoDeliver} onCheckedChange={(v) => setAutoDeliver(!!v)} />
            Send to parents automatically (WhatsApp + SMS)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent runs</CardTitle>
          <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {runs.length === 0 && <div className="text-sm text-muted-foreground">No runs yet.</div>}
          {runs.map((r) => {
            const pct = r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0;
            return (
              <div key={r.id} className="rounded border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{r.classes?.name} • {r.terms?.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "ready" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>{r.status}</Badge>
                    {r.status === "ready" && (
                      r.delivered_at ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {r.delivered_count || 0} sent
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline"
                          disabled={deliveringId === r.id || !can("reports.generate")}
                          onClick={() => deliverRun(r.id)}>
                          {deliveringId === r.id
                            ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            : <Send className="h-3 w-3 mr-1" />}
                          Send to parents
                        </Button>
                      )
                    )}
                    {r.zip_url && (
                      <a href={r.zip_url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" />ZIP</Button>
                      </a>
                    )}
                  </div>
                </div>
                {r.status !== "ready" && <Progress value={pct} />}
                <div className="text-xs text-muted-foreground">{r.completed}/{r.total} students {r.error && `• ${r.error}`}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}