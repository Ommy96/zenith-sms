import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileDown, Mail, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry, InvoiceStatusChip } from "@/components/finance/shared";
import { PAYMENT_STATUS, kes, methodLabel, refreshSetup, studentName } from "@/lib/finance/format";
import { emailReceiptForPayment, printReceiptForPayment } from "./Payments";

export default function PaymentDetail() {
  const { id } = useParams();
  const { tenant, has_permission } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reverseOpen, setReverseOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: [tenant?.id, "payment", id], enabled: !!tenant?.id && !!id,
    queryFn: async () => {
      const [p, a, r] = await Promise.all([
        supabase.from("payments").select("*, students:student_id(id, first_name, last_name, admission_number)").eq("id", id).maybeSingle(),
        supabase.from("payment_allocations").select("id, amount, invoices:invoice_id(id, invoice_number, total, balance, status)").eq("payment_id", id),
        supabase.from("student_receipts").select("id, receipt_number, issued_at").eq("payment_id", id).maybeSingle(),
      ]);
      if (p.error) throw p.error;
      let receiver: string | null = null;
      if (p.data?.received_by) receiver = (await supabase.from("profiles").select("full_name").eq("id", p.data.received_by).maybeSingle()).data?.full_name ?? null;
      return { p: p.data, allocs: a.data ?? [], receipt: r.data, receiver };
    },
  });

  if (q.isError) return <div className="p-6"><ErrorRetry onRetry={() => q.refetch()} /></div>;
  if (q.isLoading) return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  const p: any = q.data?.p;
  if (!p) return <div className="p-6"><EmptyState title="Payment not found" /></div>;

  const reverse = async () => {
    setBusy(true);
    try {
      const allocs = q.data!.allocs as any[];
      const { error: dErr } = await supabase.from("payment_allocations").delete().eq("payment_id", id);
      if (dErr) throw new Error("Could not release the invoice allocations");
      const { error } = await supabase.from("payments").update({ status: "reversed" }).eq("id", id);
      if (error) throw new Error("Could not reverse the payment");
      await supabase.from("credit_notes").insert({
        tenant_id: tenant!.id, invoice_id: allocs[0]?.invoices?.id ?? null, student_id: p.student_id, amount: Number(p.amount), currency: p.currency,
        reason: "payment_reversal", description: `Reversal of ${p.payment_number}`, status: "approved", approved_by: user?.id, approved_at: new Date().toISOString(),
      });
      await supabase.from("audit_logs").insert({ tenant_id: tenant!.id, actor_user_id: user?.id, actor_type: "staff", action: "payment.reversed", entity_type: "payment", entity_id: id, after: { status: "reversed" } });
      ["payment", "payments", "invoices", "invoice"].forEach((k) => qc.invalidateQueries({ queryKey: [tenant?.id, k] }));
      refreshSetup(tenant!.id);
      toast.success("Payment reversed");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 p-6">
      <Link to="/finance/payments" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-4 w-4" />Payments</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3"><h1 className="text-2xl font-semibold font-mono">{p.payment_number}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${PAYMENT_STATUS[p.status] ?? ""}`}>{p.status}</span></div>
          <p className="text-2xl font-mono mt-1">{kes(p.amount, p.currency)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => printReceiptForPayment(p.id)}><FileDown className="h-4 w-4 mr-1" />Receipt PDF</Button>
          <Button size="sm" variant="outline" onClick={() => emailReceiptForPayment(p.id)}><Mail className="h-4 w-4 mr-1" />Email receipt</Button>
          {p.status === "confirmed" && has_permission("payments.reverse") && <Button size="sm" variant="outline" disabled={busy} onClick={() => setReverseOpen(true)}><Undo2 className="h-4 w-4 mr-1" />Reverse</Button>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Details</CardTitle></CardHeader><CardContent className="text-sm space-y-1.5">
          <Row k="Student" v={<Link className="text-primary hover:underline" to={`/academics/students/${p.student_id}`}>{studentName(p.students)} · {p.students?.admission_number}</Link>} />
          <Row k="Method" v={methodLabel(p.method)} /><Row k="Reference" v={<span className="font-mono">{p.reference ?? "—"}</span>} />
          <Row k="Paid on" v={new Date(p.paid_at).toLocaleString("en-KE")} /><Row k="Payer" v={[p.payer_name, p.payer_phone].filter(Boolean).join(" · ") || "—"} />
          <Row k="Bank account" v={p.bank_account ?? "—"} /><Row k="Received by" v={q.data!.receiver ?? "—"} />
          {p.notes && <Row k="Notes" v={p.notes} />}
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Receipt</CardTitle></CardHeader><CardContent className="text-sm">
          {q.data!.receipt ? <div className="flex items-center justify-between"><div><p className="font-mono">{q.data!.receipt.receipt_number}</p>
            <p className="text-xs text-muted-foreground">Issued {new Date(q.data!.receipt.issued_at).toLocaleString("en-KE")}</p></div>
            <Button size="sm" variant="secondary" onClick={() => printReceiptForPayment(p.id)}>Open PDF</Button></div>
            : <p className="text-muted-foreground">No receipt has been generated for this payment.</p>}
        </CardContent></Card>
      </div>

      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Allocations</CardTitle></CardHeader><CardContent>
        {!q.data!.allocs.length ? <p className="text-sm text-muted-foreground">Not allocated to any invoice.</p> : <Table>
          <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Invoice total</TableHead><TableHead className="text-right">Remaining balance</TableHead><TableHead className="text-right">Allocated</TableHead></TableRow></TableHeader>
          <TableBody>{q.data!.allocs.map((a: any) => (
            <TableRow key={a.id}><TableCell><Link className="font-mono text-xs text-primary hover:underline" to={`/finance/invoices/${a.invoices?.id}`}>{a.invoices?.invoice_number}</Link></TableCell>
              <TableCell><InvoiceStatusChip status={a.invoices?.status} /></TableCell>
              <TableCell className="text-right font-mono">{kes(a.invoices?.total)}</TableCell><TableCell className="text-right font-mono">{kes(a.invoices?.balance)}</TableCell>
              <TableCell className="text-right font-mono font-semibold">{kes(a.amount)}</TableCell></TableRow>
          ))}</TableBody></Table>}
      </CardContent></Card>

      <AlertDialog open={reverseOpen} onOpenChange={setReverseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Reverse this payment?</AlertDialogTitle>
            <AlertDialogDescription>{kes(p.amount, p.currency)} will be removed from the invoices it paid, and an offsetting credit note recorded. This can't be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep payment</AlertDialogCancel><AlertDialogAction onClick={reverse}>Reverse payment</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>;
