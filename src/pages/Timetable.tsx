import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Loader2, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OptimizerPanel } from "@/components/timetable/OptimizerPanel";
import { TeacherUnavailabilityPanel } from "@/components/timetable/TeacherUnavailabilityPanel";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function Timetable() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [periods, setPeriods] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [termId, setTermId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pForm, setPForm] = useState({ name: "", start_time: "08:00", end_time: "08:40", day_of_week: 1 });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [p, c, s, t, r] = await Promise.all([
      supabase.from("periods").select("*").eq("tenant_id", tenantId).order("day_of_week").order("start_time"),
      supabase.from("classes").select("id,name").eq("tenant_id", tenantId),
      supabase.from("subjects").select("id,code,name").eq("tenant_id", tenantId),
      supabase.from("staff").select("id,first_name,last_name").eq("tenant_id", tenantId).eq("status", "active"),
      supabase.from("rooms").select("id,name").eq("tenant_id", tenantId),
    ]);
    setPeriods(p.data || []); setClasses(c.data || []); setSubjects(s.data || []); setTeachers(t.data || []); setRooms(r.data || []);
    const { data: term } = await supabase.rpc("current_term" as any, { _tenant: tenantId });
    setTermId(term || null);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!classId || !termId) { setSlots([]); return; }
    supabase.from("timetable_slots").select("*").eq("class_id", classId).eq("term_id", termId).then(({ data }) => setSlots(data || []));
  }, [classId, termId]);

  const addPeriod = async () => {
    if (!tenantId || !pForm.name) return;
    const { error } = await supabase.from("periods").insert({ ...pForm, tenant_id: tenantId, sort_order: periods.length });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setPForm({ name: "", start_time: "08:00", end_time: "08:40", day_of_week: 1 }); load();
  };

  const setSlot = async (periodId: string, subjectId: string, teacherId: string, roomId: string) => {
    if (!tenantId || !termId || !classId) return;
    // upsert
    const existing = slots.find((s) => s.period_id === periodId);
    if (!subjectId && existing) {
      await supabase.from("timetable_slots").delete().eq("id", existing.id);
    } else if (existing) {
      const { error } = await supabase.from("timetable_slots").update({
        subject_id: subjectId || null, teacher_id: teacherId || null, room_id: roomId || null,
      }).eq("id", existing.id);
      if (error) return toast({ title: "Conflict", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("timetable_slots").insert({
        tenant_id: tenantId, term_id: termId, class_id: classId, period_id: periodId,
        subject_id: subjectId || null, teacher_id: teacherId || null, room_id: roomId || null,
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

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  // Group periods by day
  const byDay: Record<number, any[]> = {};
  periods.forEach((p) => { (byDay[p.day_of_week] ||= []).push(p); });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-primary" />
        <div><h1 className="text-2xl font-bold">Timetable</h1>
          <p className="text-sm text-muted-foreground">Schedule subjects per class and detect conflicts in real time.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Periods</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-5">
            <Input placeholder="Name (Period 1)" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} />
            <Input type="time" value={pForm.start_time} onChange={(e) => setPForm({ ...pForm, start_time: e.target.value })} />
            <Input type="time" value={pForm.end_time} onChange={(e) => setPForm({ ...pForm, end_time: e.target.value })} />
            <select className="border rounded px-2 text-sm bg-background" value={pForm.day_of_week} onChange={(e) => setPForm({ ...pForm, day_of_week: parseInt(e.target.value) })}>
              {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </select>
            <Button size="sm" onClick={addPeriod}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Class timetable</CardTitle>
          <div className="flex gap-2">
            <select className="border rounded px-2 py-1.5 text-sm bg-background" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select class…</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {classId && <Button size="sm" variant="outline" onClick={autoFill}><Sparkles className="h-4 w-4 mr-1" />Auto-fill</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {!classId ? <div className="text-sm text-muted-foreground">Pick a class.</div> :
            <div className="overflow-auto">
              <table className="w-full text-xs border rounded">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-2 py-2 text-left">Period</th>
                    {DAYS.map((d) => <th key={d} className="px-2 py-2 text-left">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {/* Find unique period names */}
                  {Array.from(new Set(periods.map((p) => p.name))).map((pname) => (
                    <tr key={pname} className="border-t">
                      <td className="px-2 py-1 font-medium bg-muted/30">{pname}</td>
                      {DAYS.map((_, di) => {
                        const period = periods.find((p) => p.name === pname && p.day_of_week === di + 1);
                        if (!period) return <td key={di} className="p-1 text-muted-foreground">—</td>;
                        const slot = slots.find((s) => s.period_id === period.id);
                        return (
                          <td key={di} className="p-1">
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
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </CardContent>
      </Card>

      {tenantId && periods.length > 0 && (
        <TeacherUnavailabilityPanel tenantId={tenantId} teachers={teachers} periods={periods} />
      )}

      {tenantId && classId && termId && (
        <OptimizerPanel
          tenantId={tenantId}
          classId={classId}
          termId={termId}
          onApplied={reloadSlots}
        />
      )}
    </motion.div>
  );
}