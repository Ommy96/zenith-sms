import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScanLine, Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Job = {
  id: string; image_path: string; status: string;
  total_marks: number | null; max_marks: number | null;
  per_question: any[]; ai_notes: string | null; error_message: string | null;
  created_at: string;
};

export default function OcrGrader() {
  const { tenant } = useTenant();
  const [file, setFile] = useState<File | null>(null);
  const [maxMarks, setMaxMarks] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeResult, setActiveResult] = useState<Job | null>(null);

  const loadJobs = async () => {
    if (!tenant) return;
    const { data } = await supabase.from("ocr_grading_jobs")
      .select("*").eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }).limit(20);
    setJobs((data as Job[]) || []);
  };
  useEffect(() => { loadJobs(); }, [tenant?.id]);

  const grade = async () => {
    if (!file || !tenant) return;
    setBusy(true); setActiveResult(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${tenant.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("answer-sheets").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { data, error } = await supabase.functions.invoke("ai-ocr-grader", {
        body: { tenantId: tenant.id, imagePath: path, maxMarks: maxMarks ? Number(maxMarks) : undefined },
      });
      if (error) throw error;
      if ((data as any).error) throw new Error((data as any).error);
      toast.success("Sheet graded");
      await loadJobs();
      const fresh = (await supabase.from("ocr_grading_jobs").select("*").eq("id", (data as any).job_id).single()).data as Job;
      setActiveResult(fresh);
      setFile(null);
    } catch (e: any) {
      toast.error(e.message || "Grading failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScanLine className="h-6 w-6 text-primary" /> AI OCR Grader
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a scanned answer sheet. AI extracts per-question marks and the total score.
        </p>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Upload answer sheet</CardTitle>
          <CardDescription>JPG or PNG. Clear photo recommended.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Sheet image</Label>
              <Input type="file" accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Max marks (optional)</Label>
              <Input type="number" value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)} placeholder="e.g. 100" />
            </div>
          </div>
          <Button onClick={grade} disabled={!file || busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Grade with AI
          </Button>
        </CardContent>
      </Card>

      {activeResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Result
            </CardTitle>
            <CardDescription>
              {activeResult.total_marks ?? "?"} / {activeResult.max_marks ?? "?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeResult.ai_notes && (
              <p className="text-sm text-muted-foreground mb-3">{activeResult.ai_notes}</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr><th className="text-left py-2">Q</th><th className="text-left">Awarded</th><th className="text-left">Max</th><th className="text-left">Note</th></tr>
                </thead>
                <tbody>
                  {(activeResult.per_question || []).map((q: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{q.q}</td>
                      <td>{q.awarded}</td>
                      <td>{q.max}</td>
                      <td className="text-muted-foreground">{q.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent grading jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="space-y-2">
              {jobs.map((j) => (
                <button key={j.id} onClick={() => setActiveResult(j)}
                  className="w-full text-left flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    {j.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                     j.status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> :
                     <Loader2 className="h-4 w-4 animate-spin" />}
                    <span className="text-sm">{new Date(j.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{j.status}</Badge>
                    {j.total_marks != null && <span className="text-sm font-medium">{j.total_marks}/{j.max_marks ?? "?"}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}