import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { downloadDocument } from "@/lib/downloadDocument";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Download, FileText, Loader2, Receipt, Smartphone } from "lucide-react";
import { money, shortDate, buildLedger } from "@/lib/portal/format";
import { usePortalData, must } from "@/lib/portal/usePortalData";
import { ListSkeleton, PageTitle, PortalEmpty, PortalError, StaleNote } from "@/components/portal/PortalStates";
import { MpesaPayDialog } from "@/components/portal/MpesaPayDialog";

const statusVariant = (s: string) =>
  s === "paid" ? "bg-success/15 text-success" : s === "overdue" ? "bg-destructive/15 text-destructive"
    : s === "partial" || s === "partially_paid" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground";

export default function PortalFees() {
  const { activeChild, currency } = usePortal();
  const [params] = useSearchParams();
  const [openInv, setOpenInv] = useState<any | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, loading, error, cachedAt, retry } = usePortalData(
    activeChild ? `fees:${activeChild.id}` : null,
    async () => {
      const id = activeChild!.id;
      const [inv, pay, rcp, term] = await Promise.all([
        supabase.from("invoices").select("id, invoice_number, issue_date, due_date, total, amount_paid, balance, status, created_at")
          .eq("student_id", id).neq("status", "cancelled").order("issue_date", { ascending: false }),
        supabase.from("payments").select("id, amount, method, reference, paid_at").eq("student_id", id).order("paid_at", { ascending: false }),
        supabase.from("student_receipts").select("id, payment_id, receipt_number").eq("student_id", id),
        supabase.from("terms").select("start_date, end_date").eq("tenant_id", activeChild!.tenant_id).eq("is_current", true).maybeSingle(),
      ]);
      return { invoices: must<any[]>(inv), payments: must<any[]>(pay), receipts: must<any[]>(rcp), term: term.data };
    },
  );

  const dl = async (kind: "invoice" | "receipt" | "statement", id: string, key: string) => {
    setBusy(key);
    try { await downloadDocument(kind, id, `${kind}.pdf`); }
    catch { toast.error("Download failed. Please try again."); }
    setBusy(null);
  };

  if (!activeChild) return null;
  const invoices = data?.invoices ?? [], payments = data?.payments ?? [];
  const balance = invoices.reduce((s, r) => s + Number(r.balance || 0), 0);
  const t = data?.term;
  const paidTerm = payments.filter((p) => !t || (p.paid_at.slice(0, 10) >= t.start_date && p.paid_at.slice(0, 10) <= t.end_date))
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const nextDue = invoices.filter((i) => i.due_date && i.due_date >= today && Number(i.balance) > 0)
    .map((i) => i.due_date).sort()[0];
  const receiptFor = (pid: string) => data?.receipts.find((r) => r.payment_id === pid);
  const ledger = buildLedger(invoices, payments);

  return (
    <div className="space-y-4">
      <PageTitle sub={activeChild.full_name}>Fees</PageTitle>
      <StaleNote at={cachedAt} onRetry={retry} />
      {loading && !data ? <ListSkeleton rows={3} /> : error && !data ? <PortalError onRetry={retry} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Card className="col-span-2 sm:col-span-1"><CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Current balance</p>
              <p className={`text-2xl font-bold ${balance > 0 ? "text-primary" : "text-success"}`}>{balance > 0 ? money(balance, currency) : "Fully paid"}</p>
              {balance > 0 && (
                <MpesaPayDialog amount={balance}>
                  <Button size="sm" className="mt-2 min-h-11 w-full"><Smartphone className="mr-2 h-4 w-4" /> Pay via M-Pesa</Button>
                </MpesaPayDialog>
              )}
            </CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Paid this term</p><p className="text-xl font-bold">{money(paidTerm, currency)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Next due date</p><p className="text-xl font-bold">{nextDue ? shortDate(nextDue) : "None"}</p></CardContent></Card>
          </div>

          <Tabs defaultValue={params.get("tab") || "invoices"}>
            <TabsList className="grid h-12 w-full grid-cols-3">
              <TabsTrigger value="invoices" className="h-10 text-base">Invoices</TabsTrigger>
              <TabsTrigger value="payments" className="h-10 text-base">Payments</TabsTrigger>
              <TabsTrigger value="statement" className="h-10 text-base">Statement</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="space-y-2">
              {!invoices.length ? <PortalEmpty icon={FileText} title="No invoices yet" /> : invoices.map((inv) => (
                <button key={inv.id} onClick={() => setOpenInv(inv)} className="w-full text-left">
                  <Card className="hover:border-primary transition"><CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base">{inv.invoice_number}</span>
                      <Badge className={`border-0 ${statusVariant(inv.status)}`}>{inv.status?.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-x-3 text-sm text-muted-foreground">
                      <span>Issued {shortDate(inv.issue_date)}</span><span>Due {shortDate(inv.due_date)}</span>
                      <span>Total {money(inv.total, currency)}</span><span>Paid {money(inv.amount_paid, currency)}</span>
                    </div>
                    <p className="mt-1 text-base font-semibold">Balance {money(inv.balance, currency)}</p>
                  </CardContent></Card>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="payments" className="space-y-2">
              {!payments.length ? <PortalEmpty icon={Receipt} title="No payments recorded" /> : payments.map((p) => {
                const r = receiptFor(p.id);
                return (
                  <Card key={p.id}><CardContent className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <p className="text-base font-semibold">{money(p.amount, currency)}</p>
                      <p className="truncate text-sm text-muted-foreground">{shortDate(p.paid_at)} · {p.method?.toUpperCase()} · <span className="font-mono">{p.reference || "—"}</span></p>
                    </div>
                    {r ? (
                      <Button variant="outline" className="min-h-11 shrink-0" disabled={busy === p.id} onClick={() => dl("receipt", r.id, p.id)}>
                        {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}<span className="ml-1">Receipt</span>
                      </Button>
                    ) : <span className="text-sm text-muted-foreground">Receipt pending</span>}
                  </CardContent></Card>
                );
              })}
            </TabsContent>

            <TabsContent value="statement" className="space-y-3">
              <Button className="min-h-12 w-full text-base" disabled={busy === "st"} onClick={() => dl("statement", activeChild.id, "st")}>
                {busy === "st" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Download full statement
              </Button>
              {!ledger.length ? <PortalEmpty icon={FileText} title="Nothing to show yet" /> : (
                <Card><CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-muted-foreground">
                      <tr><th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2 text-right">Debit</th><th className="p-2 text-right">Credit</th><th className="p-2 text-right">Balance</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {ledger.map((r, i) => (
                        <tr key={i}>
                          <td className="whitespace-nowrap p-2">{shortDate(r.date)}</td>
                          <td className="p-2">{r.description}</td>
                          <td className="whitespace-nowrap p-2 text-right font-mono">{r.debit ? money(r.debit, "") : ""}</td>
                          <td className="whitespace-nowrap p-2 text-right font-mono text-success">{r.credit ? money(r.credit, "") : ""}</td>
                          <td className="whitespace-nowrap p-2 text-right font-mono font-semibold">{money(r.balance, "")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      <Sheet open={!!openInv} onOpenChange={(o) => !o && setOpenInv(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          {openInv && (<>
            <SheetHeader><SheetTitle className="font-mono">{openInv.invoice_number}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-2 text-base">
              <div className="flex justify-between"><span className="text-muted-foreground">Issued</span><span>{shortDate(openInv.issue_date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span>{shortDate(openInv.due_date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>{money(openInv.total, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>{money(openInv.amount_paid, currency)}</span></div>
              <div className="flex justify-between font-semibold"><span>Balance</span><span className="text-primary">{money(openInv.balance, currency)}</span></div>
              <Button className="mt-3 min-h-12 w-full text-base" disabled={busy === openInv.id} onClick={() => dl("invoice", openInv.id, openInv.id)}>
                {busy === openInv.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Download invoice
              </Button>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
