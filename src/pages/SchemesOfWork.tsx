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
import { BookOpen, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function SchemesOfWork() {
  const { user, profile } = useAuth();
  const { can } = useTenant();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject_id: "", grade_level_id: "", term_id: "", rich_text: "" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [s, sub, g, t] = await Promise.all([
      supabase.from("schemes_of_work").select("*, subjects:subject_id(name), grade_levels:grade_level_id(name), terms:term_id(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("subjects").select("id,name").eq("tenant_id", tenantId),
      supabase.from("grade_levels").select("id,name").eq("tenant_id", tenantId),
      supabase.from("terms").select("id,name").eq("tenant_id", tenantId),
    ]);
    setRows(s.data || []); setSubjects(sub.data || []); setGrades(g.data || []); setTerms(t.data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!tenantId || !form.subject_id) return;
    const { error } = await supabase.from("schemes_of_work").insert({
      tenant_id: tenantId, uploaded_by: user?.id,
      subject_id: form.subject_id, grade_level_id: form.grade_level_id || null,
      term_id: form.term_id || null, rich_text: form.rich_text || null, status: "pending_review",
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ subject_id: "", grade_level_id: "", term_id: "", rich_text: "" }); load();
  };

  const approve = async (id: string) => {
    await supabase.from("schemes_of_work").update({ status: "approved", approved_by: user?.id }).eq("id", id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Schemes of Work</h1></div>

      <Card>
        <CardHeader><CardTitle>New scheme</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 md:grid-cols-3">
            <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">Subject…</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.grade_level_id} onChange={(e) => setForm({ ...form, grade_level_id: e.target.value })}>
              <option value="">Grade…</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })}>
              <option value="">Term…</option>
              {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <Textarea placeholder="Scheme content…" rows={4} value={form.rich_text} onChange={(e) => setForm({ ...form, rich_text: e.target.value })} />
          <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Submit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded border p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{r.subjects?.name} • {r.grade_levels?.name} • {r.terms?.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{r.rich_text}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
                {r.status !== "approved" && can("lessons.approve") && (
                  <Button size="sm" variant="outline" onClick={() => approve(r.id)}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}