import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Mail, Phone, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { GuardianFormDialog, linkStudents } from "@/components/sis/GuardianFormDialog";
import { portalStatus } from "./Guardians";

export default function GuardianProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant, can } = useTenant();
  const tid = tenant?.id;
  const qc = useQueryClient();
  const canEdit = can("students.edit");
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const g = useQuery({
    queryKey: [tid, "guardians", id], enabled: !!tid && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("guardians")
        .select("*, student_guardians!student_guardians_guardian_id_fkey(id,relationship,is_primary_contact,students(id,first_name,last_name,admission_number))")
        .eq("tenant_id", tid).eq("id", id).maybeSingle();
      if (error) throw error; return data;
    },
  });
  const messages = useQuery({
    queryKey: [tid, "guardians", id, "messages"], enabled: !!tid && !!id,
    queryFn: async () => (await supabase.from("messages").select("id,channel,direction,status,body,created_at").eq("tenant_id", tid).eq("recipient_type", "guardian").eq("recipient_id", id).order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const picker = useQuery({
    queryKey: [tid, "students", "picker", search], enabled: addOpen && !!tid,
    queryFn: async () => {
      let q = supabase.from("students").select("id,first_name,last_name,admission_number").eq("tenant_id", tid).order("first_name").limit(30);
      const t = search.trim().replace(/[,()]/g, "");
      if (t) q = q.or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,admission_number.ilike.%${t}%`);
      return (await q).data ?? [];
    },
  });

  if (g.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  const data: any = g.data;
  if (!data) return <Button variant="ghost" onClick={() => navigate("/academics/guardians")}>Back to guardians</Button>;
  const links = (data.student_guardians ?? []).filter((l: any) => l.students);
  const p = portalStatus(data);
  const refresh = () => { qc.invalidateQueries({ queryKey: [tid, "guardians"] }); qc.invalidateQueries({ queryKey: [tid, "students"] }); };

  const addStudent = async (sid: string) => {
    try { await linkStudents(tid!, data.id, data.relationship_default ?? "guardian", [sid]); toast.success("Student linked"); setAddOpen(false); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };
  const unlink = async (linkId: string) => {
    const { error } = await supabase.from("student_guardians").delete().eq("id", linkId).eq("tenant_id", tid);
    if (error) return toast.error(error.message);
    toast.success("Student unlinked"); refresh();
  };
  const invite = async () => {
    if (!data.phone_primary) return toast.error("This guardian has no phone number.");
    setSending(true);
    const { error } = await supabase.functions.invoke("portal-send-otp", { body: { phone: data.phone_primary, tenant_id: tid } });
    setSending(false);
    if (error) return toast.error("Invitation could not be sent.");
    toast.success(`Portal invitation sent to ${data.phone_primary}`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/academics/guardians")}><ArrowLeft className="h-4 w-4 mr-2" />Guardians</Button>
      <Card className="p-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{data.full_name}</h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">{data.relationship_default ?? "Guardian"}{data.occupation ? ` · ${data.occupation}` : ""}</p>
          <div className="flex gap-4 mt-3 text-sm flex-wrap">
            {data.phone_primary && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{data.phone_primary}</span>}
            {data.phone_secondary && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{data.phone_secondary}</span>}
            {data.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{data.email}</span>}
            <Badge variant="outline" className={`text-[10px] ${p.className}`}>Portal: {p.label}</Badge>
          </div>
        </div>
        {canEdit && <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>Edit</Button>}
      </Card>
      <Tabs defaultValue="overview">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="portal">Portal access</TabsTrigger><TabsTrigger value="comms">Communication</TabsTrigger></TabsList>
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="p-5 grid sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">National ID</p><p>{data.national_id_number || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Address</p><p>{data.residential_address || "—"}</p></div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">Linked students ({links.length})</h3>{canEdit && <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add student</Button>}</div>
            <Table><TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Admission #</TableHead><TableHead>Relationship</TableHead><TableHead>Primary</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>{links.map((l: any) => <TableRow key={l.id}>
                <TableCell><button className="font-medium hover:text-primary" onClick={() => navigate(`/academics/students/${l.students.id}`)}>{l.students.first_name} {l.students.last_name}</button></TableCell>
                <TableCell className="font-mono text-xs">{l.students.admission_number}</TableCell><TableCell className="capitalize">{l.relationship}</TableCell>
                <TableCell>{l.is_primary_contact ? <Badge className="text-[10px]">Primary</Badge> : "—"}</TableCell>
                <TableCell>{canEdit && <Button size="sm" variant="ghost" onClick={() => unlink(l.id)}>Unlink</Button>}</TableCell>
              </TableRow>)}{!links.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No linked students.</TableCell></TableRow>}</TableBody></Table>
          </Card>
        </TabsContent>
        <TabsContent value="portal" className="mt-4">
          <Card className="p-6 text-sm">
            {data.portal_user_id ? <p>This guardian has an active parent portal account.</p> : (
              <div className="space-y-3"><p className="text-muted-foreground">No parent portal account yet. Sending an invitation texts a sign-in code to {data.phone_primary ?? "their phone"}.</p>
                {canEdit && <Button size="sm" onClick={invite} disabled={sending}><Send className="h-3.5 w-3.5 mr-1.5" />{sending ? "Sending…" : "Send invitation to parent portal"}</Button>}</div>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="comms" className="mt-4">
          <Card><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Channel</TableHead><TableHead>Direction</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{(messages.data ?? []).map((m: any) => <TableRow key={m.id}><TableCell className="text-xs whitespace-nowrap">{new Date(m.created_at).toLocaleString()}</TableCell><TableCell className="uppercase text-xs">{m.channel}</TableCell><TableCell className="text-xs">{m.direction}</TableCell><TableCell className="text-xs max-w-md truncate">{m.body}</TableCell><TableCell className="text-xs">{m.status}</TableCell></TableRow>)}
              {!messages.data?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No messages yet.</TableCell></TableRow>}</TableBody></Table></Card>
        </TabsContent>
      </Tabs>
      <GuardianFormDialog open={editOpen} onOpenChange={setEditOpen} guardian={data} onSaved={() => refresh()} />
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent><DialogHeader><DialogTitle>Link a student to {data.full_name}</DialogTitle></DialogHeader>
          <Input placeholder="Search name or admission number" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="max-h-72 overflow-y-auto divide-y">{(picker.data ?? []).filter((s: any) => !links.some((l: any) => l.students.id === s.id)).map((s: any) =>
            <div key={s.id} className="flex items-center justify-between py-2 text-sm"><span>{s.first_name} {s.last_name} <span className="font-mono text-xs text-muted-foreground">{s.admission_number}</span></span><Button size="sm" variant="outline" onClick={() => addStudent(s.id)}>Link</Button></div>)}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
