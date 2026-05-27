import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarX2, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = { tenantId: string; teachers: any[]; periods: any[] };

export function TeacherUnavailabilityPanel({ tenantId, teachers, periods }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ teacher_id: "", day_of_week: 1, period_id: "", reason: "" });

  const load = async () => {
    const { data } = await supabase
      .from("teacher_unavailability")
      .select("id, teacher_id, day_of_week, period_id, reason")
      .eq("tenant_id", tenantId)
      .order("day_of_week");
    setRows(data || []);
  };
  useEffect(() => { if (tenantId) load(); /* eslint-disable-next-line */ }, [tenantId]);

  const add = async () => {
    if (!form.teacher_id) return;
    const { error } = await supabase.from("teacher_unavailability").insert({
      tenant_id: tenantId,
      teacher_id: form.teacher_id,
      day_of_week: form.day_of_week,
      period_id: form.period_id || null,
      reason: form.reason || null,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ teacher_id: "", day_of_week: 1, period_id: "", reason: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("teacher_unavailability").delete().eq("id", id);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarX2 className="h-4 w-4 text-primary" />Teacher unavailability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-5">
          <select className="border rounded px-2 py-2 text-sm bg-background" value={form.teacher_id}
            onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}>
            <option value="">Teacher…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
          </select>
          <select className="border rounded px-2 py-2 text-sm bg-background" value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}
          </select>
          <select className="border rounded px-2 py-2 text-sm bg-background" value={form.period_id}
            onChange={(e) => setForm({ ...form, period_id: e.target.value })}>
            <option value="">Whole day</option>
            {periods.filter((p) => p.day_of_week === form.day_of_week).map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.start_time?.slice(0, 5)})</option>
            ))}
          </select>
          <Input placeholder="Reason (optional)" value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
        {rows.length === 0 ? (
          <div className="text-xs text-muted-foreground">No restrictions set.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rows.map((r) => {
              const t = teachers.find((x) => x.id === r.teacher_id);
              const p = periods.find((x) => x.id === r.period_id);
              return (
                <Badge key={r.id} variant="secondary" className="gap-1">
                  {t ? `${t.first_name} ${t.last_name}` : "Teacher"} · {DAYS[r.day_of_week]} · {p ? p.name : "all day"}
                  <button onClick={() => remove(r.id)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}