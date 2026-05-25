import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Bus, Plus, Users, Truck, MapPin, ClipboardList, AlertTriangle, Loader2, Play, CheckCircle2 } from "lucide-react";
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

export default function Transport() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Bus className="h-6 w-6" /> Transport</h1>
        <p className="text-sm text-muted-foreground mt-1">Routes, vehicles, drivers, trips and incidents.</p>
      </motion.div>
      {tenantId && (
        <Tabs defaultValue="routes" className="w-full">
          <TabsList>
            <TabsTrigger value="routes"><MapPin className="h-4 w-4 mr-2" />Routes</TabsTrigger>
            <TabsTrigger value="vehicles"><Truck className="h-4 w-4 mr-2" />Vehicles</TabsTrigger>
            <TabsTrigger value="drivers"><Users className="h-4 w-4 mr-2" />Drivers</TabsTrigger>
            <TabsTrigger value="subscriptions"><ClipboardList className="h-4 w-4 mr-2" />Subscriptions</TabsTrigger>
            <TabsTrigger value="trips"><Play className="h-4 w-4 mr-2" />Trips</TabsTrigger>
            <TabsTrigger value="incidents"><AlertTriangle className="h-4 w-4 mr-2" />Incidents</TabsTrigger>
          </TabsList>
          <TabsContent value="routes" className="mt-6"><RoutesTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="vehicles" className="mt-6"><VehiclesTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="drivers" className="mt-6"><DriversTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="subscriptions" className="mt-6"><SubscriptionsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="trips" className="mt-6"><TripsTab tenantId={tenantId} /></TabsContent>
          <TabsContent value="incidents" className="mt-6"><IncidentsTab tenantId={tenantId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function RoutesTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "", am_start_time: "06:30", pm_start_time: "16:00", capacity: "30", fare_per_term: "0" });
  const [stops, setStops] = useState<Record<string, any[]>>({});
  const [stopDialog, setStopDialog] = useState<string | null>(null);
  const [stopForm, setStopForm] = useState({ name: "", am_pickup_time: "", pm_dropoff_time: "", landmark: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("transport_routes").select("*").eq("tenant_id", tenantId).order("name");
    setRows(data || []);
    if (data?.length) {
      const { data: s } = await supabase.from("transport_stops").select("*").in("route_id", data.map((r: any) => r.id)).order("sort_order");
      const map: Record<string, any[]> = {};
      (s || []).forEach((st: any) => { (map[st.route_id] = map[st.route_id] || []).push(st); });
      setStops(map);
    }
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("transport_routes").insert({
      tenant_id: tenantId, name: form.name.trim(), code: form.code || null,
      description: form.description || null,
      am_start_time: form.am_start_time || null, pm_start_time: form.pm_start_time || null,
      capacity: parseInt(form.capacity) || 0, fare_per_term: parseFloat(form.fare_per_term) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Route created"); setOpen(false);
    setForm({ code: "", name: "", description: "", am_start_time: "06:30", pm_start_time: "16:00", capacity: "30", fare_per_term: "0" });
    load();
  };

  const addStop = async () => {
    if (!stopDialog || !stopForm.name.trim()) return toast.error("Stop name required");
    const currentStops = stops[stopDialog] || [];
    const { error } = await supabase.from("transport_stops").insert({
      tenant_id: tenantId, route_id: stopDialog, name: stopForm.name.trim(),
      am_pickup_time: stopForm.am_pickup_time || null, pm_dropoff_time: stopForm.pm_dropoff_time || null,
      landmark: stopForm.landmark || null, sort_order: currentStops.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Stop added"); setStopDialog(null);
    setStopForm({ name: "", am_pickup_time: "", pm_dropoff_time: "", landmark: "" });
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Bus Routes</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Route</Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No routes yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map(r => (
            <div key={r.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.name}</span>
                    {r.code && <Badge variant="outline">{r.code}</Badge>}
                    <Badge variant={r.is_active === false ? "secondary" : "default"}>{r.is_active === false ? "inactive" : "active"}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    AM {r.am_start_time || "—"} · PM {r.pm_start_time || "—"} · Capacity {r.capacity || 0} · Fare/term {r.fare_per_term || 0}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setStopDialog(r.id)}><Plus className="h-3 w-3 mr-1" />Stop</Button>
              </div>
              {stops[r.id]?.length ? (
                <div className="mt-3 pl-4 border-l-2 space-y-1">
                  {stops[r.id].map((s, i) => (
                    <div key={s.id} className="text-xs flex gap-3">
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">{s.am_pickup_time || "—"} / {s.pm_dropoff_time || "—"}</span>
                      {s.landmark && <span className="text-muted-foreground italic">({s.landmark})</span>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground mt-2 pl-4">No stops defined.</p>}
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Route</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="R-01" /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
            <div><Label>AM start</Label><Input type="time" value={form.am_start_time} onChange={e => setForm({ ...form, am_start_time: e.target.value })} /></div>
            <div><Label>PM start</Label><Input type="time" value={form.pm_start_time} onChange={e => setForm({ ...form, pm_start_time: e.target.value })} /></div>
            <div className="col-span-2"><Label>Fare per term</Label><Input type="number" value={form.fare_per_term} onChange={e => setForm({ ...form, fare_per_term: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!stopDialog} onOpenChange={(o) => !o && setStopDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stop</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name *</Label><Input value={stopForm.name} onChange={e => setStopForm({ ...stopForm, name: e.target.value })} /></div>
            <div><Label>AM pickup</Label><Input type="time" value={stopForm.am_pickup_time} onChange={e => setStopForm({ ...stopForm, am_pickup_time: e.target.value })} /></div>
            <div><Label>PM dropoff</Label><Input type="time" value={stopForm.pm_dropoff_time} onChange={e => setStopForm({ ...stopForm, pm_dropoff_time: e.target.value })} /></div>
            <div className="col-span-2"><Label>Landmark</Label><Input value={stopForm.landmark} onChange={e => setStopForm({ ...stopForm, landmark: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={addStop}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function VehiclesTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ registration_number: "", nickname: "", make: "", model: "", year: "", capacity: "30", fuel_type: "diesel", status: "active", insurance_expiry: "", inspection_expiry: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("vehicles").select("*").eq("tenant_id", tenantId).order("registration_number");
    setRows(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.registration_number.trim()) return toast.error("Registration required");
    const { error } = await supabase.from("vehicles").insert({
      tenant_id: tenantId, registration_number: form.registration_number.trim().toUpperCase(),
      nickname: form.nickname || null, make: form.make || null, model: form.model || null,
      year: form.year ? parseInt(form.year) : null, capacity: parseInt(form.capacity) || 0,
      fuel_type: form.fuel_type, status: form.status as any,
      insurance_expiry: form.insurance_expiry || null, inspection_expiry: form.inspection_expiry || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Vehicle added"); setOpen(false);
    setForm({ registration_number: "", nickname: "", make: "", model: "", year: "", capacity: "30", fuel_type: "diesel", status: "active", insurance_expiry: "", inspection_expiry: "" });
    load();
  };

  const today = new Date(); const soon = new Date(); soon.setDate(today.getDate() + 30);
  const isExpiring = (d: string | null) => d && new Date(d) <= soon;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Vehicles</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Vehicle</Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vehicles yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map(v => (
            <div key={v.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono font-semibold">{v.registration_number}</div>
                  <div className="text-xs text-muted-foreground">{[v.make, v.model, v.year].filter(Boolean).join(" ")}{v.nickname && ` — ${v.nickname}`}</div>
                  <div className="text-xs mt-1">Capacity {v.capacity} · {v.fuel_type || "—"}</div>
                </div>
                <Badge variant={v.status === "active" ? "default" : "secondary"}>{v.status}</Badge>
              </div>
              <div className="mt-2 flex gap-2 flex-wrap">
                {v.insurance_expiry && <Badge variant={isExpiring(v.insurance_expiry) ? "destructive" : "outline"}>Ins: {v.insurance_expiry}</Badge>}
                {v.inspection_expiry && <Badge variant={isExpiring(v.inspection_expiry) ? "destructive" : "outline"}>Insp: {v.inspection_expiry}</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Vehicle</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Registration *</Label><Input value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} placeholder="KCA 123A" /></div>
            <div><Label>Nickname</Label><Input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} /></div>
            <div><Label>Make</Label><Input value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} /></div>
            <div><Label>Model</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
            <div><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
            <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
            <div><Label>Fuel</Label>
              <Select value={form.fuel_type} onValueChange={v => setForm({ ...form, fuel_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="petrol">Petrol</SelectItem><SelectItem value="electric">Electric</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="retired">Retired</SelectItem><SelectItem value="reserved">Reserved</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Insurance expiry</Label><Input type="date" value={form.insurance_expiry} onChange={e => setForm({ ...form, insurance_expiry: e.target.value })} /></div>
            <div><Label>Inspection expiry</Label><Input type="date" value={form.inspection_expiry} onChange={e => setForm({ ...form, inspection_expiry: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DriversTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", license_number: "", license_class: "B,C,E", license_expiry: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("drivers").select("*").eq("tenant_id", tenantId).order("full_name");
    setRows(data || []); setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.full_name.trim()) return toast.error("Name required");
    const { error } = await supabase.from("drivers").insert({
      tenant_id: tenantId, full_name: form.full_name.trim(), phone: form.phone || null,
      license_number: form.license_number || null, license_class: form.license_class || null,
      license_expiry: form.license_expiry || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Driver added"); setOpen(false);
    setForm({ full_name: "", phone: "", license_number: "", license_class: "B,C,E", license_expiry: "" });
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Drivers</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Driver</Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No drivers yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(d => (
            <div key={d.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{d.full_name}</div>
                <div className="text-xs text-muted-foreground">{d.phone || "—"} · License {d.license_number || "—"} ({d.license_class || "—"})</div>
              </div>
              {d.license_expiry && <Badge variant={new Date(d.license_expiry) < new Date() ? "destructive" : "outline"}>Exp {d.license_expiry}</Badge>}
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Driver</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Full name *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>License no.</Label><Input value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} /></div>
            <div><Label>Class</Label><Input value={form.license_class} onChange={e => setForm({ ...form, license_class: e.target.value })} /></div>
            <div><Label>Expiry</Label><Input type="date" value={form.license_expiry} onChange={e => setForm({ ...form, license_expiry: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SubscriptionsTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", route_id: "", pickup_stop_id: "", dropoff_stop_id: "", fare: "0" });

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: subs }, { data: rts }, { data: sts }, { data: studs }] = await Promise.all([
      supabase.from("student_transport_subscriptions").select("*, students(first_name,last_name,admission_number), transport_routes(name)").eq("tenant_id", tenantId).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("transport_routes").select("id,name,fare_per_term").eq("tenant_id", tenantId).order("name"),
      supabase.from("transport_stops").select("id,name,route_id").eq("tenant_id", tenantId).order("sort_order"),
      supabase.from("students").select("id,first_name,last_name,admission_number").eq("tenant_id", tenantId).limit(1000),
    ]);
    setRows(subs || []); setRoutes(rts || []); setStops(sts || []); setStudents(studs || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const routeStops = stops.filter(s => s.route_id === form.route_id);

  const save = async () => {
    if (!form.student_id || !form.route_id) return toast.error("Student and route required");
    const { error } = await supabase.from("student_transport_subscriptions").insert({
      tenant_id: tenantId, student_id: form.student_id, route_id: form.route_id,
      pickup_stop_id: form.pickup_stop_id || null, dropoff_stop_id: form.dropoff_stop_id || null,
      fare: parseFloat(form.fare) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Subscription added"); setOpen(false);
    setForm({ student_id: "", route_id: "", pickup_stop_id: "", dropoff_stop_id: "", fare: "0" });
    load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Student Subscriptions</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Subscribe Student</Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(s => (
            <div key={s.id} className="border rounded p-3 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium">{s.students?.first_name} {s.students?.last_name}</div>
                <div className="text-xs text-muted-foreground">{s.students?.admission_number} · {s.transport_routes?.name}</div>
              </div>
              <Badge variant="outline">Fare {s.fare}</Badge>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Subscribe Student</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Student *</Label>
              <Select value={form.student_id} onValueChange={v => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.admission_number} — {s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Route *</Label>
              <Select value={form.route_id} onValueChange={v => { const r = routes.find(x => x.id === v); setForm({ ...form, route_id: v, pickup_stop_id: "", dropoff_stop_id: "", fare: r?.fare_per_term?.toString() || form.fare }); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Pickup stop</Label>
              <Select value={form.pickup_stop_id} onValueChange={v => setForm({ ...form, pickup_stop_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{routeStops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Dropoff stop</Label>
              <Select value={form.dropoff_stop_id} onValueChange={v => setForm({ ...form, dropoff_stop_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{routeStops.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Fare</Label><Input type="number" value={form.fare} onChange={e => setForm({ ...form, fare: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TripsTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ route_id: "", vehicle_id: "", driver_id: "", trip_date: new Date().toISOString().slice(0, 10), direction: "am_pickup", odometer_start: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: t }, { data: r }, { data: v }, { data: d }] = await Promise.all([
      supabase.from("transport_trips").select("*, transport_routes(name), vehicles(registration_number), drivers(full_name)").eq("tenant_id", tenantId).order("trip_date", { ascending: false }).limit(50),
      supabase.from("transport_routes").select("id,name").eq("tenant_id", tenantId).order("name"),
      supabase.from("vehicles").select("id,registration_number").eq("tenant_id", tenantId).eq("status", "active"),
      supabase.from("drivers").select("id,full_name").eq("tenant_id", tenantId).eq("is_active", true),
    ]);
    setRows(t || []); setRoutes(r || []); setVehicles(v || []); setDrivers(d || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.route_id) return toast.error("Route required");
    const { error } = await supabase.from("transport_trips").insert({
      tenant_id: tenantId, route_id: form.route_id,
      vehicle_id: form.vehicle_id || null, driver_id: form.driver_id || null,
      trip_date: form.trip_date, direction: form.direction as any,
      odometer_start: form.odometer_start ? parseInt(form.odometer_start) : null,
      status: "scheduled",
    });
    if (error) return toast.error(error.message);
    toast.success("Trip scheduled"); setOpen(false); load();
  };

  const advance = async (trip: any, status: string) => {
    const patch: any = { status };
    if (status === "in_progress") patch.started_at = new Date().toISOString();
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("transport_trips").update(patch).eq("id", trip.id);
    if (error) return toast.error(error.message);
    toast.success(`Trip ${status}`); load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Trips</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Trip</Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No trips yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(t => (
            <div key={t.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{t.transport_routes?.name} · {t.direction === "am_pickup" ? "AM Pickup" : t.direction === "pm_dropoff" ? "PM Dropoff" : t.direction}</div>
                <div className="text-xs text-muted-foreground">{t.trip_date} · {t.vehicles?.registration_number || "—"} · {t.drivers?.full_name || "—"}</div>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant={t.status === "completed" ? "default" : t.status === "in_progress" ? "secondary" : "outline"}>{t.status}</Badge>
                {t.status === "scheduled" && <Button size="sm" variant="outline" onClick={() => advance(t, "in_progress")}><Play className="h-3 w-3" /></Button>}
                {t.status === "in_progress" && <Button size="sm" variant="outline" onClick={() => advance(t, "completed")}><CheckCircle2 className="h-3 w-3" /></Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule Trip</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Route *</Label>
              <Select value={form.route_id} onValueChange={v => setForm({ ...form, route_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Vehicle</Label>
              <Select value={form.vehicle_id} onValueChange={v => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registration_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Driver</Label>
              <Select value={form.driver_id} onValueChange={v => setForm({ ...form, driver_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.trip_date} onChange={e => setForm({ ...form, trip_date: e.target.value })} /></div>
            <div><Label>Direction</Label>
              <Select value={form.direction} onValueChange={v => setForm({ ...form, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="am_pickup">AM Pickup</SelectItem>
                  <SelectItem value="pm_dropoff">PM Dropoff</SelectItem>
                  <SelectItem value="excursion">Excursion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Odometer start</Label><Input type="number" value={form.odometer_start} onChange={e => setForm({ ...form, odometer_start: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function IncidentsTab({ tenantId }: { tenantId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ incident_type: "breakdown", severity: "2", vehicle_id: "", driver_id: "", location: "", description: "", action_taken: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: i }, { data: v }, { data: d }] = await Promise.all([
      supabase.from("transport_incidents").select("*, vehicles(registration_number), drivers(full_name)").eq("tenant_id", tenantId).order("occurred_at", { ascending: false }).limit(50),
      supabase.from("vehicles").select("id,registration_number").eq("tenant_id", tenantId),
      supabase.from("drivers").select("id,full_name").eq("tenant_id", tenantId),
    ]);
    setRows(i || []); setVehicles(v || []); setDrivers(d || []);
    setLoading(false);
  }, [tenantId]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.description.trim()) return toast.error("Description required");
    const { error } = await supabase.from("transport_incidents").insert({
      tenant_id: tenantId, incident_type: form.incident_type as any, severity: parseInt(form.severity),
      vehicle_id: form.vehicle_id || null, driver_id: form.driver_id || null,
      location: form.location || null, description: form.description.trim(),
      action_taken: form.action_taken || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Incident logged"); setOpen(false);
    setForm({ incident_type: "breakdown", severity: "2", vehicle_id: "", driver_id: "", location: "", description: "", action_taken: "" });
    load();
  };

  const resolve = async (id: string) => {
    const { error } = await supabase.from("transport_incidents").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Resolved"); load();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Incidents</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Log Incident</Button>
      </div>
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No incidents logged.</p>
      ) : (
        <div className="space-y-2">
          {rows.map(i => (
            <div key={i.id} className="border rounded p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={i.severity >= 4 ? "destructive" : i.severity >= 3 ? "secondary" : "outline"}>Sev {i.severity}</Badge>
                    <span className="font-medium text-sm capitalize">{i.incident_type}</span>
                    <span className="text-xs text-muted-foreground">{new Date(i.occurred_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm mt-1">{i.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {i.vehicles?.registration_number || "—"} · {i.drivers?.full_name || "—"}{i.location && ` · ${i.location}`}
                  </div>
                  {i.action_taken && <div className="text-xs italic mt-1">Action: {i.action_taken}</div>}
                </div>
                {i.resolved ? <Badge variant="default">Resolved</Badge> : <Button size="sm" variant="outline" onClick={() => resolve(i.id)}>Resolve</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Incident</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <Select value={form.incident_type} onValueChange={v => setForm({ ...form, incident_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Severity (1-5)</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Vehicle</Label>
              <Select value={form.vehicle_id} onValueChange={v => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registration_number}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Driver</Label>
              <Select value={form.driver_id} onValueChange={v => setForm({ ...form, driver_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-span-2"><Label>Action taken</Label><Textarea value={form.action_taken} onChange={e => setForm({ ...form, action_taken: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}