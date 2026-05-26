import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { BedDouble, Plus, Users, ClipboardCheck, LogOut, UserPlus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export default function HostelPage() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BedDouble className="h-6 w-6" /> Hostel / Boarding
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage hostels, bed allocations, roll-calls, visitors and out-passes.
        </p>
      </motion.div>
      {tenantId && (
        <Tabs defaultValue="hostels" className="w-full">
          <TabsList>
            <TabsTrigger value="hostels"><BedDouble className="h-4 w-4 mr-2" />Hostels</TabsTrigger>
            <TabsTrigger value="allocations"><Users className="h-4 w-4 mr-2" />Allocations</TabsTrigger>
            <TabsTrigger value="rollcalls"><ClipboardCheck className="h-4 w-4 mr-2" />Roll Calls</TabsTrigger>
            <TabsTrigger value="visitors"><UserPlus className="h-4 w-4 mr-2" />Visitors</TabsTrigger>
            <TabsTrigger value="outpasses"><LogOut className="h-4 w-4 mr-2" />Out-Passes</TabsTrigger>
          </TabsList>
          <TabsContent value="hostels" className="mt-6"><HostelsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="allocations" className="mt-6"><AllocationsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="rollcalls" className="mt-6"><RollCallsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="visitors" className="mt-6"><VisitorsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="outpasses" className="mt-6"><OutPassesTab tenantId={tenantId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ---------------- Hostels + Rooms + Beds ----------------
function HostelsTab({ tenantId }: { tenantId: string }) {
  const [hostels, setHostels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Record<string, any[]>>({});
  const [beds, setBeds] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", gender: "mixed", capacity: "0", matron_name: "", matron_phone: "" });
  const [roomDialog, setRoomDialog] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState({ room_number: "", floor: "", capacity: "2", room_type: "" });
  const [bedDialog, setBedDialog] = useState<{ hostelId: string; roomId: string } | null>(null);
  const [bedForm, setBedForm] = useState({ count: "2", prefix: "B" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: h } = await supabase.from("hostels").select("*").eq("tenant_id", tenantId).order("name");
    setHostels(h || []);
    if (h?.length) {
      const ids = h.map((x: any) => x.id);
      const { data: r } = await supabase.from("hostel_rooms").select("*").in("hostel_id", ids).order("room_number");
      const rmap: Record<string, any[]> = {};
      (r || []).forEach((rm: any) => { (rmap[rm.hostel_id] = rmap[rm.hostel_id] || []).push(rm); });
      setRooms(rmap);
      if (r?.length) {
        const { data: b } = await supabase.from("hostel_beds").select("*").in("room_id", r.map((x: any) => x.id)).order("bed_label");
        const bmap: Record<string, any[]> = {};
        (b || []).forEach((bd: any) => { (bmap[bd.room_id] = bmap[bd.room_id] || []).push(bd); });
        setBeds(bmap);
      }
    }
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const saveHostel = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("hostels").insert({
      tenant_id: tenantId, name: form.name.trim(), code: form.code || null,
      gender: form.gender as any, capacity: parseInt(form.capacity) || 0,
      matron_name: form.matron_name || null, matron_phone: form.matron_phone || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Hostel created"); setOpen(false);
    setForm({ name: "", code: "", gender: "mixed", capacity: "0", matron_name: "", matron_phone: "" });
    load();
  };
  const saveRoom = async () => {
    if (!roomDialog || !roomForm.room_number.trim()) return toast.error("Room number required");
    const h = hostels.find(x => x.id === roomDialog);
    const { error } = await supabase.from("hostel_rooms").insert({
      tenant_id: tenantId, hostel_id: roomDialog,
      room_number: roomForm.room_number.trim(), floor: roomForm.floor || null,
      capacity: parseInt(roomForm.capacity) || 1, room_type: roomForm.room_type || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Room added"); setRoomDialog(null);
    setRoomForm({ room_number: "", floor: "", capacity: "2", room_type: "" });
    load();
  };
  const saveBeds = async () => {
    if (!bedDialog) return;
    const count = parseInt(bedForm.count) || 0;
    if (count <= 0) return toast.error("Count must be > 0");
    const rows = Array.from({ length: count }).map((_, i) => ({
      tenant_id: tenantId, hostel_id: bedDialog.hostelId, room_id: bedDialog.roomId,
      bed_label: `${bedForm.prefix}${i + 1}`,
    }));
    const { error } = await supabase.from("hostel_beds").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${count} beds added`); setBedDialog(null); load();
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Hostel</Button>
      </div>
      {hostels.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          No hostels yet. Create one to start allocating beds.
        </Card>
      )}
      <div className="grid gap-4">
        {hostels.map((h) => (
          <Card key={h.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {h.name}
                  <Badge variant="outline" className="capitalize">{h.gender}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Capacity {h.capacity} • Matron {h.matron_name || "—"} {h.matron_phone || ""}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setRoomDialog(h.id)}>
                <Plus className="h-4 w-4 mr-1" /> Room
              </Button>
            </div>
            <div className="space-y-2">
              {(rooms[h.id] || []).map((r) => (
                <div key={r.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Room {r.room_number} {r.floor && <span className="text-xs text-muted-foreground">• {r.floor}</span>}</div>
                    <Button size="sm" variant="ghost" onClick={() => setBedDialog({ hostelId: h.id, roomId: r.id })}>
                      <Plus className="h-3 w-3 mr-1" /> Add beds
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(beds[r.id] || []).map((b) => (
                      <Badge key={b.id} variant={b.status === "occupied" ? "default" : "outline"} className="capitalize">
                        {b.bed_label} · {b.status}
                      </Badge>
                    ))}
                    {!(beds[r.id]?.length) && <span className="text-xs text-muted-foreground">No beds</span>}
                  </div>
                </div>
              ))}
              {!(rooms[h.id]?.length) && <p className="text-xs text-muted-foreground">No rooms yet.</p>}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Hostel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
              <div><Label>Matron</Label><Input value={form.matron_name} onChange={(e) => setForm({ ...form, matron_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.matron_phone} onChange={(e) => setForm({ ...form, matron_phone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveHostel}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!roomDialog} onOpenChange={(o) => !o && setRoomDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Room #</Label><Input value={roomForm.room_number} onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })} /></div>
              <div><Label>Floor</Label><Input value={roomForm.floor} onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Capacity</Label><Input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} /></div>
              <div><Label>Type</Label><Input value={roomForm.room_type} onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })} placeholder="dormitory, cubicle..." /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveRoom}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bedDialog} onOpenChange={(o) => !o && setBedDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Beds</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>How many</Label><Input type="number" value={bedForm.count} onChange={(e) => setBedForm({ ...bedForm, count: e.target.value })} /></div>
              <div><Label>Label prefix</Label><Input value={bedForm.prefix} onChange={(e) => setBedForm({ ...bedForm, prefix: e.target.value })} /></div>
            </div>
            <p className="text-xs text-muted-foreground">Will create beds labeled {bedForm.prefix}1, {bedForm.prefix}2, …</p>
          </div>
          <DialogFooter><Button onClick={saveBeds}>Create beds</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Allocations ----------------
function AllocationsTab({ tenantId }: { tenantId: string }) {
  const [hostels, setHostels] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [allocs, setAllocs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignBed, setAssignBed] = useState<any | null>(null);
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    supabase.from("hostels").select("*").eq("tenant_id", tenantId).order("name").then(({ data }) => {
      setHostels(data || []);
      if (data?.[0]) setSelected(data[0].id);
    });
    supabase.from("students").select("id, first_name, last_name, admission_number").eq("tenant_id", tenantId).eq("status", "active").order("first_name").limit(2000).then(({ data }) => {
      setStudents(data || []);
    });
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    const { data: r } = await supabase.from("hostel_rooms").select("*").eq("hostel_id", selected).order("room_number");
    setRooms(r || []);
    const roomIds = (r || []).map((x: any) => x.id);
    const { data: b } = roomIds.length
      ? await supabase.from("hostel_beds").select("*").in("room_id", roomIds).order("bed_label")
      : { data: [] };
    setBeds(b || []);
    const { data: a } = await supabase.from("hostel_allocations").select("*").eq("hostel_id", selected).eq("status", "active");
    setAllocs(a || []);
    setLoading(false);
  }, [selected]);
  useEffect(() => { load(); }, [load]);

  const studentName = (id: string) => {
    const s = students.find(x => x.id === id);
    return s ? `${s.first_name} ${s.last_name} (${s.admission_number})` : "—";
  };
  const bedAlloc = (bedId: string) => allocs.find(a => a.bed_id === bedId);

  const assign = async () => {
    if (!assignBed || !studentId) return toast.error("Pick a student");
    const { error } = await supabase.from("hostel_allocations").insert({
      tenant_id: tenantId, student_id: studentId, bed_id: assignBed.id,
      hostel_id: assignBed.hostel_id, room_id: assignBed.room_id,
    });
    if (error) return toast.error(error.message);
    toast.success("Allocated"); setAssignBed(null); setStudentId(""); load();
  };
  const release = async (allocId: string) => {
    if (!confirm("End this allocation?")) return;
    const { error } = await supabase.from("hostel_allocations").update({ status: "ended", end_date: new Date().toISOString().slice(0, 10) }).eq("id", allocId);
    if (error) return toast.error(error.message);
    toast.success("Released"); load();
  };

  const stats = useMemo(() => {
    const total = beds.length;
    const occ = beds.filter(b => b.status === "occupied").length;
    return { total, occ, free: total - occ };
  }, [beds]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="w-64">
          <Label>Hostel</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {stats.occ}/{stats.total} occupied • {stats.free} free
        </div>
      </div>
      {loading && <Loader2 className="h-6 w-6 animate-spin" />}
      <div className="grid gap-3">
        {rooms.map(r => (
          <Card key={r.id} className="p-4">
            <div className="text-sm font-medium mb-3">Room {r.room_number}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {beds.filter(b => b.room_id === r.id).map(b => {
                const a = bedAlloc(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => a ? release(a.id) : setAssignBed(b)}
                    className={`text-left p-3 rounded-md border transition ${a ? "bg-primary/10 border-primary/40 hover:bg-primary/20" : "bg-muted/30 hover:bg-muted/60 border-dashed"}`}
                  >
                    <div className="text-xs font-medium">{b.bed_label}</div>
                    <div className="text-[10px] text-muted-foreground truncate mt-1">
                      {a ? studentName(a.student_id) : "Empty — click to assign"}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!assignBed} onOpenChange={(o) => !o && setAssignBed(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Bed {assignBed?.bed_label}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Pick a student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.admission_number}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter><Button onClick={assign}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Roll Calls ----------------
function RollCallsTab({ tenantId }: { tenantId: string }) {
  const [hostels, setHostels] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ hostel_id: "", session_type: "morning", session_date: new Date().toISOString().slice(0, 10) });
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [boarders, setBoarders] = useState<any[]>([]);

  const load = useCallback(async () => {
    const { data: h } = await supabase.from("hostels").select("*").eq("tenant_id", tenantId).order("name");
    setHostels(h || []);
    const { data: s } = await supabase.from("hostel_roll_calls").select("*").eq("tenant_id", tenantId).order("started_at", { ascending: false }).limit(50);
    setSessions(s || []);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.hostel_id) return toast.error("Pick a hostel");
    const { data, error } = await supabase.from("hostel_roll_calls").insert({
      tenant_id: tenantId, hostel_id: form.hostel_id, session_type: form.session_type as any, session_date: form.session_date,
    }).select("*").single();
    if (error) return toast.error(error.message);
    toast.success("Roll call started"); setOpen(false); load();
    openSession(data);
  };

  const openSession = async (s: any) => {
    setActiveSession(s);
    const { data: allocs } = await supabase.from("hostel_allocations").select("student_id").eq("hostel_id", s.hostel_id).eq("status", "active");
    const studentIds = (allocs || []).map((a: any) => a.student_id);
    if (!studentIds.length) { setBoarders([]); setEntries([]); return; }
    const { data: st } = await supabase.from("students").select("id, first_name, last_name, admission_number").in("id", studentIds).order("first_name");
    setBoarders(st || []);
    const { data: en } = await supabase.from("hostel_roll_call_entries").select("*").eq("roll_call_id", s.id);
    setEntries(en || []);
  };

  const mark = async (studentId: string, status: string) => {
    if (!activeSession) return;
    const existing = entries.find(e => e.student_id === studentId);
    if (existing) {
      const { error } = await supabase.from("hostel_roll_call_entries").update({ status }).eq("id", existing.id);
      if (error) return toast.error(error.message);
      setEntries(entries.map(e => e.id === existing.id ? { ...e, status } : e));
    } else {
      const { data, error } = await supabase.from("hostel_roll_call_entries").insert({
        tenant_id: tenantId, roll_call_id: activeSession.id, student_id: studentId, status: status as any,
      }).select("*").single();
      if (error) return toast.error(error.message);
      setEntries([...entries, data]);
    }
  };

  const markAllPresent = async () => {
    if (!activeSession || !boarders.length) return;
    const missing = boarders.filter(b => !entries.find(e => e.student_id === b.id));
    if (!missing.length) return toast.info("All already marked");
    const rows = missing.map(b => ({ tenant_id: tenantId, roll_call_id: activeSession.id, student_id: b.id, status: "present" as any }));
    const { data, error } = await supabase.from("hostel_roll_call_entries").insert(rows).select("*");
    if (error) return toast.error(error.message);
    setEntries([...entries, ...(data || [])]);
    toast.success(`${missing.length} marked present`);
  };

  const endSession = async () => {
    if (!activeSession) return;
    await supabase.from("hostel_roll_calls").update({ ended_at: new Date().toISOString() }).eq("id", activeSession.id);
    setActiveSession(null); load();
  };

  if (activeSession) {
    const counts = entries.reduce((acc: any, e: any) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {});
    const unaccounted = boarders.length - entries.length;
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold capitalize">
              {activeSession.session_type.replace("_", " ")} roll call — {activeSession.session_date}
            </div>
            <div className="text-xs text-muted-foreground">
              Present {counts.present || 0} • Absent {counts.absent || 0} • Sick {counts.sick || 0} • Out-pass {counts.out_pass || 0} • Unmarked {unaccounted}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllPresent}><CheckCircle2 className="h-4 w-4 mr-1" />All present</Button>
            <Button onClick={endSession}>End session</Button>
          </div>
        </div>
        <div className="divide-y">
          {boarders.map(b => {
            const e = entries.find(x => x.student_id === b.id);
            return (
              <div key={b.id} className="py-2 flex items-center justify-between">
                <div className="text-sm">{b.first_name} {b.last_name} <span className="text-xs text-muted-foreground">· {b.admission_number}</span></div>
                <div className="flex gap-1">
                  {(["present","absent","sick","out_pass","unaccounted"] as const).map(s => (
                    <Button key={s} size="sm" variant={e?.status === s ? "default" : "outline"} onClick={() => mark(b.id, s)} className="text-xs capitalize">
                      {s.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
          {!boarders.length && <p className="text-sm text-muted-foreground py-4">No active allocations in this hostel.</p>}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Roll Call</Button>
      </div>
      <div className="grid gap-2">
        {sessions.map(s => (
          <Card key={s.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium capitalize">{s.session_type.replace("_", " ")} • {s.session_date}</div>
              <div className="text-xs text-muted-foreground">
                {hostels.find(h => h.id === s.hostel_id)?.name} • {s.ended_at ? "Ended" : "In progress"}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => openSession(s)}>Open</Button>
          </Card>
        ))}
        {!sessions.length && <Card className="p-12 text-center text-muted-foreground">No roll calls yet.</Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Start Roll Call</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Hostel</Label>
              <Select value={form.hostel_id} onValueChange={(v) => setForm({ ...form, hostel_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.session_type} onValueChange={(v) => setForm({ ...form, session_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="lights_out">Lights out</SelectItem>
                    <SelectItem value="weekend">Weekend</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={create}>Start</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Visitors ----------------
function VisitorsTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ visitor_name: "", visitor_phone: "", visitor_id_number: "", relationship: "", purpose: "", student_id: "" });

  const load = useCallback(async () => {
    const { data } = await supabase.from("hostel_visitors").select("*").eq("tenant_id", tenantId).order("checked_in_at", { ascending: false }).limit(100);
    setRows(data || []);
  }, [tenantId]);
  useEffect(() => {
    load();
    supabase.from("students").select("id, first_name, last_name, admission_number").eq("tenant_id", tenantId).limit(2000).then(({ data }) => setStudents(data || []));
  }, [tenantId, load]);

  const checkIn = async () => {
    if (!form.visitor_name.trim()) return toast.error("Visitor name required");
    const { error } = await supabase.from("hostel_visitors").insert({
      tenant_id: tenantId, visitor_name: form.visitor_name.trim(), visitor_phone: form.visitor_phone || null,
      visitor_id_number: form.visitor_id_number || null, relationship: form.relationship || null,
      purpose: form.purpose || null, student_id: form.student_id || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Checked in"); setOpen(false);
    setForm({ visitor_name: "", visitor_phone: "", visitor_id_number: "", relationship: "", purpose: "", student_id: "" });
    load();
  };
  const checkOut = async (id: string) => {
    const { error } = await supabase.from("hostel_visitors").update({ checked_out_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const sName = (id?: string) => {
    if (!id) return "—";
    const s = students.find(x => x.id === id);
    return s ? `${s.first_name} ${s.last_name}` : "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Check-in Visitor</Button>
      </div>
      <div className="grid gap-2">
        {rows.map(v => (
          <Card key={v.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{v.visitor_name} <span className="text-xs text-muted-foreground">{v.relationship && `· ${v.relationship}`}</span></div>
              <div className="text-xs text-muted-foreground">
                Visiting {sName(v.student_id)} • In {new Date(v.checked_in_at).toLocaleString()}
                {v.checked_out_at && ` • Out ${new Date(v.checked_out_at).toLocaleString()}`}
              </div>
              {v.purpose && <div className="text-xs text-muted-foreground mt-1">{v.purpose}</div>}
            </div>
            {!v.checked_out_at && <Button size="sm" variant="outline" onClick={() => checkOut(v.id)}>Check out</Button>}
          </Card>
        ))}
        {!rows.length && <Card className="p-12 text-center text-muted-foreground">No visitors yet.</Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Visitor</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.visitor_phone} onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>ID number</Label><Input value={form.visitor_id_number} onChange={(e) => setForm({ ...form, visitor_id_number: e.target.value })} /></div>
              <div><Label>Relationship</Label><Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} /></div>
            </div>
            <div><Label>Visiting student</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.admission_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Purpose</Label><Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={checkIn}>Check in</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------- Out-Passes ----------------
function OutPassesTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", reason: "", destination: "", leave_at: "", expected_return_at: "" });

  const load = useCallback(async () => {
    const { data } = await supabase.from("hostel_out_passes").select("*").eq("tenant_id", tenantId).order("requested_at", { ascending: false }).limit(100);
    setRows(data || []);
  }, [tenantId]);
  useEffect(() => {
    load();
    supabase.from("students").select("id, first_name, last_name, admission_number").eq("tenant_id", tenantId).limit(2000).then(({ data }) => setStudents(data || []));
  }, [tenantId, load]);

  const create = async () => {
    if (!form.student_id || !form.reason.trim() || !form.leave_at || !form.expected_return_at) return toast.error("Fill required fields");
    const { error } = await supabase.from("hostel_out_passes").insert({
      tenant_id: tenantId, student_id: form.student_id, reason: form.reason.trim(),
      destination: form.destination || null, leave_at: form.leave_at, expected_return_at: form.expected_return_at,
      status: "requested" as any,
    });
    if (error) return toast.error(error.message);
    toast.success("Out-pass requested"); setOpen(false);
    setForm({ student_id: "", reason: "", destination: "", leave_at: "", expected_return_at: "" });
    load();
  };

  const setStatus = async (id: string, patch: any) => {
    const { error } = await supabase.from("hostel_out_passes").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const sName = (id: string) => {
    const s = students.find(x => x.id === id);
    return s ? `${s.first_name} ${s.last_name} · ${s.admission_number}` : id;
  };

  const statusVariant = (s: string): any => {
    if (["approved", "guardian_approved", "checked_out", "returned"].includes(s)) return "default";
    if (["denied", "guardian_denied", "cancelled", "overdue"].includes(s)) return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Out-Pass</Button>
      </div>
      <div className="grid gap-2">
        {rows.map(p => (
          <Card key={p.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">{sName(p.student_id)}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.leave_at).toLocaleString()} → {new Date(p.expected_return_at).toLocaleString()}
                  {p.destination && ` • ${p.destination}`}
                </div>
                <div className="text-xs mt-1">{p.reason}</div>
              </div>
              <Badge variant={statusVariant(p.status)} className="capitalize">{p.status.replace(/_/g, " ")}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {p.status === "requested" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setStatus(p.id, { status: "approved", approved_at: new Date().toISOString() })}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(p.id, { status: "denied" })}>
                    <XCircle className="h-3 w-3 mr-1" />Deny
                  </Button>
                </>
              )}
              {["approved", "guardian_approved"].includes(p.status) && (
                <Button size="sm" onClick={() => setStatus(p.id, { status: "checked_out", checked_out_at: new Date().toISOString() })}>
                  Log check-out
                </Button>
              )}
              {p.status === "checked_out" && (
                <Button size="sm" onClick={() => setStatus(p.id, { status: "returned", returned_at: new Date().toISOString() })}>
                  Log return
                </Button>
              )}
            </div>
          </Card>
        ))}
        {!rows.length && <Card className="p-12 text-center text-muted-foreground">No out-passes yet.</Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Out-Pass</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Student</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.admission_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Leave at</Label><Input type="datetime-local" value={form.leave_at} onChange={(e) => setForm({ ...form, leave_at: e.target.value })} /></div>
              <div><Label>Return by</Label><Input type="datetime-local" value={form.expected_return_at} onChange={(e) => setForm({ ...form, expected_return_at: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={create}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}