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
import { FileSearch, Plus, Download, CheckCircle2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function SubjectRequests() {
  const { tenant } = useTenant();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ subject_type: "parent", subject_name: "", subject_email: "", request_details: "" });

  const load = async () => {
    if (!tenant) return;
    const { data } = await supabase.from("subject_access_requests").select("*")
      .eq("tenant_id", tenant.id).order("requested_at", { ascending: false });
    setRows(data || []);
  };

  useEffect(() => { load(); }, [tenant?.id]);

  const submit = async () => {
    if (!tenant) return;
    const { error } = await supabase.from("subject_access_requests").insert({ ...form, tenant_id: tenant.id });
    if (error) return toast.error(error.message);
    toast.success("Request logged");
    setOpen(false); setForm({ subject_type: "parent", subject_name: "", subject_email: "", request_details: "" });
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "fulfilled") { patch.fulfilled_at = new Date().toISOString(); }
    const { error } = await supabase.from("subject_access_requests").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated"); load();
  };

  const exportPackage = async (id: string) => {
    toast.info("Building data package...");
    const { data, error } = await supabase.functions.invoke("sar-export", { body: { sar_id: id } });
    if (error) return toast.error(error.message);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `sar-${id}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Package downloaded");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><FileSearch className="h-7 w-7 text-primary" /> Subject Access Requests</h1>
          <p className="text-muted-foreground mt-1">Parents, students, and staff can request a copy of all their data. Fulfil within 30 days.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Subject Access Request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Subject type</Label>
                <Select value={form.subject_type} onValueChange={(v) => setForm({ ...form, subject_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent / Guardian</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Full name</Label><Input value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.subject_email} onChange={(e) => setForm({ ...form, subject_email: e.target.value })} /></div>
              <div><Label>Request details</Label><Textarea value={form.request_details} onChange={(e) => setForm({ ...form, request_details: e.target.value })} /></div>
              <Button onClick={submit} className="w-full">Log Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All Requests ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Subject</TableHead><TableHead>Type</TableHead><TableHead>Requested</TableHead>
              <TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.subject_name}</div>
                    <div className="text-xs text-muted-foreground">{r.subject_email}</div>
                  </TableCell>
                  <TableCell>{r.subject_type}</TableCell>
                  <TableCell>{new Date(r.requested_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(r.due_date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => exportPackage(r.id)}><Download className="h-3 w-3 mr-1" />Export</Button>
                    {r.status !== "fulfilled" && (
                      <Button size="sm" onClick={() => setStatus(r.id, "fulfilled")}><CheckCircle2 className="h-3 w-3 mr-1" />Fulfil</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No requests yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}