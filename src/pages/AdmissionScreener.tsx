import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Sparkles, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Screening = {
  id: string; applicant_name: string | null; grade_level: string | null;
  score: number | null; recommendation: string | null;
  strengths: any[]; red_flags: any[]; interview_questions: any[];
  rationale: string | null; created_at: string;
};

const initial = {
  name: "", grade_level: "", age: "", previous_school: "", academic_average: "",
  notes: "", behaviour: "",
};

const recColor = (r: string | null) =>
  r === "admit" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
  r === "interview" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
  r === "waitlist" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
  r === "decline" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
  "bg-muted text-foreground";

export default function AdmissionScreener() {
  const { tenant } = useTenant();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<Screening | null>(null);
  const [history, setHistory] = useState<Screening[]>([]);

  const load = async () => {
    if (!tenant) return;
    const { data } = await supabase.from("admission_screenings")
      .select("*").eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }).limit(20);
    setHistory((data as Screening[]) || []);
  };
  useEffect(() => { load(); }, [tenant?.id]);

  const screen = async () => {
    if (!form.name || !tenant) { toast.error("Applicant name is required"); return; }
    setBusy(true);
    try {
      const applicant = {
        name: form.name, grade_level: form.grade_level,
        age: form.age ? Number(form.age) : undefined,
        previous_school: form.previous_school || undefined,
        academic_average: form.academic_average ? Number(form.academic_average) : undefined,
        behaviour: form.behaviour || undefined,
        notes: form.notes || undefined,
      };
      const { data, error } = await supabase.functions.invoke("ai-admission-screener", {
        body: { tenantId: tenant.id, applicant },
      });
      if (error) throw error;
      if ((data as any).error) throw new Error((data as any).error);
      setActive((data as any).screening);
      toast.success("Applicant screened");
      load();
    } catch (e: any) {
      toast.error(e.message || "Screening failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> AI Admission Screener
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Score applicants against your school's criteria. Get strengths, red flags, and interview questions.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Applicant details</CardTitle>
            <CardDescription>Enter what you know — leave blanks if unknown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Grade applying to</Label><Input value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} placeholder="e.g. Grade 5" /></div>
              <div><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
            </div>
            <div><Label>Previous school</Label><Input value={form.previous_school} onChange={(e) => setForm({ ...form, previous_school: e.target.value })} /></div>
            <div><Label>Academic average (%)</Label><Input type="number" value={form.academic_average} onChange={(e) => setForm({ ...form, academic_average: e.target.value })} /></div>
            <div><Label>Behaviour record</Label><Textarea rows={2} value={form.behaviour} onChange={(e) => setForm({ ...form, behaviour: e.target.value })} /></div>
            <div><Label>Other notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={screen} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Screen applicant
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!active ? (
              <p className="text-sm text-muted-foreground">Run a screening to see results.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Score</div>
                    <div className="text-3xl font-bold">{active.score ?? "?"}<span className="text-base text-muted-foreground">/100</span></div>
                  </div>
                  <Badge className={recColor(active.recommendation)}>{active.recommendation || "—"}</Badge>
                </div>
                {active.rationale && <p className="text-sm">{active.rationale}</p>}
                {active.strengths?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" />Strengths</div>
                    <ul className="text-sm list-disc pl-5 space-y-1">{active.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {active.red_flags?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" />Red flags</div>
                    <ul className="text-sm list-disc pl-5 space-y-1">{active.red_flags.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {active.interview_questions?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Suggested interview questions</div>
                    <ol className="text-sm list-decimal pl-5 space-y-1">{active.interview_questions.map((s: string, i: number) => <li key={i}>{s}</li>)}</ol>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent screenings</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">No screenings yet.</p> : (
            <div className="divide-y">
              {history.map((h) => (
                <button key={h.id} onClick={() => setActive(h)} className="w-full text-left py-3 flex items-center justify-between hover:bg-accent rounded px-2">
                  <div>
                    <div className="text-sm font-medium">{h.applicant_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{h.grade_level} · {new Date(h.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{h.score ?? "?"}</span>
                    <Badge className={recColor(h.recommendation)}>{h.recommendation || "—"}</Badge>
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