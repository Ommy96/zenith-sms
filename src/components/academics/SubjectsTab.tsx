import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Sparkles, Search } from "lucide-react";

const CATEGORIES = ["core", "elective", "co_curricular", "life_skills"] as const;
const CATEGORY_ORDER: Record<string, number> = { core: 1, elective: 2, co_curricular: 3, life_skills: 4 };
const ASSESS = ["continuous", "exam", "both"] as const;

const CBC_16 = [
  ["ENG", "English", "core"], ["KIS", "Kiswahili", "core"], ["MATH", "Mathematics", "core"],
  ["ISCI", "Integrated Science", "core"], ["SST", "Social Studies", "core"], ["PRTE", "Pre-Technical Studies", "core"],
  ["AGRI", "Agriculture and Nutrition", "core"], ["CRE", "Christian Religious Education", "elective"],
  ["IRE", "Islamic Religious Education", "elective"], ["HRE", "Hindu Religious Education", "elective"],
  ["CA", "Creative Arts", "co_curricular"], ["PHE", "Physical and Health Education", "co_curricular"],
  ["BUS", "Business Studies", "elective"], ["CS", "Computer Science", "elective"],
  ["LS", "Life Skills Education", "life_skills"], ["FL", "Foreign Languages", "elective"],
] as const;

export function SubjectsTab() {
  const { profile } = useAuth();
  const { tenant, can } = useTenant();
  const tenantId = tenant?.id || profile?.tenant_id;
  const canManage = can("subjects.manage");
  const [rows, setRows] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({ code: "", name: "", category: "core", assessment_type: "both" });
  const [grades, setGrades] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: s }, { data: cs }, { data: gg }] = await Promise.all([
      supabase.from("subjects").select("*").eq("tenant_id", tenantId),
      supabase.from("class_subjects").select("subject_id,class_id,teacher_id").eq("tenant_id", tenantId),
      supabase.from("grade_levels").select("id,name,sort_order").eq("tenant_id", tenantId).order("sort_order"),
    ]);
    setRows(s || []); setClassSubjects(cs || []); setGrades(gg || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const classCounts = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    classSubjects.forEach((x) => { (m[x.subject_id] ??= new Set()).add(x.class_id); });
    return m;
  }, [classSubjects]);
  const teacherCounts = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    classSubjects.forEach((x) => { if (x.teacher_id) (m[x.subject_id] ??= new Set()).add(x.teacher_id); });
    return m;
  }, [classSubjects]);

  const add = async () => {
    if (!tenantId) return toast({ title: "No school selected", variant: "destructive" });
    const code = form.code.trim().toUpperCase();
    if (!code || !form.name.trim()) return toast({ title: "Missing fields", description: "Enter a code and name.", variant: "destructive" });
    if (!/^[A-Z]{2,5}$/.test(code)) return toast({ title: "Invalid code", description: "Code must be 2-5 uppercase letters.", variant: "destructive" });
    if (rows.some((r) => (r.code || "").toUpperCase() === code))
      return toast({ title: `Subject ${code} already exists`, variant: "destructive" });
    const { error } = await supabase.from("subjects").insert({ tenant_id: tenantId, code, name: form.name.trim(), category: form.category as any, assessment_type: form.assessment_type as any });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Subject added", description: `${code} — ${form.name}` });
    setForm({ code: "", name: "", category: "core", assessment_type: "both" });
    load();
  };

  const seed = async () => {
    if (!tenantId) return;
    if (rows.length > 0) return toast({ title: "CBC seed is only available before subjects are added", variant: "destructive" });
    if (!confirm("Add the 16 CBC subjects to this school?")) return;
    setSeeding(true);
    const toInsert = CBC_16.map(([code, name, category]) => ({ code, name, category, assessment_type: category === "co_curricular" || category === "life_skills" ? "continuous" : "both", grade_levels: grades.map((g) => g.id), tenant_id: tenantId }));
    if (toInsert.length === 0) {
      setSeeding(false);
      return toast({ title: "Nothing to seed", description: "CBC subjects already exist." });
    }
    const { error } = await supabase.from("subjects").insert(toInsert as any);
    setSeeding(false);
    if (error) return toast({ title: "Seed failed", description: error.message, variant: "destructive" });
    toast({ title: "Subjects seeded", description: `${toInsert.length} added` });
    load();
  };

  const remove = async (id: string, code: string) => {
    if ((classCounts[id]?.size || 0) > 0)
      return toast({ title: "Cannot delete", description: `${code} is assigned to ${classCounts[id].size} class(es).`, variant: "destructive" });
    if (!confirm("Delete subject?")) return;
    await supabase.from("subjects").delete().eq("id", id);
    toast({ title: "Subject deleted" });
    load();
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== "all") list = list.filter((r) => r.category === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => (r.code || "").toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const ca = CATEGORY_ORDER[a.category] ?? 99, cb = CATEGORY_ORDER[b.category] ?? 99;
      if (ca !== cb) return ca - cb;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [rows, search, filter]);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {canManage && <Card>
        <CardHeader><CardTitle>Add subject</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-5">
            <Input placeholder="Code (MATH)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={5} />
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
            <select className="border rounded px-2 py-1 text-sm bg-background" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
            <select className="border rounded px-2 py-1 text-sm bg-background" value={form.assessment_type} onChange={(e) => setForm({ ...form, assessment_type: e.target.value })}>
              {ASSESS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add subject</Button>
        </CardContent>
      </Card>}

      {canManage && rows.length === 0 && <Card>
        <CardHeader><CardTitle>Set up CBC subjects</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Curriculum</div>
            <p className="text-sm font-medium">Kenya CBC · 16 subjects</p>
          </div>
          <Button size="sm" onClick={seed} disabled={seeding}>
            {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Add 16 subjects
          </Button>
        </CardContent>
      </Card>}

      <Card>
        <CardHeader><CardTitle>Subjects ({rows.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-10 border rounded-lg border-dashed space-y-2">
              <p className="text-sm font-medium">Set up the subjects taught at your school</p>
              <p className="text-xs text-muted-foreground">Add the 16-subject CBC set above, or add subjects manually.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input placeholder="Search code or name" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-8 w-56" />
                </div>
                <div className="flex gap-1 text-xs">
                  {["all", ...CATEGORIES].map((c) => (
                    <button key={c} onClick={() => setFilter(c)} className={`px-2 py-1 rounded border ${filter === c ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                      {c === "all" ? "All" : c.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead className="text-right">Classes</TableHead>
                    <TableHead className="text-right">Teachers</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.code}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant="outline">{(s.category || "").replace("_", " ")}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{s.assessment_type}</Badge></TableCell>
                      <TableCell className="text-right">{classCounts[s.id]?.size || 0}</TableCell>
                      <TableCell className="text-right">{teacherCounts[s.id]?.size || 0}</TableCell>
                      <TableCell className="text-right">
                         {canManage && <Button size="icon" variant="ghost" onClick={() => remove(s.id, s.code)}><Trash2 className="h-4 w-4" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">No subjects match.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}