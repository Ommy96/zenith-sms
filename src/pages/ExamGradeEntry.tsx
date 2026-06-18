import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Unlock, Save, Calculator, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Subject = { id: string; code: string; name: string; max_marks: number };
type Student = { id: string; first_name: string; last_name: string; admission_number: string | null };
type Result = { exam_id: string; student_id: string; subject_id: string; raw_marks: number | null; max_marks: number | null; locked: boolean };

export default function ExamGradeEntry() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { can } = useTenant();
  const tenantId = profile?.tenant_id;

  const [exam, setExam] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grid, setGrid] = useState<Record<string, Record<string, { v: string; locked: boolean; dirty?: boolean; saving?: boolean; error?: boolean }>>>({});
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    if (!examId || !tenantId) return;
    setLoading(true);
    const { data: e } = await supabase.from("exams").select("*").eq("id", examId).maybeSingle();
    setExam(e);
    const [{ data: es }, { data: ss }, { data: rs }] = await Promise.all([
      supabase.from("exam_subjects").select("subject_id, max_marks, subjects:subject_id(id, code, name)").eq("exam_id", examId),
      supabase.from("students").select("id, first_name, last_name, admission_number").eq("tenant_id", tenantId).eq("status", "active").order("last_name"),
      supabase.from("student_exam_results").select("*").eq("exam_id", examId),
    ]);
    const subs: Subject[] = ((es as any[]) || []).map((r) => ({ id: r.subjects.id, code: r.subjects.code, name: r.subjects.name, max_marks: Number(r.max_marks) }));
    setSubjects(subs);
    setStudents(ss || []);
    const g: typeof grid = {};
    (ss || []).forEach((st) => {
      g[st.id] = {};
      subs.forEach((sub) => {
        const r = (rs as Result[] | null)?.find((x) => x.student_id === st.id && x.subject_id === sub.id);
        g[st.id][sub.id] = { v: r?.raw_marks?.toString() ?? "", locked: r?.locked || false };
      });
    });
    setGrid(g);
    setLoading(false);
  }, [examId, tenantId]);
  useEffect(() => { load(); }, [load]);

  const saveCell = async (studentId: string, subjectId: string) => {
    const cell = grid[studentId]?.[subjectId];
    if (!cell || cell.locked) return;
    const sub = subjects.find((s) => s.id === subjectId)!;
    const v = cell.v.trim();
    const raw = v === "" ? null : Number(v);
    if (raw !== null && (isNaN(raw) || raw < 0 || raw > sub.max_marks)) {
      setGrid((g) => ({ ...g, [studentId]: { ...g[studentId], [subjectId]: { ...cell, error: true, saving: false } } }));
      return;
    }
    setGrid((g) => ({ ...g, [studentId]: { ...g[studentId], [subjectId]: { ...cell, saving: true, error: false } } }));
    const { error } = await supabase.from("student_exam_results").upsert({
      tenant_id: tenantId!, exam_id: examId!, student_id: studentId, subject_id: subjectId,
      raw_marks: raw, max_marks: sub.max_marks, entered_by: user?.id, entered_at: new Date().toISOString(),
    }, { onConflict: "exam_id,student_id,subject_id" });
    setGrid((g) => ({ ...g, [studentId]: { ...g[studentId], [subjectId]: { ...cell, saving: false, dirty: false, error: !!error } } }));
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
  };

  const setCell = (studentId: string, subjectId: string, v: string) => {
    setGrid((g) => ({ ...g, [studentId]: { ...g[studentId], [subjectId]: { ...g[studentId][subjectId], v, dirty: true } } }));
    const key = `${studentId}:${subjectId}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => saveCell(studentId, subjectId), 400);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, sIdx: number, subIdx: number) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) return;
    e.preventDefault();
    const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
    lines.forEach((line, li) => {
      const cells = line.split("\t");
      cells.forEach((cell, ci) => {
        const st = students[sIdx + li]; const sub = subjects[subIdx + ci];
        if (st && sub) setCell(st.id, sub.id, cell.trim());
      });
    });
  };

  const toggleLock = async () => {
    if (!can("exams.lock")) return toast({ title: "No permission", variant: "destructive" });
    if (!examId) return;
    const newStatus = exam.status === "published" ? "marking" : "published";
    const locked = newStatus === "published";
    await supabase.from("exams").update({ status: newStatus }).eq("id", examId);
    await supabase.from("student_exam_results").update({ locked }).eq("exam_id", examId);
    toast({ title: locked ? "Exam locked & published" : "Exam unlocked" });
    load();
  };

  const recompute = async () => {
    const { error } = await supabase.rpc("recompute_exam_positions" as any, { _exam: examId });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Positions recomputed" });
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/examinations")}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{exam?.name}</h1>
          <p className="text-xs text-muted-foreground">Grade entry • {students.length} students × {subjects.length} subjects</p>
        </div>
        <Badge variant={exam?.status === "published" ? "default" : "secondary"}>{exam?.status}</Badge>
        <Button size="sm" variant="outline" onClick={recompute}><Calculator className="h-4 w-4 mr-1" />Recompute positions</Button>
        <Button size="sm" onClick={toggleLock}>
          {exam?.status === "published" ? <><Unlock className="h-4 w-4 mr-1" />Unlock</> : <><Lock className="h-4 w-4 mr-1" />Lock & publish</>}
        </Button>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded border bg-muted/30 p-6 text-sm text-muted-foreground">No subjects have been added to this exam yet.</div>
      ) : (
        <div className="overflow-auto rounded border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left sticky left-0 bg-muted z-20">Student</th>
                {subjects.map((s) => (
                  <th key={s.id} className="px-2 py-2 text-center border-l min-w-[90px]">
                    <div>{s.code}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">/{s.max_marks}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((st, sIdx) => (
                <tr key={st.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-1.5 sticky left-0 bg-card whitespace-nowrap">
                    <div className="font-medium">{st.last_name}, {st.first_name}</div>
                    <div className="text-xs text-muted-foreground">{st.admission_number}</div>
                  </td>
                  {subjects.map((sub, subIdx) => {
                    const cell = grid[st.id]?.[sub.id] ?? { v: "", locked: false };
                    return (
                      <td key={sub.id} className="border-l p-0.5 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={cell.locked}
                          value={cell.v}
                          onChange={(e) => setCell(st.id, sub.id, e.target.value)}
                          onBlur={() => saveCell(st.id, sub.id)}
                          onPaste={(e) => handlePaste(e, sIdx, subIdx)}
                          className={`w-full px-1 py-1 text-center bg-transparent rounded outline-none focus:ring-2 focus:ring-primary ${
                            cell.error ? "ring-2 ring-destructive" : ""
                          } ${cell.saving ? "opacity-60" : ""} ${cell.locked ? "bg-muted/40" : ""}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground"><Save className="h-3 w-3 inline mr-1" />Auto-saved on blur. Paste from Excel supported.</p>
    </div>
  );
}