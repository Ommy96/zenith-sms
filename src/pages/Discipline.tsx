import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Award, Plus, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

const SEVERITY_LABELS = ["", "Minor", "Low", "Moderate", "Serious", "Severe"];
const sevColor = (s: number) =>
  s >= 4 ? "bg-destructive/10 text-destructive border-destructive/20"
  : s === 3 ? "bg-warning/10 text-warning border-warning/20"
  : "bg-muted text-muted-foreground border-border";

export default function Discipline() {
  const { currentTenant } = useTenant();
  const tenantId = currentTenant?.id;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Discipline & Behaviour</h1>
        <p className="text-sm text-muted-foreground mt-1">Track incidents, actions, and award merit points.</p>
      </motion.div>
      {tenantId && (
        <Tabs defaultValue="incidents" className="w-full">
          <TabsList>
            <TabsTrigger value="incidents"><ShieldAlert className="h-4 w-4 mr-2" />Incidents</TabsTrigger>
            <TabsTrigger value="merits"><Award className="h-4 w-4 mr-2" />Merit Points</TabsTrigger>
          </TabsList>
          <TabsContent value="incidents" className="mt-6"><IncidentsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="merits" className="mt-6"><MeritsTab tenantId={tenantId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function IncidentsTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: "", incident_date: new Date().toISOString().slice(0, 10),
    category: "misconduct", severity: "1", location: "", description: "", witnesses: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("discipline_incidents").select("*, students(first_name,last_name,admission_number)")
        .eq("tenant_id", tenantId).order("incident_date", { ascending: false }).limit(100),
      supabase.from("students").select("id,first_name,last_name,admission_number")
        .eq("tenant_id", tenantId).eq("status", "active").order("first_name").limit(500),
    ]);
    setItems(a.data || []);
    setStudents(b.data || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.student_id || !form.description.trim()) {
      toast.error("Student and description are required"); return;
    }
    setSaving(true);
    const { error } = await supabase.from("discipline_incidents").insert({
      tenant_id: tenantId,
      student_id: form.student_id,
      incident_date: form.incident_date,
      category: form.category,
      severity: parseInt(form.severity),
      location: form.location || null,
      description: form.description.trim(),
      witnesses: form.witnesses || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(parseInt(form.severity) >= 3 ? "Logged. Guardian will be notified." : "Incident logged");
    setOpen(false);
    setForm({ student_id: "", incident_date: new Date().toISOString().slice(0, 10), category: "misconduct", severity: "1", location: "", description: "", witnesses: "" });
    load();
  };

  const resolve = async (id: string) => {
    const { error } = await supabase.from("discipline_incidents")
      .update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Incident resolved"); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} recent incidents</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Incident</Button>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        : items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No incidents logged yet.</Card>
        ) : (
          <div className="space-y-2">
            {items.map(i => (
              <Card key={i.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{i.students?.first_name} {i.students?.last_name}</span>
                    <span className="text-xs text-muted-foreground">{i.students?.admission_number}</span>
                    <Badge variant="outline" className={sevColor(i.severity)}>
                      Sev {i.severity} · {SEVERITY_LABELS[i.severity]}
                    </Badge>
                    <Badge variant="outline">{i.category}</Badge>
                    {i.status === "resolved" && <Badge variant="outline" className="bg-success/10 text-success border-success/20">Resolved</Badge>}
                    {i.severity >= 3 && i.notify_status === "sent" && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Guardian notified</Badge>
                    )}
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">{i.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(i.incident_date).toLocaleDateString()}{i.location ? ` · ${i.location}` : ""}
                  </p>
                </div>
                {i.status !== "resolved" && (
                  <Button size="sm" variant="outline" onClick={() => resolve(i.id)}>Resolve</Button>
                )}
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Log Discipline Incident</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label className="text-xs">Student *</Label>
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date</Label>
                <Input type="date" value={form.incident_date} onChange={e => setForm({ ...form, incident_date: e.target.value })} />
              </div>
              <div><Label className="text-xs">Location</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Classroom, dorm…" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="misconduct">Misconduct</SelectItem>
                    <SelectItem value="fighting">Fighting</SelectItem>
                    <SelectItem value="bullying">Bullying</SelectItem>
                    <SelectItem value="absenteeism">Absenteeism</SelectItem>
                    <SelectItem value="dishonesty">Dishonesty</SelectItem>
                    <SelectItem value="property_damage">Property damage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} — {SEVERITY_LABELS[n]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {parseInt(form.severity) >= 3 && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md text-xs">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <span>Guardian will be automatically notified via WhatsApp/SMS.</span>
              </div>
            )}
            <div><Label className="text-xs">Description *</Label>
              <Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div><Label className="text-xs">Witnesses</Label>
              <Input value={form.witnesses} onChange={e => setForm({ ...form, witnesses: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Log Incident"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MeritsTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_id: "", points: "5", category: "general", reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      supabase.from("merit_points").select("*, students(first_name,last_name,admission_number)")
        .eq("tenant_id", tenantId).order("awarded_date", { ascending: false }).limit(100),
      supabase.from("students").select("id,first_name,last_name,admission_number")
        .eq("tenant_id", tenantId).eq("status", "active").order("first_name").limit(500),
    ]);
    setItems(a.data || []); setStudents(b.data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.student_id || !form.reason.trim()) { toast.error("Student and reason required"); return; }
    setSaving(true);
    const { error } = await supabase.from("merit_points").insert({
      tenant_id: tenantId, student_id: form.student_id,
      points: parseInt(form.points), category: form.category, reason: form.reason.trim(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Merit points awarded");
    setOpen(false); setForm({ student_id: "", points: "5", category: "general", reason: "" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} recent awards</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Award Points</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        : items.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">No merit points awarded yet.</Card>
        ) : (
          <div className="space-y-2">
            {items.map(i => (
              <Card key={i.id} className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-success/10 text-success flex items-center justify-center font-semibold">
                  +{i.points}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{i.students?.first_name} {i.students?.last_name}</span>
                    <Badge variant="outline">{i.category}</Badge>
                  </div>
                  <p className="text-sm mt-1">{i.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(i.awarded_date).toLocaleDateString()}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Award Merit Points</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Student *</Label>
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Points</Label>
                <Input type="number" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} />
              </div>
              <div><Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="kindness">Kindness</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Reason *</Label>
              <Textarea rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Award"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}