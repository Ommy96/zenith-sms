import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  UserCheck, UserX, Clock, Users, Loader2, Check, X, Minus,
  ChevronLeft, ChevronRight, CalendarDays,
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type ClassOption = { id: string; name: string };
type StudentRow = { id: string; first_name: string; last_name: string; admission_number: string | null };
type AttendanceStatus = "present" | "absent" | "late" | "excused";

const statusConfig: Record<AttendanceStatus, { label: string; icon: any; color: string }> = {
  present: { label: "Present", icon: Check, color: "bg-success/10 text-success border-success/20" },
  absent: { label: "Absent", icon: X, color: "bg-destructive/10 text-destructive border-destructive/20" },
  late: { label: "Late", icon: Clock, color: "bg-warning/10 text-warning border-warning/20" },
  excused: { label: "Excused", icon: Minus, color: "bg-muted text-muted-foreground border-border" },
};

export default function Attendance() {
  const { profile, user } = useAuth();
  const schoolId = profile?.school_id;

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [existingIds, setExistingIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  // Fetch classes
  useEffect(() => {
    if (!schoolId) return;
    supabase.from("classes").select("id, name").eq("school_id", schoolId).order("name")
      .then(({ data }) => {
        setClasses(data || []);
        if (data && data.length > 0 && !selectedClass) setSelectedClass(data[0].id);
      });
  }, [schoolId]);

  // Fetch students for selected class + existing attendance
  const fetchData = useCallback(async () => {
    if (!schoolId || !selectedClass) return;
    setLoading(true);

    // Get class info to match students by grade
    const { data: classData } = await supabase.from("classes").select("name, grade_level").eq("id", selectedClass).single();
    const gradeName = classData?.name || classData?.grade_level || "";

    // Fetch students matching this class/grade
    const { data: studentData } = await supabase
      .from("students")
      .select("id, first_name, last_name, admission_number")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .or(`grade.eq.${gradeName},grade.eq.${classData?.grade_level || "NONE"}`)
      .order("first_name");

    setStudents(studentData || []);

    // Fetch existing attendance for this date + class
    const { data: attData } = await supabase
      .from("attendance")
      .select("id, student_id, status")
      .eq("school_id", schoolId)
      .eq("class_id", selectedClass)
      .eq("date", date);

    const recs: Record<string, AttendanceStatus> = {};
    const ids: Record<string, string> = {};
    (attData || []).forEach((a) => {
      recs[a.student_id] = a.status as AttendanceStatus;
      ids[a.student_id] = a.id;
    });
    setRecords(recs);
    setExistingIds(ids);

    // Compute stats
    const total = studentData?.length || 0;
    const present = Object.values(recs).filter((s) => s === "present").length;
    const absent = Object.values(recs).filter((s) => s === "absent").length;
    const late = Object.values(recs).filter((s) => s === "late").length;
    setStats({ present, absent, late, total });

    setLoading(false);
  }, [schoolId, selectedClass, date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { all[s.id] = status; });
    setRecords(all);
  };

  const handleSave = async () => {
    if (!schoolId || !user) return;
    setSaving(true);

    const toUpsert = students
      .filter((s) => records[s.id])
      .map((s) => ({
        ...(existingIds[s.id] ? { id: existingIds[s.id] } : {}),
        student_id: s.id,
        class_id: selectedClass,
        school_id: schoolId,
        date,
        status: records[s.id],
        recorded_by: user.id,
      }));

    if (toUpsert.length === 0) {
      toast({ title: "No attendance marked", variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("attendance").upsert(toUpsert, { onConflict: "id" });
    if (error) {
      toast({ title: "Error saving attendance", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Attendance saved successfully" });
      fetchData();
    }
    setSaving(false);
  };

  const initials = (s: StudentRow) => `${s.first_name[0] || ""}${s.last_name[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">Record and manage daily student attendance</p>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Input type="date" className="w-[160px] h-9 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => markAll("present")}>Mark All Present</Button>
          <Button size="sm" className="text-xs" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Save Attendance
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats.total, icon: Users, color: "bg-primary/10 text-primary" },
          { label: "Present", value: stats.present, icon: UserCheck, color: "bg-success/10 text-success" },
          { label: "Absent", value: stats.absent, icon: UserX, color: "bg-destructive/10 text-destructive" },
          { label: "Late", value: stats.late, icon: Clock, color: "bg-warning/10 text-warning" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`h-8 w-8 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Student</TableHead>
              <TableHead className="text-xs font-semibold text-center">Present</TableHead>
              <TableHead className="text-xs font-semibold text-center">Absent</TableHead>
              <TableHead className="text-xs font-semibold text-center">Late</TableHead>
              <TableHead className="text-xs font-semibold text-center">Excused</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No students in this class</p>
                    <p className="text-xs text-muted-foreground/70">Add students with a matching grade first</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => {
                const current = records[student.id];
                const cfg = current ? statusConfig[current] : null;
                return (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
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
                    {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((status) => (
                      <TableCell key={status} className="text-center">
                        <Button
                          variant={current === status ? "default" : "ghost"}
                          size="icon"
                          className={`h-8 w-8 ${current === status ? statusConfig[status].color : ""}`}
                          onClick={() => setStatus(student.id, status)}
                        >
                          {(() => { const Icon = statusConfig[status].icon; return <Icon className="h-4 w-4" />; })()}
                        </Button>
                      </TableCell>
                    ))}
                    <TableCell>
                      {cfg ? (
                        <Badge variant="outline" className={`text-[11px] ${cfg.color}`}>{cfg.label}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
