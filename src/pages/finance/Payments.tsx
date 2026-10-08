import { useState } from "react";
import { DatePicker } from "@/components/finance/DatePicker";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry, KpiRow } from "@/components/finance/shared";
import { RecordPaymentDialog } from "@/components/finance/RecordPaymentDialog";
import { useInvoices } from "./Invoices";
import { PAYMENT_METHODS, PAYMENT_STATUS, fnError, kes, methodLabel, openSignedPdf, studentName, todayISO } from "@/lib/finance/format";

export async function receiptFor(paymentId: string) {
  const { data } = await supabase.from("student_receipts").select("id, receipt_number").eq("payment_id", paymentId).maybeSingle();
  return data as { id: string; receipt_number: string } | null;
}
export async function printReceiptForPayment(paymentId: string) {
  const r = await receiptFor(paymentId);
  if (!r) return toast.error("No receipt exists for this payment yet");
  try { await openSignedPdf("generate-receipt-pdf", { receipt_id: r.id }, `${r.receipt_number}.pdf`); } catch (e) { toast.error((e as Error).message); }
}
export async function emailReceiptForPayment(paymentId: string) {
  const r = await receiptFor(paymentId);
  if (!r) return toast.error("No receipt exists for this payment yet");
  const { data, error } = await supabase.functions.invoke("email-receipt", { body: { receipt_id: r.id } });
  if (error || (data as any)?.error) {
    const msg = await fnError(error, data, "Could not send the receipt");
    return toast.error(/no email/i.test(msg) ? "Primary guardian has no email. Add one or send SMS instead" : msg);
  }
  toast.success(`Receipt queued for ${(data as any)?.to ?? "the guardian"}`);
}

export default function Payments() {
  const { tenant, has_permission } = useTenant();
  const nav = useNavigate();
  const inv = useInvoices();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ method: "all", status: "all", search: "", from: "", to: "" });

  const q = useQuery({
    queryKey: [tenant?.id, "payments"], enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("payments")
        .select("*, students:student_id(first_name, last_name, admission_number), payment_allocations(amount)")
        .eq("tenant_id", tenant!.id).order("paid_at", { ascending: false });
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((p: any) => p.received_by).filter(Boolean))];
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] };
      const names = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name]));
      return (data ?? []).map((p: any) => ({ ...p, receiver: names[p.received_by] ?? null }));
    },
  });

  const rows = (q.data ?? []).filter((p: any) => {
    if (f.method !== "all" && p.method !== f.method) return false;
    if (f.status !== "all" && p.status !== f.status) return false;
    const d = String(p.paid_at).slice(0, 10);
    if (f.from && d < f.from) return false;
    if (f.to && d > f.to) return false;
    if (f.search) {
      const n = f.search.toLowerCase();
      if (![p.payment_number, p.reference, studentName(p.students), p.students?.admission_number].some((v) => String(v ?? "").toLowerCase().includes(n))) return false;
    }
    return true;
  });
  const received = rows.filter((p: any) => p.status === "confirmed").reduce((a: number, p: any) => a + Number(p.amount), 0);
  const live = (inv.data ?? []).filter((i: any) => !["draft", "cancelled", "written_off"].includes(i.status));
  const today = todayISO();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Payments</h1><p className="text-sm text-muted-foreground">Money received, allocated to invoices, with receipts.</p></div>
        {has_permission("payments.record") && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Record payment</Button>}
      </div>
      <KpiRow items={[
        { label: "Billed", value: live.reduce((a: number, i: any) => a + Number(i.total), 0) },
        { label: "Collected", value: (q.data ?? []).filter((p: any) => p.status === "confirmed").reduce((a: number, p: any) => a + Number(p.amount), 0), tone: "success" },
        { label: "Outstanding", value: live.reduce((a: number, i: any) => a + Number(i.balance), 0), tone: "danger" },
        { label: "Overdue", value: live.filter((i: any) => i.due_date && i.due_date < today).reduce((a: number, i: any) => a + Number(i.balance), 0), tone: "danger" },
      ]} />
      <div className="flex flex-wrap gap-2">
        <Input className="w-64" placeholder="Payment #, student or reference" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
        <Select value={f.method} onValueChange={(v) => setF({ ...f, method: v })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All methods</SelectItem>{PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
        <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{["confirmed", "pending", "reversed", "failed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
        <DatePicker className="w-44" aria-label="From" value={f.from} onChange={(v) => setF({ ...f, from: v })} />
        <DatePicker className="w-44" aria-label="To" value={f.to} onChange={(v) => setF({ ...f, to: v })} />
      </div>

      {q.isError ? <ErrorRetry onRetry={() => q.refetch()} /> : q.isLoading ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? (
        <EmptyState icon={<Wallet className="h-5 w-5" />} title={q.data?.length ? "No payments match these filters" : "No payments yet"} description="Record cash, bank, cheque or M-Pesa payments against student invoices."
          actionLabel={has_permission("payments.record") && !q.data?.length ? "Record payment" : undefined} onAction={() => setOpen(true)} />
      ) : (
        <div className="rounded-lg border"><Table>
          <TableHeader><TableRow>
            <TableHead>Payment #</TableHead><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Allocated</TableHead><TableHead>Received by</TableHead><TableHead>Status</TableHead><TableHead className="w-10" />
          </TableRow></TableHeader>
          <TableBody>{rows.map((p: any) => {
            const alloc = (p.payment_allocations ?? []).reduce((a: number, x: any) => a + Number(x.amount), 0);
            return (
              <TableRow key={p.id}>
                <TableCell><Link to={`/finance/payments/${p.id}`} className="font-mono text-xs text-primary hover:underline">{p.payment_number}</Link></TableCell>
                <TableCell>{new Date(p.paid_at).toLocaleDateString("en-KE")}</TableCell>
                <TableCell><div className="font-medium">{studentName(p.students)}</div><div className="text-xs text-muted-foreground font-mono">{p.students?.admission_number}</div></TableCell>
                <TableCell><span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">{methodLabel(p.method)}</span></TableCell>
                <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{kes(p.amount, p.currency)}</TableCell>
                <TableCell className={`text-right font-mono text-xs ${alloc < Number(p.amount) ? "text-warning" : "text-muted-foreground"}`}>{alloc.toLocaleString("en-KE")} of {Number(p.amount).toLocaleString("en-KE")}</TableCell>
                <TableCell className="text-sm">{p.receiver ?? "—"}</TableCell>
                <TableCell><span className={`rounded-full px-2 py-0.5 text-xs capitalize ${PAYMENT_STATUS[p.status] ?? ""}`}>{p.status}</span></TableCell>
                <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => nav(`/finance/payments/${p.id}`)}>View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => printReceiptForPayment(p.id)}>Receipt PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => emailReceiptForPayment(p.id)}>Email receipt</DropdownMenuItem>
                  </DropdownMenuContent></DropdownMenu></TableCell>
              </TableRow>
            );
          })}</TableBody>
          <TableFooter><TableRow><TableCell colSpan={5} className="text-muted-foreground">Total received (confirmed, filtered)</TableCell>
            <TableCell className="text-right font-mono font-semibold">{kes(received)}</TableCell><TableCell colSpan={4} /></TableRow></TableFooter>
        </Table></div>
      )}
      <RecordPaymentDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
