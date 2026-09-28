import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRightLeft, History, UserMinus, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { WITHDRAW_REASONS } from "@/lib/sis/people";

const today = () => new Date().toISOString().slice(0, 10);
const transferSchema = z.object({ class_id: z.string().uuid("Choose a class"), reason: z.string().max(300).optional(), effective_date: z.string().min(10) });
const withdrawSchema = z.object({ reason: z.enum(WITHDRAW_REASONS.map((r) => r[0]) as [string, ...string[]]), effective_date: z.string().min(10), notes: z.string().max(500).optional() });

interface Props { student: { id: string; first_name: string; last_name: string; current_class_id?: string | null; enrollment_status?: string | null }; onChanged: () => void }

export function EnrollmentCard({ student, onChanged }: Props) {
  const { tenant, can } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const tid = tenant?.id;
  const name = `${student.first_name} ${student.last_name}`;
  const canEdit = can("students.edit");
  const [mode, setMode] = useState<null | "transfer" | "withdraw" | "history">(null);

  const history = useQuery({
    queryKey: [tid, "enrollments", student.id],
    enabled: !!tid,
    queryFn: async () => {
      const { data, error } = await supabase.from("student_enrollments")
        .select("id,status,enrolled_date,unenrolled_date,reason,classes(name),academic_years(name)")
        .eq("tenant_id", tid).eq("student_id", student.id).order("enrolled_date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    },
  });
  const classes = useQuery({
    queryKey: [tid, "classes", "active"],
    enabled: !!tid && mode === "transfer",
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name,academic_year_id,academic_years(is_current)").eq("tenant_id", tid).eq("is_active", true).order("name");
      if (error) throw error; return data ?? [];
    },
  });
  const current = history.data?.find((e: any) => e.status === "active");

  const tf = useForm<z.infer<typeof transferSchema>>({ resolver: zodResolver(transferSchema), defaultValues: { class_id: "", reason: "", effective_date: today() } });
  const wf = useForm<z.infer<typeof withdrawSchema>>({ resolver: zodResolver(withdrawSchema), defaultValues: { reason: "family_relocation", effective_date: today(), notes: "" } });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [tid, "enrollments"] });
    qc.invalidateQueries({ queryKey: [tid, "students"] });
    if (tid) supabase.rpc("recompute_setup_progress", { p_tenant_id: tid }).then(() => qc.invalidateQueries({ queryKey: ["setup-progress"] }));
    onChanged();
  };

  const submitTransfer = tf.handleSubmit(async (v) => {
    const cls = classes.data?.find((c: any) => c.id === v.class_id) as any;
    let yearId = cls?.academic_year_id;
    if (!yearId) { const { data } = await supabase.rpc("current_academic_year", { p_tenant_id: tid }); yearId = data; }
    if (!yearId) return toast.error("That class has no academic year. Set one on the class first.");
    const { data: newId, error } = await supabase.rpc("enroll_student", { p_student_id: student.id, p_class_id: v.class_id, p_year_id: yearId });
    if (error) return toast.error(error.message);
    if (newId && (v.reason || v.effective_date !== today())) {
      await supabase.from("student_enrollments").update({ reason: v.reason || null, enrolled_date: v.effective_date }).eq("id", newId);
    }
    toast.success(current ? `Transferred ${name} to ${cls?.name}. Previous enrollment closed.` : `Enrolled ${name} in ${cls?.name}.`);
    setMode(null); tf.reset({ class_id: "", reason: "", effective_date: today() }); refresh();
  });

  const submitWithdraw = wf.handleSubmit(async (v) => {
    const reasonText = `${v.reason}${v.notes ? `: ${v.notes}` : ""}`;
    const { error } = await supabase.from("students").update({ enrollment_status: "transferred" }).eq("id", student.id).eq("tenant_id", tid);
    if (error) return toast.error(error.message);
    const { error: e2 } = await supabase.from("student_enrollments").update({ status: "transferred_out", unenrolled_date: v.effective_date, reason: reasonText })
      .eq("tenant_id", tid).eq("student_id", student.id).eq("status", "active");
    if (e2) return toast.error(e2.message);
    await supabase.from("audit_logs").insert({
      tenant_id: tid, actor_user_id: user?.id, actor_type: "user", action: "student.withdrawn", entity_type: "students", entity_id: student.id,
      before: { enrollment_status: student.enrollment_status }, after: { enrollment_status: "transferred", reason: v.reason, effective_date: v.effective_date, notes: v.notes || null },
    });
    toast.success(`${name} withdrawn.`);
    setMode(null); refresh();
  });

  const withdrawn = student.enrollment_status === "transferred";

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Enrollment</h3>
      {history.isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : current ? (
        <div className="text-sm space-y-1">
          <p className="font-medium">{(current as any).classes?.name}</p>
          <p className="text-xs text-muted-foreground">{(current as any).academic_years?.name ?? "—"} · enrolled {current.enrolled_date}</p>
        </div>
      ) : <p className="text-xs text-muted-foreground">No active enrollment record.</p>}
      <div className="flex flex-col gap-1.5 mt-3">
        {canEdit && !withdrawn && <Button size="sm" variant="outline" onClick={() => setMode("transfer")}><ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />{current ? "Transfer class" : "Enroll in class"}</Button>}
        {canEdit && !withdrawn && <Button size="sm" variant="outline" onClick={() => setMode("withdraw")}><UserMinus className="h-3.5 w-3.5 mr-1.5" />Withdraw</Button>}
        <Button size="sm" variant="ghost" onClick={() => setMode("history")}><History className="h-3.5 w-3.5 mr-1.5" />View enrollment history</Button>
      </div>

      <Dialog open={mode === "transfer"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{current ? `Transfer ${name} to a new class` : `Enroll ${name} in a class`}</DialogTitle></DialogHeader>
          <form onSubmit={submitTransfer} className="grid gap-3">
            <div className="grid gap-1.5"><Label>New class</Label>
              <Select value={tf.watch("class_id")} onValueChange={(v) => tf.setValue("class_id", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Choose a class" /></SelectTrigger>
                <SelectContent>{(classes.data ?? []).filter((c: any) => !current || c.name !== (current as any).classes?.name).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {tf.formState.errors.class_id && <p className="text-xs text-destructive">{tf.formState.errors.class_id.message}</p>}
            </div>
            <div className="grid gap-1.5"><Label>Reason (optional)</Label><Input {...tf.register("reason")} /></div>
            <div className="grid gap-1.5"><Label>Effective date</Label><Input type="date" {...tf.register("effective_date")} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button><Button type="submit" disabled={tf.formState.isSubmitting}>{tf.formState.isSubmitting ? "Saving…" : "Save"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "withdraw"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Withdraw {name}?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will set their status to "Withdrawn" and close their current enrollment. This can be reversed later.</p>
          <form onSubmit={submitWithdraw} className="grid gap-3">
            <div className="grid gap-1.5"><Label>Reason</Label>
              <Select value={wf.watch("reason")} onValueChange={(v) => wf.setValue("reason", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WITHDRAW_REASONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Effective date</Label><Input type="date" {...wf.register("effective_date")} /></div>
            <div className="grid gap-1.5"><Label>Notes</Label><Textarea rows={3} {...wf.register("notes")} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button><Button type="submit" variant="destructive" disabled={wf.formState.isSubmitting}>Withdraw</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "history"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Enrollment history — {name}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead><TableHead>Enrolled</TableHead><TableHead>Left</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
            <TableBody>
              {(history.data ?? []).map((e: any) => <TableRow key={e.id}><TableCell>{e.academic_years?.name ?? "—"}</TableCell><TableCell>{e.classes?.name}</TableCell><TableCell><Badge variant="outline" className="text-[10px]">{e.status}</Badge></TableCell><TableCell>{e.enrolled_date}</TableCell><TableCell>{e.unenrolled_date ?? "—"}</TableCell><TableCell className="text-xs">{e.reason ?? "—"}</TableCell></TableRow>)}
              {!history.data?.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No enrollment records yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
