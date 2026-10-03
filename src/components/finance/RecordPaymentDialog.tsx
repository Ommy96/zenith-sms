import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StudentPicker, useFinanceStudents } from "./shared";
import { PAYMENT_METHODS, kes, numericInput, openSignedPdf, refreshSetup, todayISO } from "@/lib/finance/format";
import { emailReceiptForPayment } from "@/pages/finance/Payments";

export function RecordPaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const students = useFinanceStudents();
  const blank = { student_id: "", amount: "", method: "cash", reference: "", payer_name: "", payer_phone: "", date: todayISO(), bank_account: "", notes: "" };
  const [f, setF] = useState(blank);
  const [alloc, setAlloc] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setF(blank); setAlloc({}); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const outstanding = useQuery({
    queryKey: [tenant?.id, "outstanding", f.student_id], enabled: !!f.student_id,
    queryFn: async () => {
      const [{ data: inv }, { data: g }] = await Promise.all([
        supabase.from("invoices").select("id, invoice_number, issue_date, due_date, balance, total")
          .eq("student_id", f.student_id).in("status", ["issued", "partial", "overdue"]).gt("balance", 0).order("issue_date").order("created_at"),
        supabase.from("student_guardians").select("guardians:guardian_id(full_name, phone_primary)")
          .eq("student_id", f.student_id).order("is_primary_contact", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return { invoices: inv ?? [], guardian: (g as any)?.guardians ?? null };
    },
  });
  useEffect(() => {
    const g = outstanding.data?.guardian;
    if (g) setF((x) => ({ ...x, payer_name: x.payer_name || g.full_name || "", payer_phone: x.payer_phone || g.phone_primary || "" }));
  }, [outstanding.data]);

  // Auto-allocate oldest first whenever the amount or invoices change.
  const autoAllocate = (amountStr: string) => {
    let left = Number(amountStr || 0);
    const next: Record<string, string> = {};
    (outstanding.data?.invoices ?? []).forEach((i: any) => {
      const take = Math.min(left, Number(i.balance)); left -= take;
      next[i.id] = take > 0 ? String(take) : "";
    });
    setAlloc(next);
  };
  useEffect(() => { autoAllocate(f.amount); }, [outstanding.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const amount = Number(f.amount || 0);
  const allocated = Object.values(alloc).reduce((a, v) => a + Number(v || 0), 0);

  const save = async () => {
    if (!f.student_id) return toast.error("Choose a student");
    if (!(amount > 0)) return toast.error("Enter an amount greater than 0");
    if (f.method !== "cash" && !f.reference.trim()) return toast.error("A reference is required for non-cash payments");
    if (allocated > amount + 0.001) return toast.error("Allocations can't exceed the payment amount");
    const over = (outstanding.data?.invoices ?? []).find((i: any) => Number(alloc[i.id] || 0) > Number(i.balance) + 0.001);
    if (over) return toast.error(`Allocation exceeds the balance on ${over.invoice_number}`);
    if (f.payer_phone && !/^\+?\d[\d\s]{8,14}$/.test(f.payer_phone.trim())) return toast.error("Enter a valid payer phone number");
    setSaving(true);
    try {
      const { data: pay, error } = await supabase.from("payments").insert({
        tenant_id: tenant!.id, student_id: f.student_id, amount, currency: tenant?.currency_code ?? "KES", method: f.method,
        reference: f.reference.trim().slice(0, 80) || null, payer_name: f.payer_name.trim().slice(0, 120) || null,
        payer_phone: f.payer_phone.trim() || null, status: "confirmed", paid_at: new Date(`${f.date}T${new Date().toTimeString().slice(0, 8)}`).toISOString(),
        received_by: user?.id ?? null, bank_account: f.bank_account.trim().slice(0, 80) || null, notes: f.notes.trim().slice(0, 500) || null,
        idempotency_key: crypto.randomUUID(),
      }).select("id, payment_number").single();
      if (error) throw new Error("Could not record the payment");
      const rows = Object.entries(alloc).filter(([, v]) => Number(v) > 0).map(([invoice_id, v]) => ({
        tenant_id: tenant!.id, payment_id: pay.id, invoice_id, amount: Number(v), allocated_by: user?.id ?? null,
      }));
      if (rows.length) {
        const { error: aErr } = await supabase.from("payment_allocations").insert(rows);
        if (aErr) toast.error("Payment saved, but allocating it to invoices failed. Open the payment to retry.");
      }
      const { data: rcp, error: rErr } = await supabase.from("student_receipts").insert({
        tenant_id: tenant!.id, payment_id: pay.id, student_id: f.student_id, amount, currency: tenant?.currency_code ?? "KES", issued_by: user?.id ?? null,
      }).select("id, receipt_number").single();
      ["payments", "invoices", "invoice", "outstanding"].forEach((k) => qc.invalidateQueries({ queryKey: [tenant?.id, k] }));
      refreshSetup(tenant!.id);
      onOpenChange(false);
      if (rErr) { toast.success(`Payment ${pay.payment_number} recorded`); return; }
      toast.success(`Payment recorded — receipt ${rcp.receipt_number}`, {
        duration: 12000,
        action: { label: "Print receipt", onClick: () => openSignedPdf("generate-receipt-pdf", { receipt_id: rcp.id }, `${rcp.receipt_number}.pdf`).catch((e) => toast.error(e.message)) },
        cancel: { label: "Email receipt", onClick: () => emailReceiptForPayment(pay.id) },
      });
      nav(`/finance/payments/${pay.id}`);
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Student</Label><StudentPicker value={f.student_id} onChange={(v) => setF({ ...blank, student_id: v, amount: f.amount, method: f.method })} students={students.data ?? []} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount ({tenant?.currency_code ?? "KES"})</Label><Input inputMode="decimal" className="font-mono" value={f.amount}
              onChange={(e) => { const v = numericInput(e.target.value); setF({ ...f, amount: v }); autoAllocate(v); }} /></div>
            <div><Label>Payment date</Label><Input type="date" max={todayISO()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
          </div>
          <div><Label>Method</Label>
            <RadioGroup value={f.method} onValueChange={(v) => setF({ ...f, method: v })} className="flex flex-wrap gap-4 mt-1">
              {PAYMENT_METHODS.map((m) => <label key={m.value} className="flex items-center gap-1.5 text-sm"><RadioGroupItem value={m.value} />{m.label}</label>)}
            </RadioGroup></div>
          {f.method !== "cash" && <div><Label>Reference</Label><Input className="font-mono" maxLength={80} value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value.toUpperCase() })} placeholder={f.method === "mpesa" ? "M-Pesa receipt e.g. MPX7A2B9C" : "Bank ref / cheque #"} /></div>}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Payer name</Label><Input maxLength={120} value={f.payer_name} onChange={(e) => setF({ ...f, payer_name: e.target.value })} /></div>
            <div><Label>Payer phone</Label><Input maxLength={16} value={f.payer_phone} onChange={(e) => setF({ ...f, payer_phone: e.target.value })} /></div>
          </div>
          <div><Label>Bank account received (optional)</Label><Input maxLength={80} value={f.bank_account} onChange={(e) => setF({ ...f, bank_account: e.target.value })} placeholder="e.g. KCB Main 1234" /></div>

          {f.student_id && <div className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between text-sm"><span className="font-medium">Allocate to invoices</span>
              <span className={allocated > amount ? "text-destructive font-mono" : "font-mono text-muted-foreground"}>{kes(allocated)} of {kes(amount)}</span></div>
            {outstanding.isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : !outstanding.data?.invoices.length ? (
              <p className="text-xs text-muted-foreground">No outstanding issued invoices. The payment will be recorded as unallocated credit.</p>
            ) : outstanding.data.invoices.map((i: any) => (
              <div key={i.id} className="grid grid-cols-12 items-center gap-2 text-sm">
                <span className="col-span-3 font-mono text-xs">{i.invoice_number}</span>
                <span className="col-span-3 text-xs text-muted-foreground">{i.issue_date}</span>
                <span className="col-span-3 text-right font-mono text-xs">Bal {kes(i.balance)}</span>
                <Input className="col-span-3 h-8 text-right font-mono" inputMode="decimal" value={alloc[i.id] ?? ""} onChange={(e) => setAlloc({ ...alloc, [i.id]: numericInput(e.target.value) })} />
              </div>
            ))}
          </div>}
          <div><Label>Notes</Label><Textarea maxLength={500} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Record payment"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
