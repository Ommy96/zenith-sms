import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, CheckSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const LEVELS = [
  { v: 1, label: "BE", desc: "Below Expectations", color: "bg-destructive/10 text-destructive border-destructive/30" },
  { v: 2, label: "AE", desc: "Approaching Expectations", color: "bg-warning/10 text-warning border-warning/30" },
  { v: 3, label: "ME", desc: "Meeting Expectations", color: "bg-success/10 text-success border-success/30" },
  { v: 4, label: "EE", desc: "Exceeding Expectations", color: "bg-primary/10 text-primary border-primary/30" },
];

export default function CbcAssessment() {
  const { user, profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [areas, setAreas] = useState<any[]>([]);
  const [strands, setStrands] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [strandId, setStrandId] = useState("");
  const [subId, setSubId] = useState("");
  const [outcomeId, setOutcomeId] = useState("");
  const [termId, setTermId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { level?: number; comment?: string }>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [a, s, ss, lo, c] = await Promise.all([
      supabase.from("learning_areas").select("*").eq("tenant_id", tenantId),
      supabase.from("strands").select("*").eq("tenant_id", tenantId),
      supabase.from("sub_strands").select("*").eq("tenant_id", tenantId),
      supabase.from("learning_outcomes").select("*").eq("tenant_id", tenantId),
      supabase.from("classes").select("id,name").eq("tenant_id", tenantId),
    ]);
    setAreas(a.data || []); setStrands(s.data || []); setSubs(ss.data || []); setOutcomes(lo.data || []); setClasses(c.data || []);
    const { data: term } = await supabase.rpc("current_term" as any, { _tenant: tenantId });
    setTermId(term || null);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!classId || !tenantId) { setStudents([]); return; }
    supabase.from("students").select("id,first_name,last_name,admission_number").eq("tenant_id", tenantId).eq("current_class_id", classId)
      .then(({ data }) => setStudents(data || []));
  }, [classId, tenantId]);

  useEffect(() => {
    if (!outcomeId) return;
    supabase.from("cbc_assessment_scores").select("student_id, performance_level, comment").eq("learning_outcome_id", outcomeId).eq("term_id", termId || "")
      .then(({ data }) => {
        const map: typeof scores = {};
        (data || []).forEach((r: any) => { map[r.student_id] = { level: r.performance_level, comment: r.comment }; });
        setScores(map);
      });
  }, [outcomeId, termId]);

  const setLevel = async (studentId: string, level: number) => {
    setScores((s) => ({ ...s, [studentId]: { ...s[studentId], level } }));
    await supabase.from("cbc_assessment_scores").insert({
      tenant_id: tenantId!, student_id: studentId, learning_outcome_id: outcomeId, term_id: termId,
      performance_level: level, teacher_id: user?.id, comment: scores[studentId]?.comment,
    });
  };

  const bulkApply = async (level: number) => {
    if (!selected.size) return;
    setSaving(true);
    const rows = Array.from(selected).map((sid) => ({
      tenant_id: tenantId!, student_id: sid, learning_outcome_id: outcomeId, term_id: termId,
      performance_level: level, teacher_id: user?.id,
    }));
    await supabase.from("cbc_assessment_scores").insert(rows);
    const next = { ...scores }; selected.forEach((sid) => { next[sid] = { ...next[sid], level }; });
    setScores(next); setSaving(false);
    toast({ title: `Applied level ${level} to ${selected.size} students` });
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <div><h1 className="text-2xl font-bold">CBC Assessment</h1>
          <p className="text-sm text-muted-foreground">Score against learning outcomes using performance levels 1–4.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Pick what to assess</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-5">
          <select className="border rounded px-2 py-1.5 text-sm bg-background" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Class…</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border rounded px-2 py-1.5 text-sm bg-background" value={areaId} onChange={(e) => { setAreaId(e.target.value); setStrandId(""); setSubId(""); setOutcomeId(""); }}>
            <option value="">Learning area…</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="border rounded px-2 py-1.5 text-sm bg-background" value={strandId} onChange={(e) => { setStrandId(e.target.value); setSubId(""); setOutcomeId(""); }} disabled={!areaId}>
            <option value="">Strand…</option>
            {strands.filter((s) => s.learning_area_id === areaId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border rounded px-2 py-1.5 text-sm bg-background" value={subId} onChange={(e) => { setSubId(e.target.value); setOutcomeId(""); }} disabled={!strandId}>
            <option value="">Sub-strand…</option>
            {subs.filter((s) => s.strand_id === strandId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="border rounded px-2 py-1.5 text-sm bg-background" value={outcomeId} onChange={(e) => setOutcomeId(e.target.value)} disabled={!subId}>
            <option value="">Outcome…</option>
            {outcomes.filter((o) => o.sub_strand_id === subId).map((o) => <option key={o.id} value={o.id}>{o.description.slice(0, 60)}</option>)}
          </select>
        </CardContent>
      </Card>

      {classId && outcomeId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Students ({students.length})</CardTitle>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{selected.size} selected — apply:</span>
                {LEVELS.map((l) => (
                  <Button key={l.v} size="sm" variant="outline" disabled={saving} onClick={() => bulkApply(l.v)}>{l.label}</Button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {students.map((st) => {
              const cur = scores[st.id]?.level;
              return (
                <div key={st.id} className="flex items-center gap-3 rounded border p-2">
                  <Checkbox checked={selected.has(st.id)} onCheckedChange={(v) => {
                    const next = new Set(selected); v ? next.add(st.id) : next.delete(st.id); setSelected(next);
                  }} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{st.last_name}, {st.first_name}</div>
                    <div className="text-xs text-muted-foreground">{st.admission_number}</div>
                  </div>
                  <div className="flex gap-1">
                    {LEVELS.map((l) => (
                      <button
                        key={l.v}
                        onClick={() => setLevel(st.id, l.v)}
                        title={l.desc}
                        className={`h-9 w-9 rounded border text-xs font-semibold ${cur === l.v ? l.color + " ring-2 ring-offset-1 ring-primary" : "bg-background hover:bg-muted"}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}