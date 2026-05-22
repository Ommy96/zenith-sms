import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  UserCheck, UserX, Clock, Users, Loader2, Check, X, Minus,
  CalendarDays, Bell, BedDouble, AlertTriangle, Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type ClassOption = { id: string; name: string };
type StudentRow = { id: string; first_name: string; last_name: string; admission_number: string | null };
type Period = { id: string; name: string; start_time: string; end_time: string };
type AttendanceStatus =
  | "present" | "absent" | "late" | "excused" | "on_leave" | "suspended" | "sick";

const STATUS_BUTTONS: { key: AttendanceStatus; label: string; icon: any; color: string }[] = [
  { key: "present", label: "Present", icon: Check, color: "bg-success/10 text-success border-success/20" },
  { key: "absent", label: "Absent", icon: X, color: "bg-destructive/10 text-destructive border-destructive/20" },
  { key: "late", label: "Late", icon: Clock, color: "bg-warning/10 text-warning border-warning/20" },
  { key: "excused", label: "Excused", icon: Minus, color: "bg-muted text-muted-foreground border-border" },
  { key: "sick", label: "Sick", icon: AlertTriangle, color: "bg-info/10 text-info border-info/20" },
  { key: "on_leave", label: "On leave", icon: Plane, color: "bg-accent/30 text-accent-foreground border-accent" },
  { key: "suspended", label: "Suspended", icon: BedDouble, color: "bg-destructive/20 text-destructive border-destructive/30" },
];

const statusConfig = Object.fromEntries(STATUS_BUTTONS.map((s) => [s.key, s])) as Record<AttendanceStatus, typeof STATUS_BUTTONS[number]>;

