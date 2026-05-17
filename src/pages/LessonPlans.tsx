import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ClipboardList, Plus, Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type LessonPlan = any;

export default function LessonPlans() {
  const { user, profile } = useAuth();
  const { can } = useTenant();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<LessonPlan | null>(null);
  const [form, setForm] = useState({
    subject_id: "", class_id: "", date: new Date().toISOString().slice(0, 10),
    objectives: "", materials: "", introduction: "", development: "",
    conclusion: "", assessment: "", homework: "", reflection: "",
    learning_outcome_ids: [] as string[],
  });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [lp, sub, cls, lo] = await Promise.all([
      supabase.from("lesson_plans")
        .select("*, subjects:subject_id(name), classes:class_id(name)")
        .eq("tenant_id", tenantId)
        .order("date", { ascending: false }).limit(100),
      supabase.from("subjects").select("id,name").eq("tenant_id", tenantId),
      supabase.from("classes").select("id,name").eq("tenant_id", tenantId),
      supabase.from("learning_outcomes").select("id,description").eq("tenant_id", tenantId).limit(200),
    ]);
    setRows(lp.data || []);
    setSubjects(sub.data || []);
    setClasses(cls.data || []);
    setOutcomes(lo.data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      subject_id: "", class_id: "", date: new Date().toISOString().slice(0, 10),
      objectives: "", materials: "", introduction: "", development: "",
      conclusion: "", assessment: "", homework: "", reflection: "",
      learning_outcome_ids: [],
    });
  };

  const openNew = () => { resetForm(); setOpen(true); };
  const openEdit = (lp: LessonPlan) => {
    setEditing(lp);
    setForm({
      subject_id: lp.subject_id || "", class_id: lp.class_id || "",
      date: lp.date || new Date().toISOString().slice(0, 10),
      objectives: lp.objectives || "", materials: lp.materials || "",
      introduction: lp.introduction || "", development: lp.development || "",
      conclusion: lp.conclusion || "", assessment: lp.assessment || "",
      homework: lp.homework || "", reflection: lp.reflection || "",
      learning_outcome_ids: lp.learning_outcome_ids || [],
    });
    setOpen(true);
  };

  const save = async (status: "draft" | "pending_review") => {
    if (!tenantId || !form.subject_id) {
      toast({ title: "Subject required", variant: "destructive" }); return;
    }
    const payload: any = {
      tenant_id: tenantId,
      teacher_id: null,
      subject_id: form.subject_id,
      class_id: form.class_id || null,
      date: form.date,
      objectives: form.objectives || null,
      materials: form.materials || null,
      introduction: form.introduction || null,
      development: form.development || null,
      conclusion: form.conclusion || null,
      assessment: form.assessment || null,
      homework: form.homework || null,
      reflection: form.reflection || null,
      learning_outcome_ids: form.learning_outcome_ids,
      hod_status: status,
    };
    const { error } = editing
      ? await supabase.from("lesson_plans").update(payload).eq("id", editing.id)
      : await supabase.from("lesson_plans").insert(payload);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: editing ? "Updated" : "Created" });
    setOpen(false); resetForm(); load();
  };

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("lesson_plans")
      .update({ hod_status: status, hod_id: user?.id }).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  const draftWithAi = async () => {
    if (!form.subject_id) return toast({ title: "Pick a subject first" });
    setDrafting(true);
    try {
      const subj = subjects.find((s) => s.id === form.subject_id);
      const cls = classes.find((c) => c.id === form.class_id);
      const selectedOutcomes = outcomes
        .filter((o) => form.learning_outcome_ids.includes(o.id))
        .map((o) => o.description);
      const { data, error } = await supabase.functions.invoke("draft-lesson-plan", {
        body: {
          subject: subj?.name,
          class_name: cls?.name,
          date: form.date,
          objectives: form.objectives,
          learning_outcomes: selectedOutcomes,
        },
      });
      if (error) throw error;
      const d = (data as any)?.plan || {};
      setForm((f) => ({
        ...f,
        objectives: d.objectives || f.objectives,
        materials: d.materials || f.materials,
        introduction: d.introduction || f.introduction,
        development: d.development || f.development,
        conclusion: d.conclusion || f.conclusion,
        assessment: d.assessment || f.assessment,
        homework: d.homework || f.homework,
      }));
      toast({ title: "AI draft inserted", description: "Review and edit before submitting" });
    } catch (e: any) {
      toast({ title: "AI draft failed", description: e.message, variant: "destructive" });
    } finally {
      setDrafting(false);
    }
  };

  const toggleOutcome = (id: string) => {
    setForm((f) => ({
      ...f,
      learning_outcome_ids: f.learning_outcome_ids.includes(id)
        ? f.learning_outcome_ids.filter((x) => x !== id)
        : [...f.learning_outcome_ids, id],
    }));
  };

  const filtered = rows.filter((r) => filter === "all" ? true : r.hod_status === filter);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Lesson Plans</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm bg-background">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />New plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit lesson plan" : "New lesson plan"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-3">
                  <select className="border rounded px-2 py-1.5 text-sm bg-background"
                    value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                    <option value="">Subject…</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select className="border rounded px-2 py-1.5 text-sm bg-background"
                    value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                    <option value="">Class…</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>

                {outcomes.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-1 text-muted-foreground">Learning outcomes (CBC)</div>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded">
                      {outcomes.map((o) => (
                        <Badge key={o.id}
                          variant={form.learning_outcome_ids.includes(o.id) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => toggleOutcome(o.id)}>
                          {o.description.slice(0, 60)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={draftWithAi} disabled={drafting}>
                    {drafting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Draft with AI
                  </Button>
                </div>

                {[
                  ["objectives", "Objectives"], ["materials", "Materials"],
                  ["introduction", "Introduction"], ["development", "Lesson development"],
                  ["conclusion", "Conclusion"], ["assessment", "Assessment"],
                  ["homework", "Homework"], ["reflection", "Reflection"],
                ].map(([k, label]) => (
                  <div key={k}>
                    <div className="text-xs font-medium mb-1 text-muted-foreground">{label}</div>
                    <Textarea rows={3} value={(form as any)[k]}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => save("draft")}>Save draft</Button>
                <Button onClick={() => save("pending_review")}>Submit for HOD review</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent plans</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center">No lesson plans yet.</div>
          )}
          {filtered.map((r) => (
            <div key={r.id} className="rounded border p-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">
                  {r.subjects?.name || "—"} • {r.classes?.name || "—"} • {r.date}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {r.objectives || r.development || r.introduction}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={
                  r.hod_status === "approved" ? "default" :
                  r.hod_status === "rejected" ? "destructive" : "secondary"
                }>{r.hod_status}</Badge>
                <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Edit</Button>
                {r.hod_status === "pending_review" && can("lessons.approve") && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "approved")}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>
                      <XCircle className="h-3 w-3 mr-1" />Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}