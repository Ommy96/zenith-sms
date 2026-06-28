import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar, Loader2, Plus, Sparkles, AlertTriangle, Trash2, Printer, Wand2,
  CheckCircle2, Clock, Users, MapPin, ListChecks, LayoutGrid, BookOpen,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OptimizerPanel } from "@/components/timetable/OptimizerPanel";
import { TeacherUnavailabilityPanel } from "@/components/timetable/TeacherUnavailabilityPanel";
import { EmptyState } from "@/components/EmptyState";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY_IDX = (() => { const d = new Date().getDay(); return d === 0 ? 0 : d - 1; })();

function initials(first?: string | null, last?: string | null) {
  return `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase() || "—";
}

const SUBJECT_TONE: Record<string, string> = {
  core: "bg-primary/10 text-primary border-primary/20",
  elective: "bg-success/10 text-success border-success/20",
  "co-curricular": "bg-warning/10 text-warning border-warning/20",
  "life-skills": "bg-accent-soft text-accent border-accent/20",
};
function subjectTone(s: any) { return SUBJECT_TONE[(s?.category || "core").toLowerCase()] || SUBJECT_TONE.core; }

const STANDARD_KENYAN_DAY = [
  { name: "Period 1", start_time: "08:00", end_time: "08:40", is_break: false },
  { name: "Period 2", start_time: "08:40", end_time: "09:20", is_break: false },
  { name: "Period 3", start_time: "09:20", end_time: "10:00", is_break: false },
  { name: "Tea Break", start_time: "10:00", end_time: "10:20", is_break: true },
  { name: "Period 4", start_time: "10:20", end_time: "11:00", is_break: false },
  { name: "Period 5", start_time: "11:00", end_time: "11:40", is_break: false },
  { name: "Period 6", start_time: "11:40", end_time: "12:20", is_break: false },
  { name: "Lunch", start_time: "12:20", end_time: "13:20", is_break: true },
  { name: "Period 7", start_time: "13:20", end_time: "14:00", is_break: false },
  { name: "Period 8", start_time: "14:00", end_time: "14:40", is_break: false },
];

export default function Timetable() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [periods, setPeriods] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [gradeLevels, setGradeLevels] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [unavailability, setUnavailability] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [scheduleDay, setScheduleDay] = useState(TODAY_IDX);
  const [gradeFilter, setGradeFilter] = useState<string[]>([]);
  const [tab, setTab] = useState("schedule");
  const [termId, setTermId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pForm, setPForm] = useState({ name: "", start_time: "08:00", end_time: "08:40", day_of_week: 1, is_break: false });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [p, c, s, t, r, g] = await Promise.all([
      supabase.from("periods").select("*").eq("tenant_id", tenantId).order("day_of_week").order("start_time"),
      supabase.from("classes").select("id,name,grade_level_id,stream").eq("tenant_id", tenantId).order("name"),
      supabase.from("subjects").select("id,code,name,category").eq("tenant_id", tenantId).order("name"),
      supabase.from("staff").select("id,first_name,last_name").eq("tenant_id", tenantId).eq("status", "active").order("last_name"),
      supabase.from("rooms").select("id,name,type").eq("tenant_id", tenantId).order("name"),
      supabase.from("grade_levels").select("id,name,sort_order").eq("tenant_id", tenantId).order("sort_order"),
    ]);
    setPeriods(p.data || []); setClasses(c.data || []); setSubjects(s.data || []);
    setTeachers(t.data || []); setRooms(r.data || []); setGradeLevels(g.data || []);
    const { data: term } = await supabase.rpc("current_term" as any, { _tenant: tenantId });
    setTermId((term as any) || null);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!classId || !termId) { setSlots([]); return; }
    supabase.from("timetable_slots").select("*").eq("class_id", classId).eq("term_id", termId).then(({ data }) => setSlots(data || []));
  }, [classId, termId]);

  useEffect(() => {
    if (!tenantId || !termId) { setAllSlots([]); setUnavailability([]); return; }
    supabase.from("timetable_slots").select("id,class_id,period_id,teacher_id,room_id,subject_id")
      .eq("tenant_id", tenantId).eq("term_id", termId)
      .then(({ data }) => setAllSlots(data || []));
    supabase.from("teacher_unavailability").select("teacher_id,period_id,day_of_week,reason")
      .eq("tenant_id", tenantId)
      .then(({ data }) => setUnavailability(data || []));
  }, [tenantId, termId, slots]);

  const conflictsFor = (periodId: string, teacherId?: string | null, roomId?: string | null): string[] => {
    const issues: string[] = [];
    if (!teacherId && !roomId) return issues;
    const period = periods.find((p) => p.id === periodId);
    if (teacherId) {
      const clash = allSlots.find((s) => s.period_id === periodId && s.teacher_id === teacherId && s.class_id !== classId);
      if (clash) {
        const cls = classes.find((c) => c.id === clash.class_id);
        issues.push(`Teacher already teaching ${cls?.name || "another class"} this period`);
      }
      if (period) {
        const ua = unavailability.find((u) => u.teacher_id === teacherId && (u.period_id === periodId || (u.day_of_week === period.day_of_week && !u.period_id)));
        if (ua) issues.push(`Teacher unavailable${ua.reason ? `: ${ua.reason}` : ""}`);
      }
    }
    if (roomId) {
      const clash = allSlots.find((s) => s.period_id === periodId && s.room_id === roomId && s.class_id !== classId);
      if (clash) issues.push("Room already booked this period");
    }
    return issues;
  };

  const addPeriod = async () => {
    if (!tenantId || !pForm.name) return;
    const { error } = await supabase.from("periods").insert({ ...pForm, tenant_id: tenantId, sort_order: periods.length } as any);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setPForm({ name: "", start_time: "08:00", end_time: "08:40", day_of_week: 1, is_break: false }); load();
  };

  const deletePeriod = async (id: string) => {
    const { error } = await supabase.from("periods").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    load();
  };

  const seedStandardDay = async () => {
    if (!tenantId) return;
    const rows: any[] = [];
    for (let d = 1; d <= 5; d++) {
      STANDARD_KENYAN_DAY.forEach((p, i) => rows.push({ ...p, day_of_week: d, sort_order: i, tenant_id: tenantId }));
    }
    const { error } = await supabase.from("periods").insert(rows);
    if (error) return toast({ title: "Seed failed", description: error.message, variant: "destructive" });
    toast({ title: "Standard Kenyan school day created" }); load();
  };

  const setSlot = async (periodId: string, subjectId: string, tId: string, rId: string) => {
    if (!tenantId || !termId || !classId) return;
    if (subjectId) {
      const issues = conflictsFor(periodId, tId, rId);
      if (issues.length) toast({ title: "Schedule conflict", description: issues.join(" • "), variant: "destructive" });
    }
    const existing = slots.find((s) => s.period_id === periodId);
    if (!subjectId && existing) {
      await supabase.from("timetable_slots").delete().eq("id", existing.id);
    } else if (existing) {
      const { error } = await supabase.from("timetable_slots").update({
        subject_id: subjectId || null, teacher_id: tId || null, room_id: rId || null,
      }).eq("id", existing.id);
      if (error) return toast({ title: "Conflict", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("timetable_slots").insert({
        tenant_id: tenantId, term_id: termId, class_id: classId, period_id: periodId,
        subject_id: subjectId || null, teacher_id: tId || null, room_id: rId || null,
      });
      if (error) return toast({ title: "Conflict", description: error.message, variant: "destructive" });
    }
    const { data } = await supabase.from("timetable_slots").select("*").eq("class_id", classId).eq("term_id", termId);
    setSlots(data || []);
  };

  const autoFill = async () => {
    if (!classId || !termId) return;
    const { error } = await supabase.functions.invoke("auto-timetable", { body: { tenantId, classId, termId } });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Auto-timetable generated" });
    const { data } = await supabase.from("timetable_slots").select("*").eq("class_id", classId).eq("term_id", termId);
    setSlots(data || []);
  };

  const reloadSlots = async () => {
    if (!classId || !termId) return;
    const { data } = await supabase.from("timetable_slots").select("*").eq("class_id", classId).eq("term_id", termId);
    setSlots(data || []);
  };

  const periodNames = useMemo(() => {
    const seen = new Map<string, string>();
    periods.forEach((p) => { if (!seen.has(p.name)) seen.set(p.name, p.start_time); });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1])).map(([n]) => n);
  }, [periods]);

  const filteredClasses = useMemo(() => {
    if (!gradeFilter.length) return classes;
    return classes.filter((c) => gradeFilter.includes(c.grade_level_id));
  }, [classes, gradeFilter]);

  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => Object.fromEntries(teachers.map((t) => [t.id, t])), [teachers]);
  const roomMap = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r])), [rooms]);
  const classMap = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
  const periodMap = useMemo(() => Object.fromEntries(periods.map((p) => [p.id, p])), [periods]);

  const canGenerate = periods.length > 0 && classes.length > 0 && subjects.length > 0 && teachers.length > 0;

  const globalConflicts = useMemo(() => {
    const out: { type: string; detail: string; classId?: string; periodId?: string }[] = [];
    const byPeriod: Record<string, any[]> = {};
    allSlots.forEach((s) => { (byPeriod[s.period_id] ||= []).push(s); });
    Object.entries(byPeriod).forEach(([pid, list]) => {
      const ts: Record<string, any[]> = {};
      const rs: Record<string, any[]> = {};
      list.forEach((s) => {
        if (s.teacher_id) (ts[s.teacher_id] ||= []).push(s);
        if (s.room_id) (rs[s.room_id] ||= []).push(s);
      });
      Object.entries(ts).forEach(([tid, arr]) => {
        if (arr.length > 1) {
          const t = teacherMap[tid]; const p = periodMap[pid];
          out.push({
            type: "Teacher double-booked",
            detail: `${t ? `${t.first_name} ${t.last_name}` : "Teacher"} scheduled in ${arr.length} classes during ${p?.name || "period"} (${DAYS[(p?.day_of_week || 1) - 1]})`,
            classId: arr[0].class_id, periodId: pid,
          });
        }
      });
      Object.entries(rs).forEach(([rid, arr]) => {
        if (arr.length > 1) {
          const r = roomMap[rid]; const p = periodMap[pid];
          out.push({ type: "Room double-booked", detail: `${r?.name || "Room"} booked ${arr.length} times during ${p?.name || "period"}`, periodId: pid });
        }
      });
      list.forEach((s) => {
        if (s.subject_id && !s.teacher_id) {
          const p = periodMap[pid]; const c = classMap[s.class_id];
          out.push({ type: "No teacher assigned", detail: `${c?.name || "Class"} • ${p?.name || ""} has subject but no teacher`, classId: s.class_id, periodId: pid });
        }
      });
    });
    return out;
  }, [allSlots, teacherMap, roomMap, periodMap, classMap]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Timetable</h1>
            <p className="text-sm text-muted-foreground">Schedule subjects per class and detect conflicts in real time.</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button onClick={() => setTab("generator")} disabled={!canGenerate}>
                  <Sparkles className="h-4 w-4 mr-1" /> Generate with AI
                </Button>
              </span>
            </TooltipTrigger>
            {!canGenerate && (
              <TooltipContent>Requires periods, classes, subjects and teachers to be set up.</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="overflow-x-auto flex-wrap h-auto">
          <TabsTrigger value="schedule"><LayoutGrid className="h-3.5 w-3.5 mr-1" />Schedule</TabsTrigger>
          <TabsTrigger value="class"><BookOpen className="h-3.5 w-3.5 mr-1" />Class views</TabsTrigger>
          <TabsTrigger value="teacher"><Users className="h-3.5 w-3.5 mr-1" />Teacher views</TabsTrigger>
          <TabsTrigger value="room"><MapPin className="h-3.5 w-3.5 mr-1" />Room views</TabsTrigger>
          <TabsTrigger value="generator"><Wand2 className="h-3.5 w-3.5 mr-1" />AI generator</TabsTrigger>
          <TabsTrigger value="conflicts">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />Conflicts
            {globalConflicts.length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{globalConflicts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="setup"><ListChecks className="h-3.5 w-3.5 mr-1" />Setup</TabsTrigger>
        </TabsList>

        {/* SCHEDULE */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>Today's schedule</CardTitle>
                <CardDescription>{DAYS[scheduleDay]} • {filteredClasses.length} classes</CardDescription>
              </div>
              <div className="flex gap-1 flex-wrap">
                {DAYS.map((d, i) => (
                  <Button key={d} size="sm" variant={scheduleDay === i ? "default" : "outline"} onClick={() => setScheduleDay(i)}>{d}</Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {gradeLevels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {gradeLevels.map((g) => {
                    const active = gradeFilter.includes(g.id);
                    return (
                      <Badge key={g.id} variant={active ? "default" : "outline"} className="cursor-pointer"
                        onClick={() => setGradeFilter(active ? gradeFilter.filter((x) => x !== g.id) : [...gradeFilter, g.id])}>
                        {g.name}
                      </Badge>
                    );
                  })}
                  {gradeFilter.length > 0 && <Button size="sm" variant="ghost" onClick={() => setGradeFilter([])}>Clear</Button>}
                </div>
              )}
              {periods.filter((p) => p.day_of_week === scheduleDay + 1).length === 0 || filteredClasses.length === 0 ? (
                <EmptyState icon={<Calendar className="h-5 w-5" />} title={`Nothing scheduled for ${DAYS[scheduleDay]} yet`}
                  description="Build your school's timetable using the AI generator or manually under Setup."
                  actionLabel="Generate timetable" onAction={() => setTab("generator")} />
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-xs border rounded">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-2 text-left sticky left-0 bg-muted">Period</th>
                        {filteredClasses.map((c) => <th key={c.id} className="px-2 py-2 text-left whitespace-nowrap">{c.name}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.filter((p) => p.day_of_week === scheduleDay + 1).map((p) => (
                        <tr key={p.id} className={`border-t ${p.is_break ? "bg-muted/30" : ""}`}>
                          <td className="px-2 py-1 font-medium sticky left-0 bg-background">
                            <div>{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">{p.start_time?.slice(0, 5)}–{p.end_time?.slice(0, 5)}</div>
                          </td>
                          {filteredClasses.map((c) => {
                            if (p.is_break) return <td key={c.id} className="px-2 py-1 text-muted-foreground italic">— break —</td>;
                            const s = allSlots.find((x) => x.period_id === p.id && x.class_id === c.id);
                            if (!s || !s.subject_id) return <td key={c.id} className="px-2 py-1 text-muted-foreground">—</td>;
                            const subj = subjectMap[s.subject_id];
                            const t = s.teacher_id ? teacherMap[s.teacher_id] : null;
                            return (
                              <td key={c.id} className="px-2 py-1">
                                <div className={`rounded px-1.5 py-1 border text-[11px] ${subjectTone(subj)}`}>
                                  <div className="font-medium">{subj?.code || subj?.name || "—"}</div>
                                  {t && <div className="text-[10px] opacity-80">{initials(t.first_name, t.last_name)}</div>}
                                </div>
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

        {/* CLASS */}
        <TabsContent value="class" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle>Class timetable</CardTitle>
              <div className="flex gap-2">
                <select className="border rounded px-2 py-1.5 text-sm bg-background" value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">Select class…</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {classId && <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Print</Button>}
                {classId && <Button size="sm" variant="outline" onClick={autoFill}><Sparkles className="h-4 w-4 mr-1" />Auto-fill</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {!classId ? (
                <EmptyState icon={<BookOpen className="h-5 w-5" />} title="Pick a class" description="Choose a class to view and edit its weekly schedule." />
              ) : periodNames.length === 0 ? (
                <EmptyState icon={<Clock className="h-5 w-5" />} title="No periods defined" description="Add periods under the Setup tab first."
                  actionLabel="Go to setup" onAction={() => setTab("setup")} />
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-xs border rounded">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-2 text-left">Period</th>
                        {DAYS.map((d) => <th key={d} className="px-2 py-2 text-left">{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {periodNames.map((pname) => {
                        const samplePeriod = periods.find((p) => p.name === pname);
                        const isBreak = samplePeriod?.is_break;
                        return (
                          <tr key={pname} className={`border-t ${isBreak ? "bg-muted/30" : ""}`}>
                            <td className="px-2 py-1 font-medium">
                              <div>{pname}</div>
                              <div className="text-[10px] text-muted-foreground">{samplePeriod?.start_time?.slice(0, 5)}–{samplePeriod?.end_time?.slice(0, 5)}</div>
                            </td>
                            {DAYS.map((_, di) => {
                              const period = periods.find((p) => p.name === pname && p.day_of_week === di + 1);
                              if (!period) return <td key={di} className="p-1 text-muted-foreground">—</td>;
                              if (period.is_break) return <td key={di} className="p-1 text-[10px] italic text-muted-foreground">break</td>;
                              const slot = slots.find((s) => s.period_id === period.id);
                              const issues = slot ? conflictsFor(period.id, slot.teacher_id, slot.room_id) : [];
                              const hasConflict = issues.length > 0;
                              return (
                                <td key={di} className={`p-1 ${hasConflict ? "bg-destructive/10 ring-1 ring-destructive/40" : ""}`}>
                                  {hasConflict && (
                                    <TooltipProvider><Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 text-[10px] text-destructive mb-0.5">
                                          <AlertTriangle className="h-3 w-3" />conflict
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent><ul className="text-xs">{issues.map((i) => <li key={i}>• {i}</li>)}</ul></TooltipContent>
                                    </Tooltip></TooltipProvider>
                                  )}
                                  <select className="w-full border rounded text-xs bg-background"
                                    value={slot?.subject_id || ""} onChange={(e) => setSlot(period.id, e.target.value, slot?.teacher_id || "", slot?.room_id || "")}>
                                    <option value="">—</option>
                                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
                                  </select>
                                  <select className="w-full border rounded text-xs bg-background mt-0.5"
                                    value={slot?.teacher_id || ""} onChange={(e) => setSlot(period.id, slot?.subject_id || "", e.target.value, slot?.room_id || "")}>
                                    <option value="">teacher…</option>
                                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.last_name}</option>)}
                                  </select>
                                  <select className="w-full border rounded text-xs bg-background mt-0.5"
                                    value={slot?.room_id || ""} onChange={(e) => setSlot(period.id, slot?.subject_id || "", slot?.teacher_id || "", e.target.value)}>
                                    <option value="">room…</option>
                                    {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                  </select>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEACHER */}
        <TabsContent value="teacher" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle>Teacher schedule</CardTitle>
              <select className="border rounded px-2 py-1.5 text-sm bg-background" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">Select teacher…</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </CardHeader>
            <CardContent>
              {!teacherId ? (
                <EmptyState icon={<Users className="h-5 w-5" />} title="Pick a teacher" description="View their weekly commitments and workload." />
              ) : (() => {
                const mySlots = allSlots.filter((s) => s.teacher_id === teacherId);
                const classCount = new Set(mySlots.map((s) => s.class_id)).size;
                const lessons = mySlots.length;
                const maxRec = 30;
                const pct = Math.min(100, Math.round((lessons / maxRec) * 100));
                const t = teacherMap[teacherId];
                return (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <div className="text-sm font-medium">{t?.first_name} {t?.last_name}</div>
                      <div className="text-xs text-muted-foreground">teaches {lessons} lessons/week across {classCount} classes — {pct}% of recommended max ({maxRec}).</div>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-xs border rounded">
                        <thead className="bg-muted"><tr><th className="px-2 py-2 text-left">Period</th>{DAYS.map((d) => <th key={d} className="px-2 py-2 text-left">{d}</th>)}</tr></thead>
                        <tbody>
                          {periodNames.map((pname) => (
                            <tr key={pname} className="border-t">
                              <td className="px-2 py-1 font-medium">{pname}</td>
                              {DAYS.map((_, di) => {
                                const period = periods.find((p) => p.name === pname && p.day_of_week === di + 1);
                                if (!period) return <td key={di} className="p-1 text-muted-foreground">—</td>;
                                const s = mySlots.find((x) => x.period_id === period.id);
                                if (!s) return <td key={di} className="p-1 text-muted-foreground">—</td>;
                                const subj = subjectMap[s.subject_id]; const c = classMap[s.class_id];
                                return <td key={di} className="p-1"><div className={`rounded px-1.5 py-1 border text-[11px] ${subjectTone(subj)}`}>
                                  <div className="font-medium">{subj?.code}</div><div className="text-[10px] opacity-80">{c?.name}</div></div></td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROOM */}
        <TabsContent value="room" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle>Room schedule</CardTitle>
              <select className="border rounded px-2 py-1.5 text-sm bg-background" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">Select room…</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </CardHeader>
            <CardContent>
              {!roomId ? (
                <EmptyState icon={<MapPin className="h-5 w-5" />} title="Pick a room" description="View this room's weekly bookings and utilization." />
              ) : (() => {
                const mySlots = allSlots.filter((s) => s.room_id === roomId);
                const teaching = periods.filter((p) => !p.is_break).length;
                const pct = teaching ? Math.round((mySlots.length / teaching) * 100) : 0;
                return (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-3 bg-muted/30 text-xs">
                      Room used <b>{mySlots.length}</b> of {teaching} weekly periods ({pct}%).
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-xs border rounded">
                        <thead className="bg-muted"><tr><th className="px-2 py-2 text-left">Period</th>{DAYS.map((d) => <th key={d} className="px-2 py-2 text-left">{d}</th>)}</tr></thead>
                        <tbody>
                          {periodNames.map((pname) => (
                            <tr key={pname} className="border-t">
                              <td className="px-2 py-1 font-medium">{pname}</td>
                              {DAYS.map((_, di) => {
                                const period = periods.find((p) => p.name === pname && p.day_of_week === di + 1);
                                if (!period) return <td key={di} className="p-1 text-muted-foreground">—</td>;
                                const s = mySlots.find((x) => x.period_id === period.id);
                                if (!s) return <td key={di} className="p-1 text-muted-foreground">—</td>;
                                const subj = subjectMap[s.subject_id]; const c = classMap[s.class_id];
                                return <td key={di} className="p-1"><div className={`rounded px-1.5 py-1 border text-[11px] ${subjectTone(subj)}`}>
                                  <div className="font-medium">{c?.name}</div><div className="text-[10px] opacity-80">{subj?.code}</div></div></td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI GENERATOR */}
        <TabsContent value="generator" className="space-y-4">
          {!canGenerate ? (
            <Card><CardContent className="pt-6">
              <EmptyState icon={<Wand2 className="h-5 w-5" />} title="Setup required"
                description="The AI generator needs periods, classes, subjects, and at least one teacher before it can build a schedule."
                actionLabel="Go to setup" onAction={() => setTab("setup")} />
            </CardContent></Card>
          ) : !classId || !termId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> AI timetable generator</CardTitle>
                <CardDescription>Pick a class — the optimizer balances constraints, conflicts and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Target class</Label>
                  <select className="w-full border rounded px-2 py-1.5 text-sm bg-background mt-1" value={classId} onChange={(e) => setClassId(e.target.value)}>
                    <option value="">Select class…</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {!termId && <p className="text-xs text-destructive">No current term set. Mark a term as current under Academics.</p>}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle>Step 1 — Quick draft</CardTitle><CardDescription>Auto-fill from class subjects, then refine with the optimizer below.</CardDescription></CardHeader>
                <CardContent className="flex items-center gap-2 flex-wrap">
                  <Button onClick={autoFill}><Sparkles className="h-4 w-4 mr-1" />Auto-fill {classMap[classId]?.name}</Button>
                  <span className="text-xs text-muted-foreground">Generates an initial assignment using class subject hours.</span>
                </CardContent>
              </Card>
              <OptimizerPanel tenantId={tenantId!} classId={classId} termId={termId} onApplied={reloadSlots} />
              <TeacherUnavailabilityPanel tenantId={tenantId!} teachers={teachers} periods={periods} />
            </>
          )}
        </TabsContent>

        {/* CONFLICTS */}
        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling conflicts</CardTitle>
              <CardDescription>Live across all classes for the current term.</CardDescription>
            </CardHeader>
            <CardContent>
              {globalConflicts.length === 0 ? (
                <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="All clear" description="No scheduling conflicts detected." />
              ) : (
                <ul className="divide-y border rounded">
                  {globalConflicts.map((c, i) => (
                    <li key={i} className="px-3 py-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> {c.type}
                        </div>
                        <div className="text-xs text-muted-foreground">{c.detail}</div>
                      </div>
                      {c.classId && (
                        <Button size="sm" variant="outline" onClick={() => { setClassId(c.classId!); setTab("class"); }}>Resolve</Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETUP */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>Periods</CardTitle>
                <CardDescription>Define the bell schedule for your school week.</CardDescription>
              </div>
              {periods.length === 0 && (
                <Button size="sm" variant="outline" onClick={seedStandardDay}>
                  <Sparkles className="h-4 w-4 mr-1" /> Seed standard Kenyan day
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-6">
                <Input placeholder="Name (Period 1)" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} />
                <Input type="time" value={pForm.start_time} onChange={(e) => setPForm({ ...pForm, start_time: e.target.value })} />
                <Input type="time" value={pForm.end_time} onChange={(e) => setPForm({ ...pForm, end_time: e.target.value })} />
                <select className="border rounded px-2 text-sm bg-background" value={pForm.day_of_week} onChange={(e) => setPForm({ ...pForm, day_of_week: parseInt(e.target.value) })}>
                  {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs"><Switch checked={pForm.is_break} onCheckedChange={(v) => setPForm({ ...pForm, is_break: v })} /> Break</label>
                <Button size="sm" onClick={addPeriod}><Plus className="h-4 w-4 mr-1" />Add</Button>
              </div>

              {periods.length === 0 ? (
                <EmptyState icon={<Clock className="h-5 w-5" />} title="No periods yet" description="Add periods above, or seed the standard Kenyan school day." />
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-xs border rounded">
                    <thead className="bg-muted"><tr>
                      <th className="px-2 py-2 text-left">Name</th><th className="px-2 py-2 text-left">Day</th>
                      <th className="px-2 py-2 text-left">Start</th><th className="px-2 py-2 text-left">End</th>
                      <th className="px-2 py-2 text-left">Type</th><th className="px-2 py-2"></th>
                    </tr></thead>
                    <tbody>
                      {[...periods].sort((a, b) => (a.day_of_week - b.day_of_week) || a.start_time.localeCompare(b.start_time)).map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-2 py-1 font-medium">{p.name}</td>
                          <td className="px-2 py-1">{DAYS[p.day_of_week - 1]}</td>
                          <td className="px-2 py-1">{p.start_time?.slice(0, 5)}</td>
                          <td className="px-2 py-1">{p.end_time?.slice(0, 5)}</td>
                          <td className="px-2 py-1">{p.is_break ? <Badge variant="outline">Break</Badge> : <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Teaching</Badge>}</td>
                          <td className="px-2 py-1 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost"><Trash2 className="h-3.5 w-3.5" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete period?</AlertDialogTitle>
                                  <AlertDialogDescription>This removes {p.name} on {DAYS[p.day_of_week - 1]}.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deletePeriod(p.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {periods.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Bell schedule preview</CardTitle><CardDescription>Monday timeline.</CardDescription></CardHeader>
              <CardContent>
                <ol className="relative border-l ml-2 space-y-2">
                  {[...periods].filter((p) => p.day_of_week === 1).sort((a, b) => a.start_time.localeCompare(b.start_time)).map((p) => (
                    <li key={p.id} className="ml-4 relative">
                      <div className={`absolute -left-[1.4rem] mt-1.5 h-3 w-3 rounded-full ${p.is_break ? "bg-muted-foreground" : "bg-primary"}`} />
                      <div className="text-xs">
                        <span className="font-medium">{p.start_time?.slice(0, 5)}</span>
                        <span className="text-muted-foreground"> – {p.end_time?.slice(0, 5)}</span>
                        <span className="ml-2">{p.name}</span>
                        {p.is_break && <Badge variant="outline" className="ml-2">break</Badge>}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