export default function AttendanceRegister() {
  const { profile, user } = useAuth();
  const schoolId = profile?.tenant_id;

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("__daily__");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; arrival_time?: string | null }>>({});
  const [existingIds, setExistingIds] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    supabase.from("classes").select("id, name").eq("tenant_id", schoolId).order("name")
      .then(({ data }) => {
        setClasses(data || []);
        if (data && data.length > 0 && !selectedClass) setSelectedClass(data[0].id);
      });
    supabase.from("periods").select("id, name, start_time, end_time")
      .eq("tenant_id", schoolId).eq("is_break", false).order("sort_order")
      .then(({ data }) => setPeriods(data || []));
  }, [schoolId]);

  const fetchData = useCallback(async () => {
    if (!schoolId || !selectedClass) return;
    setLoading(true);

    const { data: studentData } = await supabase
      .from("students").select("id, first_name, last_name, admission_number")
      .eq("tenant_id", schoolId).eq("current_class_id", selectedClass)
      .eq("status", "active").order("first_name");

    setStudents(studentData || []);

    let q = supabase.from("attendance")
      .select("id, student_id, status, arrival_time, period_id")
      .eq("tenant_id", schoolId).eq("class_id", selectedClass).eq("date", date);
    q = selectedPeriod === "__daily__" ? q.is("period_id", null) : q.eq("period_id", selectedPeriod);
    const { data: attData } = await q;

    const recs: Record<string, { status: AttendanceStatus; arrival_time?: string | null }> = {};
    const ids: Record<string, string> = {};
    (attData || []).forEach((a: any) => {
      recs[a.student_id] = { status: a.status, arrival_time: a.arrival_time };
      ids[a.student_id] = a.id;
    });
    setRecords(recs);
    setExistingIds(ids);
    setSelected(new Set());
    setLoading(false);
  }, [schoolId, selectedClass, date, selectedPeriod]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => {
    const vals = Object.values(records);
    return {
      total: students.length,
      present: vals.filter((v) => v.status === "present").length,
      absent: vals.filter((v) => v.status === "absent").length,
      late: vals.filter((v) => v.status === "late").length,
      other: vals.filter((v) => !["present","absent","late"].includes(v.status)).length,
    };
  }, [records, students]);

  const setStatus = (studentId: string, status: AttendanceStatus) =>
    setRecords((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), status } }));

  const setArrival = (studentId: string, time: string) =>
    setRecords((prev) => ({ ...prev, [studentId]: { status: prev[studentId]?.status || "late", arrival_time: time } }));

  const markAll = (status: AttendanceStatus) => {
    const all: typeof records = {};
    students.forEach((s) => { all[s.id] = { status }; });
    setRecords(all);
  };

  const markSelected = (status: AttendanceStatus) => {
    if (selected.size === 0) return toast({ title: "Select students first" });
    setRecords((prev) => {
      const next = { ...prev };
      selected.forEach((id) => { next[id] = { ...(next[id] || {}), status }; });
      return next;
    });
  };

  const toggleSelect = (id: string, on: boolean) =>
    setSelected((prev) => { const n = new Set(prev); if (on) n.add(id); else n.delete(id); return n; });

  const toggleSelectAll = (on: boolean) =>
    setSelected(on ? new Set(students.map((s) => s.id)) : new Set());

  const handleSave = async () => {
    if (!schoolId || !user) return;
    setSaving(true);

    const period_id = selectedPeriod === "__daily__" ? null : selectedPeriod;

    const toUpsert = students
      .filter((s) => records[s.id]?.status)
      .map((s) => ({
        ...(existingIds[s.id] ? { id: existingIds[s.id] } : {}),
        student_id: s.id, class_id: selectedClass, tenant_id: schoolId,
        date, status: records[s.id].status,
        arrival_time: records[s.id].arrival_time || null,
        period_id, recorded_by: user.id, source: "manual",
        marked_at: new Date().toISOString(),
      }));

    if (toUpsert.length === 0) {
      toast({ title: "Mark at least one student", variant: "destructive" });
      setSaving(false); return;
    }

    // Record session
    await supabase.from("attendance_sessions").upsert({
      tenant_id: schoolId, class_id: selectedClass, date, period_id,
      marked_by: user.id, marked_at: new Date().toISOString(),
    } as any, { onConflict: "tenant_id,class_id,date,period_id" });

    const { error } = await supabase.from("attendance").upsert(toUpsert as any, { onConflict: "id" });
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      const absentCount = toUpsert.filter((r) => r.status === "absent").length;
      toast({
        title: "Attendance saved",
        description: absentCount > 0
          ? `${absentCount} absent — guardians notified by SMS/WhatsApp`
          : `${toUpsert.length} students marked`,
      });
      // Trigger immediate dispatch
      if (absentCount > 0) supabase.functions.invoke("dispatch-messages", { body: { limit: 100 } }).catch(() => {});
      fetchData();
    }
    setSaving(false);
  };

  const initials = (s: StudentRow) => `${s.first_name[0] || ""}${s.last_name[0] || ""}`.toUpperCase();
  const allSelected = students.length > 0 && selected.size === students.length;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Period</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__daily__">Daily (no period)</SelectItem>
              {periods.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Input type="date" className="w-[150px] h-9 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          <Button variant="outline" size="sm" onClick={() => markAll("present")}>
            <Check className="h-3.5 w-3.5 mr-1" /> All present
          </Button>
          {selected.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => markSelected("absent")}>Mark {selected.size} absent</Button>
              <Button variant="outline" size="sm" onClick={() => markSelected("late")}>Mark {selected.size} late</Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />} Save register
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Roster", value: stats.total, icon: Users, color: "bg-primary/10 text-primary" },
          { label: "Present", value: stats.present, icon: UserCheck, color: "bg-success/10 text-success" },
          { label: "Absent", value: stats.absent, icon: UserX, color: "bg-destructive/10 text-destructive" },
          { label: "Late", value: stats.late, icon: Clock, color: "bg-warning/10 text-warning" },
          { label: "Other", value: stats.other, icon: Bell, color: "bg-muted text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
            <div className={`h-7 w-7 rounded-md ${s.color} flex items-center justify-center mb-1.5`}>
              <s.icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-bold text-card-foreground leading-tight">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Register */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={(v) => toggleSelectAll(!!v)} />
              </TableHead>
              <TableHead className="text-xs font-semibold">Student</TableHead>
              {STATUS_BUTTONS.map((s) => (
                <TableHead key={s.key} className="text-xs font-semibold text-center hidden md:table-cell">{s.label}</TableHead>
              ))}
              <TableHead className="text-xs font-semibold md:hidden">Status</TableHead>
              <TableHead className="text-xs font-semibold w-[110px]">Arrival</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={STATUS_BUTTONS.length + 3} className="text-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </TableCell></TableRow>
            ) : students.length === 0 ? (
              <TableRow><TableCell colSpan={STATUS_BUTTONS.length + 3} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No students in this class</p>
                  <p className="text-xs text-muted-foreground/70">Assign students to this class to mark attendance.</p>
                </div>
              </TableCell></TableRow>
            ) : students.map((student) => {
              const rec = records[student.id];
              const current = rec?.status;
              const cfg = current ? statusConfig[current] : null;
              const isSel = selected.has(student.id);
              return (
                <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell><Checkbox checked={isSel} onCheckedChange={(v) => toggleSelect(student.id, !!v)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {initials(student)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-muted-foreground">{student.admission_number || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  {STATUS_BUTTONS.map((s) => (
                    <TableCell key={s.key} className="text-center hidden md:table-cell">
                      <Button
                        variant={current === s.key ? "default" : "ghost"}
                        size="icon"
                        className={`h-8 w-8 ${current === s.key ? s.color : ""}`}
                        onClick={() => setStatus(student.id, s.key)}
                        title={s.label}
                      >
                        <s.icon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  ))}
                  <TableCell className="md:hidden">
                    <Select value={current || ""} onValueChange={(v) => setStatus(student.id, v as AttendanceStatus)}>
                      <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {STATUS_BUTTONS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {cfg && <Badge variant="outline" className={`mt-1 text-[10px] ${cfg.color}`}>{cfg.label}</Badge>}
                  </TableCell>
                  <TableCell>
                    {current === "late" ? (
                      <Input type="time" value={rec?.arrival_time || ""} onChange={(e) => setArrival(student.id, e.target.value)}
                        className="h-8 w-[100px] text-xs" />
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}