import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Ban, FileDown, Plus, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EntityFormDialog } from "@/components/scaffolding/EntityFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry, InvoiceStatusChip, useFinanceStudents, useLookups, useNameMap } from "@/components/finance/shared";
import { kes, methodLabel, numericInput, openSignedPdf, refreshSetup, studentName } from "@/lib/finance/format";

export default function InvoiceDetail() {
  const { id } = useParams();
  const { tenant, has_permission } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const lk = useLookups();
  const students = useFinanceStudents();
  const terms = useNameMap(lk.data?.terms); const years = useNameMap(lk.data?.years);
  const [confirm, setConfirm] = useState<null | "cancel" | "void">(null);
  const [lineOpen, setLineOpen] = useState(false);
  const [line, setLine] = useState({ description: "", quantity: "1", unit_amount: "" });
  const [printing, setPrinting] = useState(false);

  const q = useQuery({
    queryKey: [tenant?.id, "invoice", id], enabled: !!tenant?.id && !!id,
    queryFn: async () => {
      const [inv, lines, allocs, logs] = await Promise.all([
        supabase.from("invoices").select("*, students:student_id(id, first_name, last_name, admission_number)").eq("id", id).maybeSingle(),
        supabase.from("invoice_line_items").select("*").eq("invoice_id", id).order("sort_order"),
        supabase.from("payment_allocations").select("id, amount, allocated_at, payments:payment_id(id, payment_number, method, paid_at, status)").eq("invoice_id", id),
        supabase.from("audit_logs").select("id, action, created_at, after").eq("entity_type", "invoice").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (inv.error) throw inv.error;
      return { inv: inv.data, lines: lines.data ?? [], allocs: allocs.data ?? [], logs: logs.data ?? [] };
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: [tenant?.id, "invoice", id] });
    qc.invalidateQueries({ queryKey: [tenant?.id, "invoices"] });
    refreshSetup(tenant!.id);
  };
  const log = (action: string, after: any) => supabase.from("audit_logs").insert({ tenant_id: tenant!.id, actor_user_id: user?.id, actor_type: "staff", action, entity_type: "invoice", entity_id: id, after });

  if (q.isError) return <div className="p-6"><ErrorRetry onRetry={() => q.refetch()} /></div>;
  if (q.isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  const inv: any = q.data?.inv;
  if (!inv) return <div className="p-6"><EmptyState title="Invoice not found" /></div>;
  const draft = inv.status === "draft";
  const closed = ["cancelled", "written_off"].includes(inv.status);
  const st = students.data?.find((s) => s.id === inv.student_id);

  const issue = async () => {
    if (!q.data?.lines.length) return toast.error("Add at least one line before issuing");
    const { error } = await supabase.from("invoices").update({ status: "issued", issued_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error("Could not issue the invoice");
    await log("invoice.issued", { status: "issued" }); toast.success("Invoice issued"); refresh();
  };
  const cancel = async () => {
    if (Number(inv.amount_paid) > 0) return toast.error("This invoice has payments. Use “Void via credit note” instead.");
    const { error } = await supabase.from("invoices").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error("Could not cancel the invoice");
    await log("invoice.cancelled", { status: "cancelled" }); toast.success("Invoice cancelled"); refresh();
  };
  const voidInvoice = async () => {
    const { error: cErr } = await supabase.from("credit_notes").insert({
      tenant_id: tenant!.id, invoice_id: id, student_id: inv.student_id, amount: Number(inv.balance), currency: inv.currency,
      reason: "invoice_void", description: `Void of ${inv.invoice_number}`, status: "approved", approved_by: user?.id, approved_at: new Date().toISOString(),
    });
    if (cErr) return toast.error("Could not create the credit note");
    const { error } = await supabase.from("invoices").update({ status: "written_off" }).eq("id", id);
    if (error) return toast.error("Could not void the invoice");
    await log("invoice.voided", { status: "written_off", credit: inv.balance }); toast.success("Invoice voided with a credit note"); refresh();
  };
  const addLine = async () => {
    const qty = Number(line.quantity), unit = Number(line.unit_amount), description = line.description.trim();
    if (!description || !(qty > 0) || !(unit >= 0)) throw new Error("Enter a description, quantity and amount");
    const { error } = await supabase.from("invoice_line_items").insert({ tenant_id: tenant!.id, invoice_id: id, description: description.slice(0, 200), quantity: qty, unit_amount: unit, line_total: qty * unit, sort_order: (q.data!.lines.length + 1) * 10 });
    if (error) throw new Error("Could not add the line"); refresh();
  };
  const removeLine = async (lineId: string) => {
    const { error } = await supabase.from("invoice_line_items").delete().eq("id", lineId);
    if (error) return toast.error("Could not remove the line"); refresh();
  };
  const print = async () => {
    setPrinting(true);
    try { await openSignedPdf("generate-invoice-pdf", { invoice_id: id }, `${inv.invoice_number}.pdf`); }
    catch (e) { toast.error((e as Error).message); } finally { setPrinting(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <Link to="/finance/invoices" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-4 w-4" />Invoices</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3"><h1 className="text-2xl font-semibold font-mono">{inv.invoice_number}</h1><InvoiceStatusChip status={inv.status} /></div>
          <Link to={`/academics/students/${inv.student_id}`} className="text-sm text-primary hover:underline">{studentName(inv.students)} · {inv.students?.admission_number}</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={print} disabled={printing}><FileDown className="h-4 w-4 mr-1" />{printing ? "Preparing…" : "Print"}</Button>
          {draft && has_permission("invoices.create") && <Button size="sm" onClick={issue}><Send className="h-4 w-4 mr-1" />Issue</Button>}
          {!closed && has_permission("invoices.create") && Number(inv.amount_paid) === 0 && <Button size="sm" variant="outline" onClick={() => setConfirm("cancel")}><Ban className="h-4 w-4 mr-1" />Cancel</Button>}
          {!closed && !draft && has_permission("invoices.void") && Number(inv.balance) > 0 && <Button size="sm" variant="outline" onClick={() => setConfirm("void")}>Void via credit note</Button>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader><CardContent className="text-sm space-y-1.5">
          <Row k="Class" v={st?.class_name ?? "—"} /><Row k="Academic year" v={years[inv.academic_year_id] ?? "—"} /><Row k="Term" v={inv.term_id ? terms[inv.term_id] : "—"} />
          <Row k="Issue date" v={inv.issue_date} /><Row k="Due date" v={inv.due_date ?? "—"} /><Row k="Issued at" v={inv.issued_at ? new Date(inv.issued_at).toLocaleString("en-KE") : "Not issued"} />
        </CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader className="pb-2"><CardTitle className="text-sm">Totals</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-4 text-sm">
          {[["Subtotal", inv.subtotal], ["Discounts", inv.discount_total], ["VAT", inv.vat_total], ["Total", inv.total], ["Paid", inv.amount_paid], ["Balance", inv.balance]].map(([k, v]) => (
            <div key={k as string}><p className="text-xs text-muted-foreground">{k}</p>
              <p className={`font-mono text-lg ${k === "Balance" && Number(v) > 0 ? "text-destructive" : ""} ${k === "Total" ? "font-semibold" : ""}`}>{kes(v as number, inv.currency)}</p></div>
          ))}
        </CardContent></Card>
      </div>

      <Card><CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-sm">Line items</CardTitle>
        {draft && <Button size="sm" variant="outline" onClick={() => { setLine({ description: "", quantity: "1", unit_amount: "" }); setLineOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add line</Button>}</CardHeader>
        <CardContent><Table>
          <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit</TableHead><TableHead className="text-right">Amount</TableHead>{draft && <TableHead className="w-10" />}</TableRow></TableHeader>
          <TableBody>{q.data!.lines.map((l: any) => (
            <TableRow key={l.id}><TableCell>{l.description}</TableCell><TableCell className="text-right font-mono">{Number(l.quantity)}</TableCell>
              <TableCell className="text-right font-mono">{kes(l.unit_amount, inv.currency)}</TableCell><TableCell className="text-right font-mono">{kes(l.line_total, inv.currency)}</TableCell>
              {draft && <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Remove line" onClick={() => removeLine(l.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>}</TableRow>
          ))}</TableBody>
        </Table></CardContent></Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Payments allocated</CardTitle></CardHeader><CardContent>
        {!q.data!.allocs.length ? <p className="text-sm text-muted-foreground">No payments yet.</p> : <Table>
          <TableHeader><TableRow><TableHead>Payment #</TableHead><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
          <TableBody>{q.data!.allocs.map((a: any) => (
            <TableRow key={a.id}><TableCell><Link to={`/finance/payments/${a.payments?.id}`} className="font-mono text-xs text-primary hover:underline">{a.payments?.payment_number}</Link></TableCell>
              <TableCell>{a.payments?.paid_at ? new Date(a.payments.paid_at).toLocaleDateString("en-KE") : "—"}</TableCell><TableCell>{methodLabel(a.payments?.method)}</TableCell>
              <TableCell className="text-right font-mono">{kes(a.amount, inv.currency)}</TableCell></TableRow>
          ))}</TableBody></Table>}
      </CardContent></Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Activity</CardTitle></CardHeader><CardContent>
        {!q.data!.logs.length ? <p className="text-sm text-muted-foreground">Created {new Date(inv.created_at).toLocaleString("en-KE")}.</p> : (
          <ul className="space-y-1 text-sm">{q.data!.logs.map((l: any) => <li key={l.id} className="flex justify-between"><span>{l.action.replace("invoice.", "").replace(/_/g, " ")}</span><span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("en-KE")}</span></li>)}
            <li className="flex justify-between text-muted-foreground"><span>created</span><span>{new Date(inv.created_at).toLocaleString("en-KE")}</span></li></ul>)}
      </CardContent></Card>

      <EntityFormDialog open={lineOpen} onOpenChange={setLineOpen} title="Add line" onSubmit={addLine} submitLabel="Add">
        <div><Label>Description</Label><Input maxLength={200} value={line.description} onChange={(e) => setLine({ ...line, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Quantity</Label><Input inputMode="numeric" value={line.quantity} onChange={(e) => setLine({ ...line, quantity: e.target.value.replace(/\D/g, "") })} /></div>
          <div><Label>Unit amount</Label><Input inputMode="decimal" value={line.unit_amount} onChange={(e) => setLine({ ...line, unit_amount: numericInput(e.target.value) })} /></div>
        </div>
      </EntityFormDialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirm === "void" ? "Void this invoice?" : "Cancel this invoice?"}</AlertDialogTitle>
            <AlertDialogDescription>{confirm === "void" ? `A credit note for ${kes(inv.balance, inv.currency)} will be recorded and the invoice closed.` : "The invoice will no longer count towards the student's balance."}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep invoice</AlertDialogCancel><AlertDialogAction onClick={() => (confirm === "void" ? voidInvoice() : cancel())}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
