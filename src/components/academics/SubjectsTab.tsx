import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

const PRESETS: Record<string, { code: string; name: string; category: string; assessment_type: string }[]> = {
  cbc_primary: [
    { code: "ENG", name: "English", category: "core", assessment_type: "both" },
    { code: "KIS", name: "Kiswahili", category: "core", assessment_type: "both" },
    { code: "MATH", name: "Mathematics", category: "core", assessment_type: "both" },
    { code: "SCI", name: "Science & Technology", category: "core", assessment_type: "both" },
    { code: "SST", name: "Social Studies", category: "core", assessment_type: "both" },
    { code: "CRE", name: "Religious Education", category: "core", assessment_type: "both" },
    { code: "ART", name: "Creative Arts", category: "co_curricular", assessment_type: "continuous" },
    { code: "PHE", name: "Physical & Health Education", category: "co_curricular", assessment_type: "continuous" },
  ],
  cbc_jss: [
    { code: "ENG", name: "English", category: "core", assessment_type: "both" },
    { code: "KIS", name: "Kiswahili", category: "core", assessment_type: "both" },
    { code: "MATH", name: "Mathematics", category: "core", assessment_type: "both" },
    { code: "ISCI", name: "Integrated Science", category: "core", assessment_type: "both" },
    { code: "SST", name: "Social Studies", category: "core", assessment_type: "both" },
    { code: "PRTE", name: "Pre-Technical Studies", category: "core", assessment_type: "both" },
    { code: "AGRI", name: "Agriculture", category: "core", assessment_type: "both" },
    { code: "CRE", name: "Religious Education", category: "core", assessment_type: "both" },
    { code: "BUSS", name: "Business Studies", category: "elective", assessment_type: "both" },
    { code: "PHE", name: "PE & Health", category: "co_curricular", assessment_type: "continuous" },
    { code: "LIFE", name: "Life Skills", category: "life_skills", assessment_type: "continuous" },
  ],
  k844: [
    { code: "ENG", name: "English", category: "core", assessment_type: "both" },
    { code: "KIS", name: "Kiswahili", category: "core", assessment_type: "both" },
    { code: "MATH", name: "Mathematics", category: "core", assessment_type: "both" },
    { code: "BIO", name: "Biology", category: "core", assessment_type: "both" },
    { code: "CHEM", name: "Chemistry", category: "core", assessment_type: "both" },
    { code: "PHYS", name: "Physics", category: "core", assessment_type: "both" },
    { code: "HIST", name: "History & Government", category: "elective", assessment_type: "both" },
    { code: "GEO", name: "Geography", category: "elective", assessment_type: "both" },
    { code: "CRE", name: "CRE", category: "elective", assessment_type: "both" },
    { code: "BUSS", name: "Business Studies", category: "elective", assessment_type: "both" },
  ],
  igcse_ls: [
    { code: "ENG", name: "English Language", category: "core", assessment_type: "both" },
    { code: "MATH", name: "Mathematics", category: "core", assessment_type: "both" },
    { code: "SCI", name: "Combined Science", category: "core", assessment_type: "both" },
    { code: "GLP", name: "Global Perspectives", category: "core", assessment_type: "continuous" },
    { code: "ICT", name: "ICT", category: "elective", assessment_type: "both" },
  ],
  cam_primary: [
    { code: "ENG", name: "English", category: "core", assessment_type: "both" },
    { code: "MATH", name: "Mathematics", category: "core", assessment_type: "both" },
    { code: "SCI", name: "Science", category: "core", assessment_type: "both" },
    { code: "ART", name: "Art & Design", category: "co_curricular", assessment_type: "continuous" },
    { code: "PE", name: "Physical Education", category: "co_curricular", assessment_type: "continuous" },
  ],
};
const PRESET_LABELS: Record<string, string> = {
  cbc_primary: "CBC Primary Core",
  cbc_jss: "CBC Junior Secondary",
  k844: "8-4-4 Secondary",
  igcse_ls: "IGCSE Lower Secondary",
  cam_primary: "Cambridge Primary",
};

export function SubjectsTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [preset, setPreset] = useState<string>("cbc_primary");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({ code: "", name: "", category: "core", assessment_type: "both" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: s }, { data: cs }] = await Promise.all([
      supabase.from("subjects").select("*").eq("tenant_id", tenantId),
      supabase.from("class_subjects").select("subject_id,class_id,teacher_id").eq("tenant_id", tenantId),
    ]);
    setRows(s || []); setClassSubjects(cs || []); setLoading(false);
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
    setSeeding(true);
    const list = PRESETS[preset] || [];
    const existing = new Set(rows.map((r) => (r.code || "").toUpperCase()));
    const toInsert = list.filter((p) => !existing.has(p.code)).map((p) => ({ ...p, tenant_id: tenantId }));
    if (toInsert.length === 0) {
      setSeeding(false);
      return toast({ title: "Nothing to seed", description: "All preset subjects already exist." });
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
      <Card>
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
      </Card>

      <Card>
        <CardHeader><CardTitle>Seed preset</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Curriculum preset</div>
            <select className="border rounded px-2 py-1 text-sm bg-background" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {Object.entries(PRESET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={seed} disabled={seeding}>
            {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Seed preset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Subjects ({rows.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <div className="text-center py-10 border rounded-lg border-dashed space-y-2">
              <p className="text-sm font-medium">Set up the subjects taught at your school</p>
              <p className="text-xs text-muted-foreground">Choose a curriculum preset above and click <strong>Seed preset</strong>, or add subjects manually.</p>
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
                        <Button size="icon" variant="ghost" onClick={() => remove(s.id, s.code)}><Trash2 className="h-4 w-4" /></Button>
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