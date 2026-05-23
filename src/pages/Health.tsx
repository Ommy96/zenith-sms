import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Pill, Syringe, AlertOctagon, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export default function Health() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Health & Wellness</h1>
        <p className="text-sm text-muted-foreground mt-1">School nurse logs, medications, immunizations, and accident reports.</p>
      </motion.div>
      {tenantId && (
        <Tabs defaultValue="visits">
          <TabsList>
            <TabsTrigger value="visits"><HeartPulse className="h-4 w-4 mr-2" />Sick Bay</TabsTrigger>
            <TabsTrigger value="meds"><Pill className="h-4 w-4 mr-2" />Medications</TabsTrigger>
            <TabsTrigger value="immun"><Syringe className="h-4 w-4 mr-2" />Immunizations</TabsTrigger>
            <TabsTrigger value="accidents"><AlertOctagon className="h-4 w-4 mr-2" />Accidents</TabsTrigger>
          </TabsList>
          <TabsContent value="visits" className="mt-6"><VisitsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="meds" className="mt-6"><MedsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="immun" className="mt-6"><ImmunTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="accidents" className="mt-6"><AccidentsTab tenantId={tenantId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function useStudents(tenantId: string) {
  const [students, setStudents] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("students").select("id,first_name,last_name,admission_number")
      .eq("tenant_id", tenantId).eq("status", "active").order("first_name").limit(500)
      .then(({ data }) => setStudents(data || []));
  }, [tenantId]);
  return students;
}

function StudentSelect({ students, value, onChange }: { students: any[]; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
      <SelectContent>
        {students.map(s => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function VisitsTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const students = useStudents(tenantId);
  const [f, setF] = useState({ student_id: "", complaint: "", diagnosis: "", treatment: "", temperature: "", sent_home: false });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("health_visits")
      .select("*, students(first_name,last_name,admission_number)")
      .eq("tenant_id", tenantId).order("visit_date", { ascending: false }).limit(100);
    setItems(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!f.student_id || !f.complaint.trim()) return toast.error("Student and complaint required");
    setSaving(true);
    const { error } = await supabase.from("health_visits").insert({
      tenant_id: tenantId, student_id: f.student_id,
      complaint: f.complaint, diagnosis: f.diagnosis || null, treatment: f.treatment || null,
      temperature: f.temperature ? parseFloat(f.temperature) : null, sent_home: f.sent_home,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Visit logged");
    setOpen(false); setF({ student_id: "", complaint: "", diagnosis: "", treatment: "", temperature: "", sent_home: false }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} recent visits</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New Visit</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        : items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No visits logged.</Card>
        : (
          <div className="space-y-2">
            {items.map(v => (
              <Card key={v.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-medium">{v.students?.first_name} {v.students?.last_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{new Date(v.visit_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    {v.temperature && <Badge variant="outline">{v.temperature}°C</Badge>}
                    {v.sent_home && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Sent home</Badge>}
                  </div>
                </div>
                <p className="text-sm mt-2"><span className="text-muted-foreground">Complaint:</span> {v.complaint}</p>
                {v.diagnosis && <p className="text-sm"><span className="text-muted-foreground">Diagnosis:</span> {v.diagnosis}</p>}
                {v.treatment && <p className="text-sm"><span className="text-muted-foreground">Treatment:</span> {v.treatment}</p>}
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Log Sick Bay Visit</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Student *</Label><StudentSelect students={students} value={f.student_id} onChange={v => setF({ ...f, student_id: v })} /></div>
            <div><Label className="text-xs">Complaint *</Label><Textarea rows={2} value={f.complaint} onChange={e => setF({ ...f, complaint: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Diagnosis</Label><Input value={f.diagnosis} onChange={e => setF({ ...f, diagnosis: e.target.value })} /></div>
              <div><Label className="text-xs">Temperature (°C)</Label><Input type="number" step="0.1" value={f.temperature} onChange={e => setF({ ...f, temperature: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Treatment</Label><Textarea rows={2} value={f.treatment} onChange={e => setF({ ...f, treatment: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Checkbox id="sent" checked={f.sent_home} onCheckedChange={v => setF({ ...f, sent_home: !!v })} />
              <Label htmlFor="sent" className="text-sm">Sent home</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Log Visit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MedsTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const students = useStudents(tenantId);
  const [f, setF] = useState({ student_id: "", medication_name: "", dose: "", reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("medication_administration")
      .select("*, students(first_name,last_name)").eq("tenant_id", tenantId)
      .order("administered_at", { ascending: false }).limit(100);
    setItems(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!f.student_id || !f.medication_name.trim()) return toast.error("Student and medication required");
    setSaving(true);
    const { error } = await supabase.from("medication_administration").insert({
      tenant_id: tenantId, student_id: f.student_id,
      medication_name: f.medication_name, dose: f.dose || null, reason: f.reason || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Medication logged");
    setOpen(false); setF({ student_id: "", medication_name: "", dose: "", reason: "" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} administrations</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Medication</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        : items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No medications logged.</Card>
        : (
          <div className="space-y-2">
            {items.map(m => (
              <Card key={m.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{m.students?.first_name} {m.students?.last_name}</div>
                  <p className="text-sm">{m.medication_name}{m.dose ? ` · ${m.dose}` : ""}</p>
                  {m.reason && <p className="text-xs text-muted-foreground">{m.reason}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(m.administered_at).toLocaleString()}</span>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Medication</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Student *</Label><StudentSelect students={students} value={f.student_id} onChange={v => setF({ ...f, student_id: v })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Medication *</Label><Input value={f.medication_name} onChange={e => setF({ ...f, medication_name: e.target.value })} /></div>
              <div><Label className="text-xs">Dose</Label><Input value={f.dose} onChange={e => setF({ ...f, dose: e.target.value })} placeholder="500mg" /></div>
            </div>
            <div><Label className="text-xs">Reason</Label><Input value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImmunTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const students = useStudents(tenantId);
  const [f, setF] = useState({ student_id: "", vaccine_name: "", date_given: new Date().toISOString().slice(0, 10), dose_number: "", next_due_date: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("immunization_records")
      .select("*, students(first_name,last_name)").eq("tenant_id", tenantId)
      .order("date_given", { ascending: false }).limit(100);
    setItems(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!f.student_id || !f.vaccine_name.trim()) return toast.error("Student and vaccine required");
    setSaving(true);
    const { error } = await supabase.from("immunization_records").insert({
      tenant_id: tenantId, student_id: f.student_id,
      vaccine_name: f.vaccine_name, date_given: f.date_given,
      dose_number: f.dose_number ? parseInt(f.dose_number) : null,
      next_due_date: f.next_due_date || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Record added");
    setOpen(false); setF({ student_id: "", vaccine_name: "", date_given: new Date().toISOString().slice(0, 10), dose_number: "", next_due_date: "" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} records</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Record</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        : items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No immunization records yet.</Card>
        : (
          <div className="space-y-2">
            {items.map(i => (
              <Card key={i.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{i.students?.first_name} {i.students?.last_name}</div>
                  <p className="text-sm">{i.vaccine_name}{i.dose_number ? ` · dose ${i.dose_number}` : ""}</p>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  Given {new Date(i.date_given).toLocaleDateString()}
                  {i.next_due_date && <div>Next: {new Date(i.next_due_date).toLocaleDateString()}</div>}
                </div>
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Immunization Record</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Student *</Label><StudentSelect students={students} value={f.student_id} onChange={v => setF({ ...f, student_id: v })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Vaccine *</Label><Input value={f.vaccine_name} onChange={e => setF({ ...f, vaccine_name: e.target.value })} /></div>
              <div><Label className="text-xs">Dose #</Label><Input type="number" value={f.dose_number} onChange={e => setF({ ...f, dose_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date Given</Label><Input type="date" value={f.date_given} onChange={e => setF({ ...f, date_given: e.target.value })} /></div>
              <div><Label className="text-xs">Next Due</Label><Input type="date" value={f.next_due_date} onChange={e => setF({ ...f, next_due_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccidentsTab({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const students = useStudents(tenantId);
  const [f, setF] = useState({ student_id: "", incident_date: new Date().toISOString().slice(0, 10), location: "", description: "", injury_type: "", severity: "minor", first_aid_given: "", hospital_referred: false });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("accident_reports")
      .select("*, students(first_name,last_name)").eq("tenant_id", tenantId)
      .order("incident_date", { ascending: false }).limit(100);
    setItems(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!f.student_id || !f.description.trim()) return toast.error("Student and description required");
    setSaving(true);
    const { error } = await supabase.from("accident_reports").insert({
      tenant_id: tenantId, student_id: f.student_id,
      incident_date: f.incident_date, location: f.location || null,
      description: f.description, injury_type: f.injury_type || null,
      severity: f.severity, first_aid_given: f.first_aid_given || null,
      hospital_referred: f.hospital_referred,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Report filed");
    setOpen(false); setF({ student_id: "", incident_date: new Date().toISOString().slice(0, 10), location: "", description: "", injury_type: "", severity: "minor", first_aid_given: "", hospital_referred: false }); load();
  };

  const sevColor = (s: string) => s === "severe" ? "bg-destructive/10 text-destructive border-destructive/20"
    : s === "moderate" ? "bg-warning/10 text-warning border-warning/20" : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{items.length} reports</div>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />File Report</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        : items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No accident reports.</Card>
        : (
          <div className="space-y-2">
            {items.map(a => (
              <Card key={a.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-medium">{a.students?.first_name} {a.students?.last_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{new Date(a.incident_date).toLocaleDateString()}{a.location ? ` · ${a.location}` : ""}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={sevColor(a.severity)}>{a.severity}</Badge>
                    {a.hospital_referred && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Hospital</Badge>}
                  </div>
                </div>
                <p className="text-sm mt-2">{a.description}</p>
                {a.first_aid_given && <p className="text-xs text-muted-foreground mt-1">First aid: {a.first_aid_given}</p>}
              </Card>
            ))}
          </div>
        )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Accident Report</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Student *</Label><StudentSelect students={students} value={f.student_id} onChange={v => setF({ ...f, student_id: v })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Date</Label><Input type="date" value={f.incident_date} onChange={e => setF({ ...f, incident_date: e.target.value })} /></div>
              <div><Label className="text-xs">Location</Label><Input value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Description *</Label><Textarea rows={3} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Injury Type</Label><Input value={f.injury_type} onChange={e => setF({ ...f, injury_type: e.target.value })} /></div>
              <div><Label className="text-xs">Severity</Label>
                <Select value={f.severity} onValueChange={v => setF({ ...f, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">First Aid Given</Label><Textarea rows={2} value={f.first_aid_given} onChange={e => setF({ ...f, first_aid_given: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Checkbox id="hosp" checked={f.hospital_referred} onCheckedChange={v => setF({ ...f, hospital_referred: !!v })} />
              <Label htmlFor="hosp" className="text-sm">Referred to hospital</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "File Report"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}