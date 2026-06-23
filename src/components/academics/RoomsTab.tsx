import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Trash2, Users } from "lucide-react";

const TYPES = ["classroom", "lab", "library", "hall", "office", "sports", "staffroom", "other"];
const TYPE_ORDER: Record<string, number> = { classroom: 1, lab: 2, library: 3, hall: 4, sports: 5, office: 6, staffroom: 7, other: 99 };

export function RoomsTab() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const [rows, setRows] = useState<any[]>([]);
  const [classesByRoom, setClassesByRoom] = useState<Record<string, any[]>>({});
  const [slotsByRoom, setSlotsByRoom] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "classroom", capacity: "" });
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: r }, { data: cls }, { data: slots }] = await Promise.all([
      supabase.from("rooms").select("*").eq("tenant_id", tenantId),
      supabase.from("classes").select("id,name,room_id").eq("tenant_id", tenantId),
      supabase.from("timetable_slots").select("room_id").eq("tenant_id", tenantId),
    ]);
    setRows(r || []);
    const byRoom: Record<string, any[]> = {};
    (cls || []).forEach((c: any) => { if (c.room_id) (byRoom[c.room_id] ??= []).push(c); });
    setClassesByRoom(byRoom);
    const sc: Record<string, number> = {};
    (slots || []).forEach((s: any) => { if (s.room_id) sc[s.room_id] = (sc[s.room_id] || 0) + 1; });
    setSlotsByRoom(sc);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!tenantId) return toast({ title: "No school selected", variant: "destructive" });
    if (!form.name.trim()) return toast({ title: "Missing name", variant: "destructive" });
    if (rows.some((r) => r.name.toLowerCase() === form.name.toLowerCase()))
      return toast({ title: "Duplicate", description: `Room "${form.name}" already exists.`, variant: "destructive" });
    const { error } = await supabase.from("rooms").insert({
      tenant_id: tenantId, name: form.name.trim(), type: form.type as any,
      capacity: form.capacity ? parseInt(form.capacity) : null,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Room added", description: form.name });
    setForm({ name: "", type: "classroom", capacity: "" });
    load();
  };

  const remove = async (id: string) => {
    const slots = slotsByRoom[id] || 0;
    if (slots > 0) return toast({ title: "Cannot delete", description: `${slots} timetable slot${slots === 1 ? "" : "s"} use this room. Reassign them before deleting.`, variant: "destructive" });
    if ((classesByRoom[id]?.length || 0) > 0) return toast({ title: "Cannot delete", description: `${classesByRoom[id].length} class(es) assigned to this room.`, variant: "destructive" });
    if (!confirm("Delete room?")) return;
    await supabase.from("rooms").delete().eq("id", id);
    toast({ title: "Room deleted" });
    load();
  };

  const filtered = useMemo(() => {
    const list = filter === "all" ? rows : rows.filter((r) => r.type === filter);
    return [...list].sort((a, b) => {
      const ao = TYPE_ORDER[a.type] ?? 99, bo = TYPE_ORDER[b.type] ?? 99;
      if (ao !== bo) return ao - bo;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [rows, filter]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalCap = 0;
    rows.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; totalCap += r.capacity || 0; });
    return { total: rows.length, counts, totalCap };
  }, [rows]);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle>Rooms</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-4">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
          <select className="border rounded px-2 py-1 text-sm bg-background" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Input placeholder="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </div>
        <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1" />Add room</Button>

        {rows.length === 0 ? (
          <div className="text-center py-10 border rounded-lg border-dashed">
            <p className="text-sm font-medium">Add rooms so you can assign classes and book facilities for events.</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground border-l-2 border-primary pl-3 py-1">
              {summary.total} room{summary.total === 1 ? "" : "s"}
              {Object.entries(summary.counts).map(([t, n]) => ` · ${n} ${t}${n === 1 ? "" : "s"}`).join("")}
              {summary.totalCap > 0 && ` · Total capacity: ${summary.totalCap} seats`}
            </div>
            <div className="flex gap-1 text-xs flex-wrap">
              {["all", ...TYPES].map((t) => (
                <button key={t} onClick={() => setFilter(t)} className={`px-2 py-1 rounded border ${filter === t ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => {
                const cls = classesByRoom[r.id] || [];
                return (
                  <div key={r.id} className="rounded-lg border p-3 bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{r.name}</div>
                        <div className="flex items-center gap-1.5 text-xs mt-1">
                          <Badge variant="outline">{r.type}</Badge>
                          {r.capacity && <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{r.capacity}</span>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cls.length > 0 ? <span>Class: {cls.map((c: any) => c.name).join(", ")}</span> : <span className="italic">No class assigned</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}