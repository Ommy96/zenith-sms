import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Clock, CheckCircle, XCircle, Search, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  under_review: "bg-warning/10 text-warning border-warning/20",
  interview_scheduled: "bg-info/10 text-info border-info/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  under_review: "Under Review",
  interview_scheduled: "Interview Scheduled",
  accepted: "Accepted",
  rejected: "Rejected",
};

export default function Admissions() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", applied_grade: "", guardian_name: "",
    guardian_phone: "", guardian_email: "", previous_school: "", notes: "", gender: "",
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({
        school_id: schoolId!,
        first_name: form.first_name,
        last_name: form.last_name,
        applied_grade: form.applied_grade || null,
        guardian_name: form.guardian_name || null,
        guardian_phone: form.guardian_phone || null,
        guardian_email: form.guardian_email || null,
        previous_school: form.previous_school || null,
        gender: form.gender || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application created");
      setOpen(false);
      setForm({ first_name: "", last_name: "", applied_grade: "", guardian_name: "", guardian_phone: "", guardian_email: "", previous_school: "", notes: "", gender: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = applications.filter((a: any) =>
    `${a.first_name} ${a.last_name} ${a.guardian_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Total Applications", value: applications.length, icon: UserPlus },
    { label: "Under Review", value: applications.filter((a: any) => a.status === "under_review").length, icon: Clock },
    { label: "Accepted", value: applications.filter((a: any) => a.status === "accepted").length, icon: CheckCircle },
    { label: "Rejected", value: applications.filter((a: any) => a.status === "rejected").length, icon: XCircle },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage student applications and enrollment pipeline</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New Application</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Application</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div><Label className="text-xs">First Name *</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Last Name *</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Applied Grade</Label><Input value={form.applied_grade} onChange={e => setForm(f => ({ ...f, applied_grade: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Guardian Name</Label><Input value={form.guardian_name} onChange={e => setForm(f => ({ ...f, guardian_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Guardian Phone</Label><Input value={form.guardian_phone} onChange={e => setForm(f => ({ ...f, guardian_phone: e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-xs">Guardian Email</Label><Input value={form.guardian_email} onChange={e => setForm(f => ({ ...f, guardian_email: e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-xs">Previous School</Label><Input value={form.previous_school} onChange={e => setForm(f => ({ ...f, previous_school: e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!form.first_name || !form.last_name || createMutation.isPending} className="w-full mt-2">
              {createMutation.isPending ? "Saving..." : "Submit Application"}
            </Button>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search applications..." className="pl-9 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Applicant</TableHead>
              <TableHead className="text-xs font-semibold">Grade</TableHead>
              <TableHead className="text-xs font-semibold">Guardian</TableHead>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No applications found</TableCell></TableRow>
            ) : filtered.map((app: any) => (
              <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <p className="text-sm font-medium text-foreground">{app.first_name} {app.last_name}</p>
                  <p className="text-xs text-muted-foreground">{app.id.slice(0, 8)}</p>
                </TableCell>
                <TableCell className="text-sm">{app.applied_grade || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{app.guardian_name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Select value={app.status} onValueChange={v => updateStatusMutation.mutate({ id: app.id, status: v })}>
                    <SelectTrigger className="h-7 w-[150px] border-0 p-0">
                      <Badge variant="outline" className={`text-[11px] ${statusColors[app.status] || ""}`}>
                        {statusLabels[app.status] || app.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(app.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
