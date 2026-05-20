import { useEffect, useState } from "react";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function PortalFees() {
  const { activeChild } = usePortal();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [currency, setCurrency] = useState("KES");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!activeChild) return;
    (async () => {
      setLoading(true);
      const [{ data: inv }, { data: pay }, { data: t }] = await Promise.all([
        supabase.from("student_invoices").select("*").eq("student_id", activeChild.id).order("issued_at", { ascending: false }),
        supabase.from("student_payments").select("*").eq("student_id", activeChild.id).order("paid_at", { ascending: false }).limit(10),
        supabase.from("tenants").select("currency_code").eq("id", activeChild.tenant_id).maybeSingle(),
      ]);
      setInvoices(inv || []);
      setPayments(pay || []);
      if (t?.currency_code) setCurrency(t.currency_code);
      setLoading(false);
    })();
  }, [activeChild?.id]);

  const balance = invoices.reduce((s, r: any) => s + Number(r.balance || 0), 0);

  const initiateStk = async () => {
    if (!activeChild) return;
    if (!phone || !amount) return toast.error("Enter phone and amount");
    setPaying(true);
    const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
      body: {
        tenant_id: activeChild.tenant_id,
        student_id: activeChild.id,
        phone,
        amount: Number(amount),
        account_reference: activeChild.admission_number || activeChild.id,
      },
    });
    setPaying(false);
    if (error || (data as any)?.error) {
      return toast.error((data as any)?.error || error?.message || "Failed");
    }
    toast.success("Check your phone — enter your M-Pesa PIN to complete");
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <CardContent className="p-5">
          <p className="text-xs opacity-80 uppercase tracking-wide">Total outstanding</p>
          <p className="text-3xl font-bold mt-1">{currency} {balance.toLocaleString()}</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="mt-3 w-full bg-white text-primary hover:bg-white/90"
                onClick={() => setAmount(String(balance || 0))}
                disabled={balance <= 0}
              >
                <Smartphone className="h-4 w-4 mr-2" /> Pay with M-Pesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>M-Pesa STK Push</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Amount ({currency})</label>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
                </div>
                <Button className="w-full" onClick={initiateStk} disabled={paying}>
                  {paying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Send STK Push
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold text-sm mb-2">Invoices</h2>
        <div className="space-y-2">
          {invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
          {invoices.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{inv.invoice_number || "Invoice"}</div>
                  <div className="text-xs text-muted-foreground">
                    Total {currency} {Number(inv.total).toLocaleString()} · Balance {currency} {Number(inv.balance).toLocaleString()}
                  </div>
                </div>
                <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "secondary"}>
                  {inv.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-sm mb-2">Recent payments</h2>
        <div className="space-y-2">
          {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments recorded.</p>}
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{currency} {Number(p.amount).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{p.method?.toUpperCase()} · {p.reference || "—"}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}