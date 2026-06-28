import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClipboardList, Plus, Loader2, Calendar as CalendarIcon, Sparkles, Edit, Lock, Send,
  FileText, BarChart3, BookOpenCheck, LayoutTemplate, Search,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";


const statusGroup = (s: string): "planned" | "in_progress" | "completed" => {
  if (["in_progress", "in progress", "active"].includes(s)) return "in_progress";
  if (["completed", "done", "locked", "published"].includes(s)) return "completed";
  return "planned";
};
const groupLabel: Record<string, string> = { planned: "Planned", in_progress: "In progress", completed: "Completed" };
const typeColor: Record<string, string> = {
  cat: "bg-primary/10 text-primary border-primary/20",
  midterm: "bg-warning/10 text-warning border-warning/20",
  "mid-term": "bg-warning/10 text-warning border-warning/20",
  endterm: "bg-success/10 text-success border-success/20",
  "end-term": "bg-success/10 text-success border-success/20",
  mock: "bg-accent-soft text-accent border-accent/20",
  knec_mock: "bg-accent-soft text-accent border-accent/20",
};
const CBC_LEVELS = ["BE", "AE", "ME", "EE"];

function daysFromNow(date?: string | null) {
  if (!date) return null;
  const d = new Date(date); const n = new Date();
  return Math.round((d.getTime() - n.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Examinations() {
  const { profile } = useAuth();
  const { tenant } = useTenant();
  const tenantId = profile?.tenant_id;
  const isCBC = (tenant?.curriculum || "").toLowerCase() === "cbc";

  const [tab, setTab] = useState("calendar");
  const [loading, setLoading] = useState(true);

  // shared data
  const [exams, setExams] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [examSubjects, setExamSubjects] = useState<any[]>([]);

  // calendar filters
  const [search, setSearch] = useState("");
  const [filterTerm, setFilterTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  // schedule dialog
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [examForm, setExamForm] = useState<any>({
    name: "", type: "midterm", term: "", academic_year: new Date().getFullYear().toString(),
    start_date: "", end_date: "", status: "planned",
  });

  // seed term dialog
  const [seedOpen, setSeedOpen] = useState(false);
  const [seedTermId, setSeedTermId] = useState("");

  // grade entry
  const [geExam, setGeExam] = useState("");
  const [geClass, setGeClass] = useState("");
  const [geSubject, setGeSubject] = useState("");

  // results / analytics
  const [resultsExam, setResultsExam] = useState("");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [e, t, c, s] = await Promise.all([
      supabase.from("exams").select("*").eq("tenant_id", tenantId).order("start_date", { ascending: false }),
      supabase.from("terms").select("id,name,academic_year,start_date,end_date,is_current").eq("tenant_id", tenantId).order("start_date", { ascending: false }),
      supabase.from("classes").select("id,name").eq("tenant_id", tenantId).order("name"),
      supabase.from("subjects").select("id,code,name").eq("tenant_id", tenantId).order("name"),
    ]);
    setExams(e.data || []); setTerms(t.data || []); setClasses(c.data || []); setSubjects(s.data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  // load results count per exam to drive banner + progress
  useEffect(() => {
    if (!tenantId || exams.length === 0) return;
    supabase.from("exam_results").select("exam_id").eq("tenant_id", tenantId).then(({ data }) => {
      setResults(data || []);
    });
    supabase.from("exam_subjects").select("*").eq("tenant_id", tenantId).then(({ data }) => {
      setExamSubjects(data || []);
    });
  }, [tenantId, exams]);

  // students for grade entry
  useEffect(() => {
    if (!tenantId || !geClass) { setStudents([]); return; }
    supabase.from("students").select("id,admission_number,first_name,last_name,photo_url").eq("tenant_id", tenantId).eq("class_id", geClass).order("last_name").then(({ data }) => setStudents(data || []));
  }, [tenantId, geClass]);

  const resultsByExam = useMemo(() => {
    const m: Record<string, number> = {};
    results.forEach((r) => { m[r.exam_id] = (m[r.exam_id] || 0) + 1; });
    return m;
  }, [results]);

  const examProgress = (exam: any) => {
    const subs = examSubjects.filter((es) => es.exam_id === exam.id).length || 1;
    const studentsExpected = 30; // approximate; absent class-attachment table
    const expected = subs * studentsExpected;
    const have = resultsByExam[exam.id] || 0;
    return Math.min(100, Math.round((have / expected) * 100));
  };

  // CONTEXTUAL BANNER
  const banner = useMemo(() => {
    const inProg = exams.find((e) => statusGroup(e.status) === "in_progress");
    if (inProg) {
      return { text: `${inProg.name} — marking in progress (${examProgress(inProg)}% of results entered)`, cta: "Continue grading", onClick: () => { setGeExam(inProg.id); setTab("grade"); } };
    }
    const next = exams.filter((e) => statusGroup(e.status) === "planned" && e.start_date).sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
    if (next) {
      const days = daysFromNow(next.start_date);
      return { text: `All caught up. Next exam: ${next.name} starts in ${days} days.`, cta: "View calendar", onClick: () => setTab("calendar") };
    }
    return { text: "No exams scheduled yet. Use 'Schedule exam' or seed a term's calendar to get started.", cta: "Seed term calendar", onClick: () => setSeedOpen(true) };
  }, [exams, examSubjects, results]);

  // FILTERED + GROUPED for calendar tab
  const filtered = useMemo(() => {
    return exams.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterTerm && e.term_id !== filterTerm && e.term !== filterTerm) return false;
      if (filterType && e.type !== filterType) return false;
      return true;
    });
  }, [exams, search, filterTerm, filterType]);
  const grouped = useMemo(() => {
    const g: Record<string, any[]> = { planned: [], in_progress: [], completed: [] };
    filtered.forEach((e) => { g[statusGroup(e.status)].push(e); });
    return g;
  }, [filtered]);

  // CREATE EXAM
  const createExam = async () => {
    if (!tenantId || !examForm.name) return;
    const { error } = await supabase.from("exams").insert({ ...examForm, tenant_id: tenantId });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setScheduleOpen(false); setExamForm({ ...examForm, name: "" }); load();
    toast({ title: "Exam scheduled" });
  };

  // SEED KENYAN TERM PATTERN
  const seedTermExams = async () => {
    if (!tenantId || !seedTermId) return;
    const term = terms.find((t) => t.id === seedTermId);
    if (!term) return;
    const start = new Date(term.start_date);
    const week = (n: number) => { const d = new Date(start); d.setDate(d.getDate() + (n - 1) * 7); return d.toISOString().slice(0, 10); };
    const rows = [
      { name: `${term.name} CAT 1`, type: "cat", start_date: week(2), end_date: week(2), status: "planned" },
      { name: `${term.name} Midterm`, type: "midterm", start_date: week(6), end_date: week(6), status: "planned" },
      { name: `${term.name} End-Term`, type: "endterm", start_date: week(12), end_date: week(12), status: "planned" },
    ].map((r) => ({ ...r, tenant_id: tenantId, term: term.name, academic_year: term.academic_year, term_id: term.id }));
    const { error } = await supabase.from("exams").insert(rows);
    if (error) return toast({ title: "Seed failed", description: error.message, variant: "destructive" });
    toast({ title: "Term exam calendar seeded" });
    setSeedOpen(false); load();
  };

  // GRADE ENTRY: load existing results
  const [grid, setGrid] = useState<Record<string, any>>({}); // key=`${student_id}|${subject_id}` -> {id, score, grade}
  useEffect(() => {
    if (!tenantId || !geExam || students.length === 0) { setGrid({}); return; }
    const subjectIds = geSubject ? [geSubject] : examSubjects.filter((es) => es.exam_id === geExam).map((es) => es.subject_id);
    if (subjectIds.length === 0) { setGrid({}); return; }
    supabase.from("exam_results").select("*").eq("tenant_id", tenantId).eq("exam_id", geExam)
      .in("student_id", students.map((s) => s.id)).then(({ data }) => {
        const map: Record<string, any> = {};
        (data || []).forEach((r) => {
          const subjId = subjects.find((s) => s.name === r.subject || s.code === r.subject)?.id;
          if (subjId) map[`${r.student_id}|${subjId}`] = r;
        });
        setGrid(map);
      });
  }, [tenantId, geExam, geSubject, students, examSubjects, subjects]);

  const saveCell = async (studentId: string, subjectId: string, value: string) => {
    if (!tenantId || !geExam) return;
    const subj = subjects.find((s) => s.id === subjectId);
    const es = examSubjects.find((x) => x.exam_id === geExam && x.subject_id === subjectId);
    const numeric = !isCBC && value !== "" ? Number(value) : null;
    if (!isCBC && numeric !== null && es?.max_marks && numeric > Number(es.max_marks)) {
      toast({ title: "Out of range", description: `Max marks ${es.max_marks}`, variant: "destructive" });
    }
    const existing = grid[`${studentId}|${subjectId}`];
    const payload: any = {
      tenant_id: tenantId, exam_id: geExam, student_id: studentId,
      subject: subj?.name || subj?.code || subjectId,
      score: isCBC ? null : numeric,
      grade: isCBC ? value : (existing?.grade || null),
    };
    if (existing?.id) {
      await supabase.from("exam_results").update(payload).eq("id", existing.id);
    } else {
      const { data } = await supabase.from("exam_results").insert(payload).select().single();
      if (data) setGrid({ ...grid, [`${studentId}|${subjectId}`]: data });
    }
  };

  const geSubjectList = useMemo(() => {
    if (!geExam) return [];
    const ids = examSubjects.filter((es) => es.exam_id === geExam).map((es) => es.subject_id);
    let list = subjects.filter((s) => ids.includes(s.id));
    if (geSubject) list = list.filter((s) => s.id === geSubject);
    return list;
  }, [geExam, geSubject, examSubjects, subjects]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Examinations & Results</h1>
            <p className="text-sm text-muted-foreground">Manage exams, grading, and performance analytics.</p>
          </div>
        </div>
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Schedule exam</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule exam</DialogTitle><DialogDescription>Add an exam to the calendar.</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} placeholder="Term 2 Midterm" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Type</Label>
                  <Select value={examForm.type} onValueChange={(v) => setExamForm({ ...examForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cat">CAT</SelectItem>
                      <SelectItem value="midterm">Midterm</SelectItem>
                      <SelectItem value="endterm">End-Term</SelectItem>
                      <SelectItem value="mock">Mock</SelectItem>
                      <SelectItem value="knec_mock">KNEC Mock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Term</Label>
                  <Select value={examForm.term_id || ""} onValueChange={(v) => { const t = terms.find((x) => x.id === v); setExamForm({ ...examForm, term_id: v, term: t?.name, academic_year: t?.academic_year }); }}>
                    <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                    <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.academic_year})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Start</Label><Input type="date" value={examForm.start_date} onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })} /></div>
                <div><Label>End</Label><Input type="date" value={examForm.end_date} onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button><Button onClick={createExam}>Schedule</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* CONTEXTUAL BANNER */}
      <div className="rounded-lg border bg-accent-soft/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">{banner.text}</div>
        <Button size="sm" variant="outline" onClick={banner.onClick}>{banner.cta}</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="overflow-x-auto flex-wrap h-auto">
          <TabsTrigger value="calendar"><CalendarIcon className="h-3.5 w-3.5 mr-1" />Calendar</TabsTrigger>
          <TabsTrigger value="grade"><BookOpenCheck className="h-3.5 w-3.5 mr-1" />Grade entry</TabsTrigger>
          <TabsTrigger value="results"><FileText className="h-3.5 w-3.5 mr-1" />Results</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-3.5 w-3.5 mr-1" />Analytics</TabsTrigger>
          <TabsTrigger value="templates"><LayoutTemplate className="h-3.5 w-3.5 mr-1" />Templates</TabsTrigger>
        </TabsList>

        {/* CALENDAR */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle>Exam calendar</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input className="pl-7 h-8 w-44" placeholder="Search exam…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={filterTerm || "_all"} onValueChange={(v) => setFilterTerm(v === "_all" ? "" : v)}>
                  <SelectTrigger className="h-8 w-36"><SelectValue placeholder="All terms" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">All terms</SelectItem>{terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={filterType || "_all"} onValueChange={(v) => setFilterType(v === "_all" ? "" : v)}>
                  <SelectTrigger className="h-8 w-32"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">All types</SelectItem>
                    <SelectItem value="cat">CAT</SelectItem><SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="endterm">End-Term</SelectItem><SelectItem value="mock">Mock</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={seedOpen} onOpenChange={setSeedOpen}>
                  <DialogTrigger asChild><Button size="sm" variant="outline"><Sparkles className="h-3.5 w-3.5 mr-1" />Seed term</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Seed term exam calendar</DialogTitle><DialogDescription>Creates a Kenyan standard pattern: CAT (week 2), Midterm (week 6), End-Term (week 12).</DialogDescription></DialogHeader>
                    <div><Label>Term</Label>
                      <Select value={seedTermId} onValueChange={setSeedTermId}>
                        <SelectTrigger><SelectValue placeholder="Pick term" /></SelectTrigger>
                        <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.academic_year})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setSeedOpen(false)}>Cancel</Button><Button onClick={seedTermExams} disabled={!seedTermId}>Seed</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {exams.length === 0 ? (
                <EmptyState icon={<CalendarIcon className="h-5 w-5" />} title="No exams yet" description="Schedule a single exam, or seed a whole term's calendar with one click." actionLabel="Seed term calendar" onAction={() => setSeedOpen(true)} />
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {(["planned", "in_progress", "completed"] as const).map((g) => (
                    <div key={g} className="space-y-2">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{groupLabel[g]} ({grouped[g].length})</div>
                      {grouped[g].length === 0 ? (
                        <div className="rounded-lg border border-dashed text-xs text-muted-foreground p-3 text-center">None</div>
                      ) : grouped[g].map((e) => {
                        const prog = examProgress(e);
                        const subjCount = examSubjects.filter((es) => es.exam_id === e.id).length;
                        return (
                          <Card key={e.id} className="border">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-medium text-sm">{e.name}</div>
                                  <div className="text-[11px] text-muted-foreground">{e.start_date}{e.end_date && e.end_date !== e.start_date ? ` – ${e.end_date}` : ""}</div>
                                </div>
                                <Badge variant="outline" className={typeColor[e.type] || ""}>{e.type}</Badge>
                              </div>
                              <div className="text-[11px] text-muted-foreground">{subjCount} subjects</div>
                              {g === "in_progress" && (
                                <div><Progress value={prog} className="h-1.5" /><div className="text-[10px] text-muted-foreground mt-1">{prog}% results entered</div></div>
                              )}
                              <div className="flex gap-1 pt-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setGeExam(e.id); setTab("grade"); }}><Edit className="h-3 w-3 mr-1" />Grade</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setResultsExam(e.id); setTab("results"); }}>Results</Button>
                                {g !== "completed" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={async () => { await supabase.from("exams").update({ status: "completed" }).eq("id", e.id); load(); }}><Lock className="h-3 w-3" /></Button>}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GRADE ENTRY */}
        <TabsContent value="grade" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle>Grade entry</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={geExam} onValueChange={setGeExam}>
                  <SelectTrigger className="h-8 w-48"><SelectValue placeholder="Exam" /></SelectTrigger>
                  <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={geClass} onValueChange={setGeClass}>
                  <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={geSubject || "_all"} onValueChange={(v) => setGeSubject(v === "_all" ? "" : v)}>
                  <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent><SelectItem value="_all">All subjects</SelectItem>{geSubjectList.map((s) => <SelectItem key={s.id} value={s.id}>{s.code || s.name}</SelectItem>)}</SelectContent>
                </Select>
                {isCBC && <Badge variant="outline" className="bg-accent-soft text-accent">CBC mode</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {!geExam || !geClass ? (
                <EmptyState icon={<BookOpenCheck className="h-5 w-5" />} title="Pick an exam and class" description="Choose an exam and class above to enter grades." />
              ) : geSubjectList.length === 0 ? (
                <EmptyState icon={<FileText className="h-5 w-5" />} title="No subjects mapped to this exam" description="Add exam subjects (and max marks) before entering grades." />
              ) : students.length === 0 ? (
                <EmptyState icon={<FileText className="h-5 w-5" />} title="No students in this class" description="Enroll students into the class first." />
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-xs border rounded">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-2 text-left sticky left-0 bg-muted">Student</th>
                        {geSubjectList.map((s) => {
                          const es = examSubjects.find((x) => x.exam_id === geExam && x.subject_id === s.id);
                          return <th key={s.id} className="px-2 py-2 text-left whitespace-nowrap">{s.code || s.name} <span className="text-[10px] text-muted-foreground">/{isCBC ? "level" : es?.max_marks || 100}</span></th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st) => (
                        <tr key={st.id} className="border-t">
                          <td className="px-2 py-1 sticky left-0 bg-background">
                            <div className="font-medium">{st.last_name} {st.first_name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{st.admission_number}</div>
                          </td>
                          {geSubjectList.map((s) => {
                            const cell = grid[`${st.id}|${s.id}`];
                            const es = examSubjects.find((x) => x.exam_id === geExam && x.subject_id === s.id);
                            const max = es?.max_marks ? Number(es.max_marks) : 100;
                            const value = isCBC ? (cell?.grade || "") : (cell?.score ?? "");
                            const out = !isCBC && cell?.score != null && Number(cell.score) > max;
                            return (
                              <td key={s.id} className="px-1 py-1">
                                {isCBC ? (
                                  <Select value={value} onValueChange={(v) => saveCell(st.id, s.id, v)}>
                                    <SelectTrigger className="h-7 text-xs w-20"><SelectValue placeholder="—" /></SelectTrigger>
                                    <SelectContent>{CBC_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                  </Select>
                                ) : (
                                  <Input type="number" defaultValue={value as any} className={`h-7 w-20 text-xs ${out ? "border-destructive" : ""}`}
                                    onBlur={(e) => saveCell(st.id, s.id, e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLElement).blur(); }} />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESULTS */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle>Results</CardTitle>
              <Select value={resultsExam} onValueChange={setResultsExam}>
                <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Pick an exam" /></SelectTrigger>
                <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {!resultsExam ? (
                <EmptyState icon={<FileText className="h-5 w-5" />} title="Pick an exam" description="Choose an exam to see per-class summaries and top performers." />
              ) : <ResultsView tenantId={tenantId!} examId={resultsExam} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Performance trends</CardTitle><CardDescription>Mean score per exam over time.</CardDescription></CardHeader>
            <CardContent>
              {exams.length < 2 ? (
                <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="Need more exams" description="Once you have 2+ exams with results, trends and AI insights will appear here." />
              ) : (
                <AnalyticsView tenantId={tenantId!} exams={exams} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <CardTitle>Report card templates</CardTitle>
              <Button size="sm" variant="outline" disabled><Plus className="h-3.5 w-3.5 mr-1" />New template</Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { name: "CBC report card", desc: "Performance levels (BE/AE/ME/EE) per learning area." },
                  { name: "8-4-4 report card", desc: "Subject scores with grade and mean grade." },
                  { name: "A-Level report card", desc: "Principal/subsidiary subjects with cluster points." },
                ].map((t) => (
                  <Card key={t.name}>
                    <CardContent className="p-3 space-y-2">
                      <div className="aspect-[4/3] bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">Preview</div>
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled>Edit</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" disabled>Duplicate</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-4 text-center">Template editor coming in Pro tier.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ============ ResultsView ============
function ResultsView({ tenantId, examId, subjects }: { tenantId: string; examId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  useEffect(() => {
    setLoading(true);
    supabase.from("exam_results").select("*, students:student_id(id,first_name,last_name,admission_number,class_id)").eq("tenant_id", tenantId).eq("exam_id", examId).then(({ data }) => {
      setRows(data || []); setLoading(false);
    });
  }, [tenantId, examId]);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (rows.length === 0) return <EmptyState icon={<FileText className="h-5 w-5" />} title="No results entered" description="Switch to Grade entry to record student scores." />;

  // student means
  const byStudent: Record<string, { name: string; scores: number[] }> = {};
  rows.forEach((r) => {
    const k = r.student_id;
    if (!byStudent[k]) byStudent[k] = { name: `${r.students?.last_name || ""} ${r.students?.first_name || ""}`.trim(), scores: [] };
    if (r.score != null) byStudent[k].scores.push(Number(r.score));
  });
  const ranked = Object.entries(byStudent).map(([id, v]) => ({
    id, name: v.name, mean: v.scores.length ? v.scores.reduce((a, b) => a + b, 0) / v.scores.length : 0,
  })).sort((a, b) => b.mean - a.mean);
  const top = ranked.slice(0, 10);
  const bottom = ranked.slice(-10).reverse();

  // subject means
  const bySubject: Record<string, number[]> = {};
  rows.forEach((r) => { if (r.score != null) (bySubject[r.subject] ||= []).push(Number(r.score)); });

  const publish = async () => {
    setPublishing(true);
    const { error } = await supabase.functions.invoke("generate-report-cards", { body: { tenantId, examId, autoDeliver: false } });
    setPublishing(false);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Report card generation started" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={publish} disabled={publishing}>
          {publishing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />} Publish reports
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Subject performance</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Mean</TableHead><TableHead className="text-right">N</TableHead></TableRow></TableHeader>
              <TableBody>{Object.entries(bySubject).map(([s, scores]) => (
                <TableRow key={s}><TableCell>{s}</TableCell>
                  <TableCell className="text-right">{(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}</TableCell>
                  <TableCell className="text-right">{scores.length}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Top performers</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Student</TableHead><TableHead className="text-right">Mean</TableHead></TableRow></TableHeader>
              <TableBody>{top.map((s, i) => (
                <TableRow key={s.id}><TableCell>{i + 1}</TableCell><TableCell>{s.name}</TableCell><TableCell className="text-right">{s.mean.toFixed(1)}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Needs intervention</CardTitle><CardDescription>Bottom 10 by mean score.</CardDescription></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="text-right">Mean</TableHead></TableRow></TableHeader>
            <TableBody>{bottom.map((s) => (
              <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell className="text-right">{s.mean.toFixed(1)}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ AnalyticsView ============
function AnalyticsView({ tenantId, exams }: { tenantId: string; exams: any[] }) {
  const [series, setSeries] = useState<{ name: string; mean: number }[]>([]);
  useEffect(() => {
    (async () => {
      const out: { name: string; mean: number }[] = [];
      for (const e of exams.slice(0, 12).reverse()) {
        const { data } = await supabase.from("exam_results").select("score").eq("tenant_id", tenantId).eq("exam_id", e.id);
        const scores = (data || []).map((r: any) => Number(r.score)).filter((n) => !isNaN(n));
        if (scores.length) out.push({ name: e.name, mean: scores.reduce((a, b) => a + b, 0) / scores.length });
      }
      setSeries(out);
    })();
  }, [tenantId, exams]);

  if (series.length === 0) return <EmptyState icon={<BarChart3 className="h-5 w-5" />} title="Not enough data" description="Enter results across multiple exams to see trends." />;

  const max = Math.max(...series.map((s) => s.mean), 100);
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-xs">
            <div className="w-40 truncate">{s.name}</div>
            <div className="flex-1 h-3 bg-muted rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(s.mean / max) * 100}%` }} /></div>
            <div className="w-12 text-right tabular-nums">{s.mean.toFixed(1)}</div>
          </div>
        ))}
      </div>
      <Card>
        <CardContent className="p-3 text-xs">
          <div className="flex items-center gap-2 text-sm font-medium mb-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> AI insight</div>
          <p className="text-muted-foreground">
            {series.length >= 2 && series[series.length - 1].mean < series[0].mean
              ? `Mean performance has dropped from ${series[0].mean.toFixed(1)} to ${series[series.length - 1].mean.toFixed(1)} across the last ${series.length} exams. Consider HOD review of pacing and assessment difficulty.`
              : `Performance is stable or improving across the last ${series.length} exams.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
