import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Users, Home, UserCircle2, AlertTriangle } from "lucide-react";

const STAGE_ORDER: Record<string, number> = {
  pre_primary: 1, lower_primary: 2, upper_primary: 3, primary: 2,
  junior_secondary: 4, senior_secondary: 5, secondary: 4, o_level: 4, a_level: 5,
};

export function ClassesTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", grade_level_id: "", stream: "", class_teacher_id: "", room_id: "", capacity: "40" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: c }, { data: g }, { data: t }, { data: r }, { data: students }] = await Promise.all([
      supabase.from("classes").select("*").eq("tenant_id", tenantId),
      supabase.from("grade_levels").select("id,code,name,sort_order,stage").eq("tenant_id", tenantId),
      supabase.from("staff").select("id,first_name,last_name").eq("tenant_id", tenantId).eq("status", "active"),
      supabase.from("rooms").select("id,name,capacity").eq("tenant_id", tenantId),
      supabase.from("students").select("current_class_id").eq("tenant_id", tenantId),
    ]);
    setRows(c || []); setGrades(g || []); setTeachers(t || []); setRooms(r || []);
    const counts: Record<string, number> = {};
    (students || []).forEach((s: any) => { if (s.current_class_id) counts[s.current_class_id] = (counts[s.current_class_id] || 0) + 1; });
    setEnrollments(counts);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const sortedGrades = [...grades].sort((a, b) => {
    const ao = a.sort_order ?? 9999, bo = b.sort_order ?? 9999;
    if (ao !== bo) return ao - bo;
    const as = STAGE_ORDER[a.stage || ""] ?? 99, bs = STAGE_ORDER[b.stage || ""] ?? 99;
    if (as !== bs) return as - bs;
    return (a.code || "").localeCompare(b.code || "");
  });
  const gradeIndex = new Map(sortedGrades.map((g, i) => [g.id, i]));
  const sortedClasses = [...rows].sort((a, b) => {
    const ai = gradeIndex.get(a.grade_level_id) ?? 9999;
    const bi = gradeIndex.get(b.grade_level_id) ?? 9999;
    if (ai !== bi) return ai - bi;
    const sd = (a.stream || "").localeCompare(b.stream || "");
    if (sd !== 0) return sd;
    return (a.name || "").localeCompare(b.name || "");
  });

  const add = async () => {
    if (!tenantId) return toast({ title: "No school selected", description: "Finish school setup first.", variant: "destructive" });
    if (!form.name) return toast({ title: "Missing name", description: "Enter a class name.", variant: "destructive" });
    if (rows.some((r) => r.name.toLowerCase() === form.name.toLowerCase()))
      return toast({ title: "Duplicate name", description: `Class "${form.name}" already exists.`, variant: "destructive" });
    const cap = parseInt(form.capacity) || 0;
    if (cap <= 0) return toast({ title: "Invalid capacity", description: "Capacity must be greater than 0.", variant: "destructive" });
    const { error } = await supabase.from("classes").insert({
      tenant_id: tenantId, name: form.name,
      grade_level_id: form.grade_level_id || null,
      stream: form.stream || null,
      class_teacher_id: form.class_teacher_id || null,
      room_id: form.room_id || null,
      capacity: cap,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Class created", description: form.name });
    setForm({ name: "", grade_level_id: "", stream: "", class_teacher_id: "", room_id: "", capacity: "40" });
    load();
  };
  const remove = async (id: string) => {
    if ((enrollments[id] || 0) > 0)
      return toast({ title: "Cannot delete", description: `${enrollments[id]} students are enrolled.`, variant: "destructive" });
    if (!confirm("Delete class?")) return;
    await supabase.from("classes").delete().eq("id", id);
    toast({ title: "Class deleted" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const groupedByGrade = sortedGrades.map((g) => ({
    grade: g,
    classes: sortedClasses.filter((c) => c.grade_level_id === g.id),
  })).filter((x) => x.classes.length > 0);
  const ungrouped = sortedClasses.filter((c) => !c.grade_level_id);

  return (
    <TooltipProvider delayDuration={200}>
    <Card>
      <CardHeader><CardTitle>Classes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-6">
          <Input placeholder="Name (e.g. Grade 7 Blue)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
          <select className="border rounded px-2 py-1 text-sm bg-background" value={form.grade_level_id} onChange={(e) => setForm({ ...form, grade_level_id: e.target.value })}>
            <option value="">Grade…</option>
            {sortedGrades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <Input placeholder="Stream" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} />
          <select className="border rounded px-2 py-1 text-sm bg-background" value={form.class_teacher_id} onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}>
            <option value="">Teacher…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
          </select>
          <select className="border rounded px-2 py-1 text-sm bg-background" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
            <option value="">Room…</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-32" />
          <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add class</Button>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-10 border rounded-lg border-dashed">
            <p className="text-sm text-muted-foreground">No classes yet. Add your first class above.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByGrade.map(({ grade, classes }) => (
              <div key={grade.id} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{grade.name}</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {classes.map((c) => <ClassCard key={c.id} c={c} grade={grade} teachers={teachers} rooms={rooms} enrolled={enrollments[c.id] || 0} onRemove={() => remove(c.id)} />)}
                </div>
              </div>
            ))}
            {ungrouped.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unassigned grade</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {ungrouped.map((c) => <ClassCard key={c.id} c={c} grade={null} teachers={teachers} rooms={rooms} enrolled={enrollments[c.id] || 0} onRemove={() => remove(c.id)} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}

function ClassCard({ c, grade, teachers, rooms, enrolled, onRemove }: any) {
  const teacher = teachers.find((x: any) => x.id === c.class_teacher_id);
  const room = rooms.find((x: any) => x.id === c.room_id);
  const capacity = c.capacity || 0;
  const pct = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
  const over90 = capacity > 0 && enrolled / capacity > 0.9;
  const noTeacher = !teacher;
  return (
    <div className="rounded-lg border p-4 bg-card hover:shadow-sm transition-shadow space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="font-semibold text-base truncate">{c.name}</div>
          <div className="flex items-center gap-1.5 text-xs">
            {grade && <Badge variant="outline">{grade.code}</Badge>}
            {c.stream && <span className="text-muted-foreground">· {c.stream}</span>}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
          </TooltipTrigger>
          <TooltipContent>Delete class</TooltipContent>
        </Tooltip>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1 text-muted-foreground"><UserCircle2 className="h-3 w-3" />Teacher</div>
          <div className={`truncate ${teacher ? "" : "text-muted-foreground italic"}`}>
            {teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unassigned"}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" />Enrol</div>
          <div>{enrolled} / {capacity || "–"}</div>
          {capacity > 0 && <div className="h-1 bg-muted rounded overflow-hidden"><div className={`h-full ${over90 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} /></div>}
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1 text-muted-foreground"><Home className="h-3 w-3" />Room</div>
          <div className={`truncate ${room ? "" : "text-muted-foreground italic"}`}>
            {room ? `${room.name}${room.capacity ? ` (${room.capacity})` : ""}` : "Not assigned"}
          </div>
        </div>
      </div>
      {(over90 || noTeacher) && (
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          {over90 && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50"><AlertTriangle className="h-3 w-3 mr-1" />Near capacity</Badge>}
          {noTeacher && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50"><AlertTriangle className="h-3 w-3 mr-1" />No class teacher</Badge>}
        </div>
      )}
    </div>
  );
}