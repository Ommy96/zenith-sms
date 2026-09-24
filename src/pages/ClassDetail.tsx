import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant, can } = useTenant();
  const [data, setData] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject_id: "", teacher_id: "none", lessons: "5" });
  const load = async () => {
    if (!tenant?.id || !id) return;
    setLoading(true);
    const [c, s, t, a, e] = await Promise.all([
      supabase.from("classes").select("*, grade_levels(name,code), academic_years(name), rooms(name), staff!classes_class_teacher_fkey(first_name,last_name)").eq("tenant_id", tenant.id).eq("id", id).maybeSingle(),
      supabase.from("subjects").select("id,name,code").eq("tenant_id", tenant.id).eq("is_active", true).order("name"),
      supabase.from("staff").select("id,first_name,last_name").eq("tenant_id", tenant.id).eq("status", "active").eq("role", "teacher").order("first_name"),
      supabase.from("class_subjects").select("id,lessons_per_week,teacher_id,subjects(id,name,code),staff(first_name,last_name)").eq("tenant_id", tenant.id).eq("class_id", id).eq("is_active", true),
      supabase.from("student_enrollments").select("id,students(id,first_name,last_name,admission_number)").eq("tenant_id", tenant.id).eq("class_id", id).eq("status", "active"),
    ]);
    if (c.error || !c.data) toast({ title: "Class not found", variant: "destructive" });
    setData(c.data); setSubjects(s.data ?? []); setTeachers(t.data ?? []); setAssignments(a.data ?? []); setStudents(e.data ?? []); setLoading(false);
  };
  useEffect(() => { void load(); }, [tenant?.id, id]);
  const assignedIds = useMemo(() => new Set(assignments.map((row) => row.subjects?.id)), [assignments]);
  const assign = async () => {
    if (!tenant?.id || !id || !form.subject_id) return;
    const lessons = Number(form.lessons);
    if (!Number.isInteger(lessons) || lessons < 1 || lessons > 20) return toast({ title: "Lessons must be between 1 and 20", variant: "destructive" });
    const { error } = await supabase.from("class_subjects").insert({ tenant_id: tenant.id, class_id: id, subject_id: form.subject_id, teacher_id: form.teacher_id === "none" ? null : form.teacher_id, lessons_per_week: lessons });
    if (error) return toast({ title: "Could not assign subject", description: error.message, variant: "destructive" });
    toast({ title: "Subject assigned" }); setForm({ subject_id: "", teacher_id: "none", lessons: "5" }); void load();
  };
  const remove = async (assignmentId: string) => { await supabase.from("class_subjects").delete().eq("tenant_id", tenant?.id).eq("id", assignmentId); void load(); };
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return <Button variant="ghost" onClick={() => navigate("/academics/classes")}>Back to classes</Button>;
  return <div className="space-y-6">
    <Button variant="ghost" size="sm" onClick={() => navigate("/academics/classes")}><ArrowLeft className="h-4 w-4 mr-2" />Back to classes</Button>
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{data.name}</h1><Badge variant={data.is_active ? "secondary" : "outline"}>{data.is_active ? "Active" : "Inactive"}</Badge></div><p className="text-sm text-muted-foreground mt-1">{data.grade_levels?.name ?? "No grade"} · {data.academic_years?.name ?? "No academic year"} · Capacity {data.capacity}</p></div>
    <Tabs defaultValue="students"><TabsList><TabsTrigger value="students">Students</TabsTrigger><TabsTrigger value="subjects">Subjects</TabsTrigger><TabsTrigger value="timetable">Timetable</TabsTrigger></TabsList>
      <TabsContent value="students"><Card><CardHeader><CardTitle>Enrolled students ({students.length})</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Admission</TableHead><TableHead>Name</TableHead></TableRow></TableHeader><TableBody>{students.map((row) => <TableRow key={row.id}><TableCell>{row.students?.admission_number}</TableCell><TableCell>{row.students?.first_name} {row.students?.last_name}</TableCell></TableRow>)}{!students.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No active enrollments.</TableCell></TableRow>}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="subjects"><Card><CardHeader><CardTitle>Subject assignments</CardTitle></CardHeader><CardContent className="space-y-4">{can("classes.manage") && <div className="grid gap-2 md:grid-cols-[1fr_1fr_120px_auto]"><Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}><SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger><SelectContent>{subjects.filter((s) => !assignedIds.has(s.id)).map((s) => <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>)}</SelectContent></Select><Select value={form.teacher_id} onValueChange={(v) => setForm({ ...form, teacher_id: v })}><SelectTrigger><SelectValue placeholder="Teacher" /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent></Select><Input type="number" min={1} max={20} value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} aria-label="Lessons per week" /><Button onClick={assign}><Plus className="h-4 w-4 mr-2" />Assign</Button></div>}<Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Teacher</TableHead><TableHead>Lessons/week</TableHead><TableHead /></TableRow></TableHeader><TableBody>{assignments.map((a) => <TableRow key={a.id}><TableCell>{a.subjects?.code} — {a.subjects?.name}</TableCell><TableCell>{a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : "Unassigned"}</TableCell><TableCell>{a.lessons_per_week}</TableCell><TableCell className="text-right">{can("classes.manage") && <Button variant="ghost" size="icon" onClick={() => remove(a.id)} aria-label="Remove assignment"><Trash2 className="h-4 w-4" /></Button>}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="timetable"><Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Timetable setup is available in the Timetable module.</CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}