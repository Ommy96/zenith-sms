import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

const audienceColors: Record<string, string> = {
  all: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-accent/10 text-accent border-accent/20",
  students: "bg-success/10 text-success border-success/20",
  parents: "bg-warning/10 text-warning border-warning/20",
  class: "bg-muted text-muted-foreground border-border",
};

export default function Events() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [f, setF] = useState({
    title: "", description: "", location: "",
    starts_at: "", ends_at: "", all_day: false,
    category: "general", audience: "all",
  });

  const monthStart = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const monthEnd = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 1), [month]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase.from("calendar_events").select("*")
      .eq("tenant_id", tenantId)
      .gte("starts_at", monthStart.toISOString())
      .lt("starts_at", monthEnd.toISOString())
      .order("starts_at");
    setItems(data || []); setLoading(false);
  }, [tenantId, monthStart, monthEnd]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!f.title.trim() || !f.starts_at || !f.ends_at) return toast.error("Title, start, end required");
    setSaving(true);
    const { error } = await supabase.from("calendar_events").insert({
      tenant_id: tenantId,
      title: f.title.trim(), description: f.description || null, location: f.location || null,
      starts_at: new Date(f.starts_at).toISOString(),
      ends_at: new Date(f.ends_at).toISOString(),
      all_day: f.all_day, category: f.category, audience: f.audience,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Event created");
    setOpen(false);
    setF({ title: "", description: "", location: "", starts_at: "", ends_at: "", all_day: false, category: "general", audience: "all" });
    load();
  };

  // Build calendar grid
  const grid = useMemo(() => {
    const first = monthStart.getDay();
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null; events: any[] }[] = [];
    for (let i = 0; i < first; i++) cells.push({ date: null, events: [] });
    for (let d = 1; d <= days; d++) {
      const dt = new Date(month.getFullYear(), month.getMonth(), d);
      const dayEvents = items.filter(e => {
        const es = new Date(e.starts_at);
        return es.getDate() === d && es.getMonth() === month.getMonth() && es.getFullYear() === month.getFullYear();
      });
      cells.push({ date: dt, events: dayEvents });
    }
    return cells;
  }, [items, month, monthStart]);

  const icalUrl = tenantId ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ical-feed?tenant=${tenantId}` : "";
  const copyIcal = () => { navigator.clipboard.writeText(icalUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("iCal URL copied"); };

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">School Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Events, exams, holidays, parent meetings.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />New Event</Button>
      </motion.div>

      <Tabs defaultValue="month">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="month"><CalendarIcon className="h-4 w-4 mr-2" />Month</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-sm font-medium min-w-[140px] text-center">{month.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
            <Button size="icon" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => setMonth(new Date())}>Today</Button>
          </div>
        </div>

        <TabsContent value="month" className="mt-4">
          <Card className="p-2">
            <div className="grid grid-cols-7 gap-px text-xs font-medium text-muted-foreground border-b pb-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="text-center">{d}</div>)}
            </div>
            {loading ? <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
              <div className="grid grid-cols-7 gap-px">
                {grid.map((cell, i) => (
                  <div key={i} className={`min-h-[90px] p-1 border border-border/40 rounded ${cell.date && cell.date.toDateString() === new Date().toDateString() ? "bg-primary/5" : ""}`}>
                    {cell.date && (
                      <>
                        <div className="text-xs font-medium text-muted-foreground mb-1">{cell.date.getDate()}</div>
                        <div className="space-y-0.5">
                          {cell.events.slice(0, 3).map(e => (
                            <div key={e.id} className="text-[10px] truncate px-1 py-0.5 rounded bg-primary/10 text-primary" title={e.title}>
                              {e.all_day ? "" : new Date(e.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " "}{e.title}
                            </div>
                          ))}
                          {cell.events.length > 3 && <div className="text-[10px] text-muted-foreground">+{cell.events.length - 3} more</div>}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="agenda" className="mt-4">
          {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            : items.length === 0 ? <Card className="p-12 text-center text-muted-foreground">No events this month.</Card>
            : (
              <div className="space-y-2">
                {items.map(e => (
                  <Card key={e.id} className="p-4 flex items-start gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold">{new Date(e.starts_at).getDate()}</div>
                      <div className="text-xs text-muted-foreground uppercase">{new Date(e.starts_at).toLocaleString(undefined, { month: "short" })}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{e.title}</span>
                        <Badge variant="outline" className={audienceColors[e.audience] || ""}>{e.audience}</Badge>
                        <Badge variant="outline">{e.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {e.all_day ? "All day" : `${new Date(e.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(e.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                      {e.description && <p className="text-sm mt-1 text-muted-foreground">{e.description}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>

      <Card className="p-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1">
          <div className="text-sm font-medium">Subscribe to this calendar</div>
          <div className="text-xs text-muted-foreground">Add to Google Calendar, Apple Calendar, or Outlook using this URL.</div>
        </div>
        <Button size="sm" variant="outline" onClick={copyIcal}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />} Copy iCal URL
        </Button>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div><Label className="text-xs">Title *</Label><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Starts *</Label><Input type="datetime-local" value={f.starts_at} onChange={e => setF({ ...f, starts_at: e.target.value })} /></div>
              <div><Label className="text-xs">Ends *</Label><Input type="datetime-local" value={f.ends_at} onChange={e => setF({ ...f, ends_at: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="allday" checked={f.all_day} onCheckedChange={v => setF({ ...f, all_day: !!v })} />
              <Label htmlFor="allday" className="text-sm">All day</Label>
            </div>
            <div><Label className="text-xs">Location</Label><Input value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Category</Label>
                <Select value={f.category} onValueChange={v => setF({ ...f, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="trip">Trip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Audience</Label>
                <Select value={f.audience} onValueChange={v => setF({ ...f, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="staff">Staff only</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea rows={3} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}