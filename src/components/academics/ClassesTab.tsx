import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2 } from "lucide-react";

export function ClassesTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", grade_level_id: "", stream: "", class_teacher_id: "", room_id: "", capacity: "40" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: c }, { data: g }, { data: t }, { data: r }] = await Promise.all([
      supabase.from("classes").select("*").eq("tenant_id", tenantId).order("created_at"),
      supabase.from("grade_levels").select("id,code,name").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("staff").select("id,first_name,last_name").eq("tenant_id", tenantId).eq("status", "active"),
      supabase.from("rooms").select("id,name").eq("tenant_id", tenantId),
    ]);
    setRows(c || []); setGrades(g || []); setTeachers(t || []); setRooms(r || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!tenantId || !form.name) return;
    const { error } = await supabase.from("classes").insert({
      tenant_id: tenantId,
      name: form.name,
      grade_level_id: form.grade_level_id || null,
      stream: form.stream || null,
      class_teacher_id: form.class_teacher_id || null,
      room_id: form.room_id || null,
      capacity: parseInt(form.capacity) || 40,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ name: "", grade_level_id: "", stream: "", class_teacher_id: "", room_id: "", capacity: "40" });
    load();
  };
  const remove = async (id: string) => { if (!confirm("Delete class?")) return; await supabase.from("classes").delete().eq("id", id); load(); };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>Classes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-6">
          <Input placeholder="Name (e.g. Grade 7 Blue)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
          <select className="border rounded px-2 py-1 text-sm bg-background" value={form.grade_level_id} onChange={(e) => setForm({ ...form, grade_level_id: e.target.value })}>
            <option value="">Grade…</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
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
        <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add class</Button>
        <div className="grid gap-2 md:grid-cols-2">
          {rows.map((c) => {
            const g = grades.find((x) => x.id === c.grade_level_id);
            const t = teachers.find((x) => x.id === c.class_teacher_id);
            return (
              <div key={c.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {g?.name} {c.stream && `• ${c.stream}`} {t && `• ${t.first_name} ${t.last_name}`} • Capacity {c.capacity}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}