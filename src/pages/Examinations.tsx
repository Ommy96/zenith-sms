import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, Calendar, TrendingUp, Award, Plus, Edit, Trash2,
  MoreHorizontal, Loader2, Eye, FileText, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Exam = Tables<"exams">;
type ExamResult = Tables<"exam_results">;

const statusColors: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  "in progress": "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const emptyExamForm = {
  name: "", type: "mid-term", term: "", academic_year: "",
  start_date: "", end_date: "", status: "upcoming",
};

export default function Examinations() {
  const { profile } = useAuth();
  const schoolId = profile?.tenant_id;

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState(emptyExamForm);
  const [saving, setSaving] = useState(false);

  // Results dialog
  const [resultsExam, setResultsExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<(ExamResult & { student?: { first_name: string; last_name: string } })[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [students, setStudents] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [resultForm, setResultForm] = useState({ student_id: "", subject: "", score: "", grade: "", remarks: "" });
  const [savingResult, setSavingResult] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  // AI Comment generation
  type CommentTarget = {
    result: ExamResult & { student?: { first_name: string; last_name: string } };
  };
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null);
  const [commentForm, setCommentForm] = useState({
    strengths: "", improvements: "", style: "Encouraging", length: "Medium",
  });
  const [generatedComment, setGeneratedComment] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [aiUsage, setAiUsage] = useState<{ used: number; limit: number }>({ used: 0, limit: 50 });

  // Stats
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, avgScore: 0, totalResults: 0 });

  const fetchExams = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("exams").select("*").eq("tenant_id", schoolId).order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading exams", description: error.message, variant: "destructive" });
    else setExams(data || []);
    setLoading(false);
  }, [schoolId]);

  const fetchStats = useCallback(async () => {
    if (!schoolId) return;
    const [examsRes, resultsRes] = await Promise.all([
      supabase.from("exams").select("status").eq("tenant_id", schoolId),
      supabase.from("exam_results").select("score").eq("tenant_id", schoolId),
    ]);
    const ex = examsRes.data || [];
    const res = resultsRes.data || [];
    const scores = res.filter((r) => r.score != null).map((r) => Number(r.score));
    setStats({
      upcoming: ex.filter((e) => e.status === "upcoming").length,
      completed: ex.filter((e) => e.status === "completed").length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0,
      totalResults: res.length,
    });
  }, [schoolId]);

  useEffect(() => { fetchExams(); fetchStats(); }, [fetchExams, fetchStats]);

  // Fetch AI usage for current user/month
  const fetchAiUsage = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase.rpc("ai_check_quota", { _tenant: schoolId });
    const q: any = data || {};
    setAiUsage({ used: q.request_count ?? 0, limit: q.request_limit ?? 50 });
  }, [schoolId]);
  useEffect(() => { fetchAiUsage(); }, [fetchAiUsage]);

  useEffect(() => {
    if (!schoolId) return;
    supabase.from("students").select("id, first_name, last_name").eq("tenant_id", schoolId).eq("status", "active").order("first_name")
      .then(({ data }) => setStudents(data || []));
  }, [schoolId]);

  // Exam CRUD
  const openAddExam = () => { setEditing(null); setForm(emptyExamForm); setDialogOpen(true); };
  const openEditExam = (e: Exam) => {
    setEditing(e);
    setForm({
      name: e.name, type: e.type || "mid-term", term: e.term || "",
      academic_year: e.academic_year || "", start_date: e.start_date || "",
      end_date: e.end_date || "", status: e.status || "upcoming",
    });
    setDialogOpen(true);
  };

  const handleSaveExam = async () => {
    if (!schoolId || !form.name.trim()) { toast({ title: "Exam name is required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(), type: form.type, term: form.term.trim() || null,
      academic_year: form.academic_year.trim() || null, start_date: form.start_date || null,
      end_date: form.end_date || null, status: form.status, tenant_id: schoolId,
    };
    if (editing) {
      const { error } = await supabase.from("exams").update(payload).eq("id", editing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Exam updated" });
    } else {
      const { error } = await supabase.from("exams").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Exam created" });
    }
    setSaving(false); setDialogOpen(false); fetchExams(); fetchStats();
  };

  const handleDeleteExam = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("exams").delete().eq("id", deleteTarget.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Exam deleted" });
    setDeleting(false); setDeleteTarget(null); fetchExams(); fetchStats();
  };

  // Results
  const openResults = async (exam: Exam) => {
    setResultsExam(exam);
    setLoadingResults(true);
    setResultForm({ student_id: "", subject: "", score: "", grade: "", remarks: "" });
    const { data } = await supabase
      .from("exam_results")
      .select("*, student:students(first_name, last_name)")
      .eq("exam_id", exam.id)
      .order("created_at", { ascending: false });
    setResults((data as any) || []);
    setLoadingResults(false);
  };

  const openCommentPanel = (
    result: ExamResult & { student?: { first_name: string; last_name: string } },
  ) => {
    setCommentTarget({ result });
    setCommentForm({ strengths: "", improvements: "", style: "Encouraging", length: "Medium" });
    setGeneratedComment(result.remarks || "");
    fetchAiUsage();
  };

  const handleGenerateComment = async () => {
    if (!commentTarget) return;
    const r = commentTarget.result;
    const studentName = r.student ? `${r.student.first_name} ${r.student.last_name}` : "Student";
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-report-comment", {
      body: {
        studentName, subject: r.subject, grade: r.grade, score: r.score,
        strengths: commentForm.strengths, improvements: commentForm.improvements,
        style: commentForm.style, length: commentForm.length,
      },
    });
    setGenerating(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Generation failed",
        description: (data as any)?.error || error?.message || "Try again",
        variant: "destructive",
      });
      return;
    }
    setGeneratedComment((data as any).comment || "");
    setAiUsage({ used: (data as any).used, limit: (data as any).limit });
  };

  const handleSaveComment = async () => {
    if (!commentTarget) return;
    setSavingComment(true);
    const { error } = await supabase
      .from("exam_results")
      .update({ remarks: generatedComment })
      .eq("id", commentTarget.result.id);
    setSavingComment(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Comment saved to report card" });
    if (resultsExam) openResults(resultsExam);
    setCommentTarget(null);
  };

  const handleAddResult = async () => {
    if (!schoolId || !resultsExam || !resultForm.student_id || !resultForm.subject.trim()) {
      toast({ title: "Student and subject are required", variant: "destructive" }); return;
    }
    setSavingResult(true);
    const { error } = await supabase.from("exam_results").insert({
      exam_id: resultsExam.id, student_id: resultForm.student_id,
      subject: resultForm.subject.trim(), score: resultForm.score ? parseFloat(resultForm.score) : null,
      grade: resultForm.grade.trim() || null, remarks: resultForm.remarks.trim() || null,
      tenant_id: schoolId,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Result added" }); setResultForm({ student_id: "", subject: "", score: "", grade: "", remarks: "" }); openResults(resultsExam); fetchStats(); }
    setSavingResult(false);
  };

  const summaryCards = [
    { label: "Upcoming", value: String(stats.upcoming), icon: Calendar },
    { label: "Completed", value: String(stats.completed), icon: ClipboardList },
    { label: "Avg Score", value: stats.avgScore > 0 ? `${stats.avgScore}%` : "—", icon: TrendingUp },
    { label: "Results Entered", value: String(stats.totalResults), icon: Award },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examinations & Results</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage exams, grading, and performance analytics</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={openAddExam}><Plus className="h-3.5 w-3.5" /> Schedule Exam</Button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><s.icon className="h-4 w-4 text-primary" /></div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Exams Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-card-foreground">Exam Schedule</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Exam</TableHead>
              <TableHead className="text-xs font-semibold">Dates</TableHead>
              <TableHead className="text-xs font-semibold">Term</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : exams.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No exams scheduled</p>
                </div>
              </TableCell></TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <p className="text-sm font-medium">{exam.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{exam.type || "exam"}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {exam.start_date || "—"}{exam.end_date ? ` → ${exam.end_date}` : ""}
                  </TableCell>
                  <TableCell className="text-sm">{exam.term || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] capitalize ${statusColors[exam.status || "upcoming"] || ""}`}>{exam.status || "upcoming"}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-sm gap-2" onClick={() => openResults(exam)}><FileText className="h-3.5 w-3.5" /> Results</DropdownMenuItem>
                        <DropdownMenuItem className="text-sm gap-2" onClick={() => openEditExam(exam)}><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={() => setDeleteTarget(exam)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Exam Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Exam" : "Schedule Exam"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Exam Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mid-Term Examination" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mid-term">Mid-Term</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="unit-test">Unit Test</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Term</Label><Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="e.g. Term 1" /></div>
              <div className="space-y-2"><Label>Academic Year</Label><Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="e.g. 2026" /></div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveExam} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={!!resultsExam} onOpenChange={(open) => !open && setResultsExam(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Results — {resultsExam?.name}</DialogTitle></DialogHeader>

          {/* Add result form */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Add Result</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Select value={resultForm.student_id} onValueChange={(v) => setResultForm({ ...resultForm, student_id: v })}>
                <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Student" /></SelectTrigger>
                <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
              </Select>
              <Input className="h-9 text-sm" value={resultForm.subject} onChange={(e) => setResultForm({ ...resultForm, subject: e.target.value })} placeholder="Subject" />
              <Input className="h-9 text-sm" type="number" value={resultForm.score} onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })} placeholder="Score" min="0" max="100" />
              <Input className="h-9 text-sm" value={resultForm.grade} onChange={(e) => setResultForm({ ...resultForm, grade: e.target.value })} placeholder="Grade (A, B...)" />
            </div>
            <Button size="sm" onClick={handleAddResult} disabled={savingResult} className="text-xs">
              {savingResult && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Add Result
            </Button>
          </div>

          {/* Results list */}
          {loadingResults ? (
            <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No results entered yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Student</TableHead>
                  <TableHead className="text-xs font-semibold">Subject</TableHead>
                  <TableHead className="text-xs font-semibold">Score</TableHead>
                  <TableHead className="text-xs font-semibold">Grade</TableHead>
                  <TableHead className="text-xs font-semibold w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.student ? `${r.student.first_name} ${r.student.last_name}` : "—"}</TableCell>
                    <TableCell className="text-sm">{r.subject}</TableCell>
                    <TableCell className="text-sm font-medium">{r.score != null ? r.score : "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[11px]">{r.grade || "—"}</Badge></TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 gap-1 text-[11px] text-primary hover:text-primary"
                        onClick={() => openCommentPanel(r)}
                      >
                        <Sparkles className="h-3 w-3" /> Generate comment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Comment Side Panel */}
      <Sheet open={!!commentTarget} onOpenChange={(open) => !open && setCommentTarget(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {commentTarget && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Generate report comment
                </SheetTitle>
                <SheetDescription>
                  {commentTarget.result.student
                    ? `${commentTarget.result.student.first_name} ${commentTarget.result.student.last_name}`
                    : "Student"}
                  {" · "}{commentTarget.result.subject}
                  {commentTarget.result.grade ? ` · Grade ${commentTarget.result.grade}` : ""}
                  {commentTarget.result.score != null ? ` · ${commentTarget.result.score}%` : ""}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {aiUsage.used} / {aiUsage.limit} AI generations used this month
              </div>

              <div className="space-y-4 mt-5">
                <div className="space-y-2">
                  <Label>What's going well?</Label>
                  <Input
                    placeholder="e.g. strong problem-solving"
                    value={commentForm.strengths}
                    onChange={(e) => setCommentForm({ ...commentForm, strengths: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>What needs work?</Label>
                  <Input
                    placeholder="e.g. show full working"
                    value={commentForm.improvements}
                    onChange={(e) => setCommentForm({ ...commentForm, improvements: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>House style</Label>
                    <Select value={commentForm.style} onValueChange={(v) => setCommentForm({ ...commentForm, style: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Encouraging">Encouraging</SelectItem>
                        <SelectItem value="Formal">Formal</SelectItem>
                        <SelectItem value="Direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Length</Label>
                    <Select value={commentForm.length} onValueChange={(v) => setCommentForm({ ...commentForm, length: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Short">Short (1 sentence)</SelectItem>
                        <SelectItem value="Medium">Medium (2–3 sentences)</SelectItem>
                        <SelectItem value="Long">Long (paragraph)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerateComment}
                  disabled={generating || aiUsage.used >= aiUsage.limit}
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? "Generating…" : "Generate"}
                </Button>

                <div className="space-y-2">
                  <Label>Generated comment</Label>
                  <Textarea
                    value={generatedComment}
                    onChange={(e) => setGeneratedComment(e.target.value)}
                    placeholder="Generated comment will appear here. You can edit before saving."
                    rows={7}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setCommentTarget(null)}>Cancel</Button>
                  <Button
                    onClick={handleSaveComment}
                    disabled={savingComment || !generatedComment.trim()}
                  >
                    {savingComment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Insert into report card
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {deleteTarget?.name}? All results for this exam will also be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExam} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
