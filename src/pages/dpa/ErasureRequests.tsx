import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Plus, CheckCircle2, XCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function ErasureRequests() {
  const { tenant } = useTenant();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ subject_type: "parent", subject_name: "", reason: "" });

  const load = async () => {
    if (!tenant) return;
    const { data } = await supabase.from("erasure_requests").select("*")
      .eq("tenant_id", tenant.id).order("requested_at", { ascending: false });
    setRows(data || []);
  };

  useEffect(() => { load(); }, [tenant?.id]);

  const submit = async () => {
    if (!tenant) return;
    const { error } = await supabase.from("erasure_requests").insert({ ...form, tenant_id: tenant.id });
    if (error) return toast.error(error.message);
    toast.success("Erasure request logged"); setOpen(false); load();
  };

  const decide = async (id: string, status: "approved" | "rejected" | "completed", reason?: string) => {
    const patch: any = { status };
    if (status === "approved") { patch.approved_at = new Date().toISOString(); }
    if (status === "completed") { patch.completed_at = new Date().toISOString(); }
    if (status === "rejected") { patch.rejection_reason = reason || "Statutory retention applies"; }
    const { error } = await supabase.from("erasure_requests").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated"); load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Trash2 className="h-7 w-7 text-primary" /> Right to Erasure</h1>
          <p className="text-muted-foreground mt-1">Track and audit data deletion requests. Retention by statute always overrides.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Erasure Request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Subject type</Label>
                <Select value={form.subject_type} onValueChange={(v) => setForm({ ...form, subject_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Subject name</Label><Input value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} /></div>
              <div><Label>Reason for erasure</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <Button onClick={submit} className="w-full">Log Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Requests ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Subject</TableHead><TableHead>Reason</TableHead><TableHead>Requested</TableHead>
              <TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><div className="font-medium">{r.subject_name}</div><div className="text-xs text-muted-foreground">{r.subject_type}</div></TableCell>
                  <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                  <TableCell>{new Date(r.requested_at).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="flex gap-2">
                    {r.status === "pending" && <>
                      <Button size="sm" onClick={() => decide(r.id, "approved")}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => decide(r.id, "rejected")}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                    </>}
                    {r.status === "approved" && <Button size="sm" onClick={() => decide(r.id, "completed")}>Mark Completed</Button>}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No requests yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}