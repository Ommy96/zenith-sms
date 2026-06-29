import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Smartphone, Copy, Check, Loader2, Eye, EyeOff, Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type MpesaConfig = {
  id?: string;
  tenant_id: string;
  environment: string;
  shortcode: string | null;
  shortcode_type: string;
  consumer_key: string | null;
  consumer_secret: string | null;
  passkey: string | null;
  initiator_name: string | null;
  is_active: boolean;
};

type MpesaTx = {
  id: string;
  mpesa_receipt: string;
  transaction_time: string;
  amount: number;
  phone: string | null;
  account_reference: string | null;
  matched_student_id: string | null;
  status: string;
  first_name?: string | null;
  last_name?: string | null;
};

type StkRow = {
  id: string;
  created_at: string;
  phone: string;
  amount: number;
  status: string;
  result_desc: string | null;
  mpesa_receipt: string | null;
};

type StudentLite = { id: string; first_name: string; last_name: string; admission_number: string | null };
type InvoiceLite = { id: string; total: number; paid_total: number; balance: number; status: string | null; invoice_number: string | null; student_id: string };

const sb = supabase as any;

export default function MobileMoney() {
  const { profile } = useAuth();
  const schoolId = profile?.tenant_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mobile Money</h1>
          <p className="text-sm text-muted-foreground">Safaricom M-Pesa Daraja integration</p>
        </div>
      </div>

      {!schoolId ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No school context.</CardContent></Card>
      ) : (
        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="stk">STK Push</TabsTrigger>
          </TabsList>
          <TabsContent value="config" className="mt-4"><ConfigTab schoolId={schoolId} /></TabsContent>
          <TabsContent value="transactions" className="mt-4"><TransactionsTab schoolId={schoolId} /></TabsContent>
          <TabsContent value="stk" className="mt-4"><StkTab schoolId={schoolId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* -------------------- Configuration -------------------- */
function ConfigTab({ schoolId }: { schoolId: string }) {
  const [cfg, setCfg] = useState<MpesaConfig>({
    tenant_id: schoolId, environment: "sandbox", shortcode: "", shortcode_type: "paybill",
    consumer_key: "", consumer_secret: "", passkey: "", initiator_name: "", is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [copied, setCopied] = useState(false);

  // SECURITY: callback URL no longer encodes the tenant. Tenant routing now
  // happens server-side via the BusinessShortCode in Safaricom's payload.
  const callbackUrl = useMemo(() => {
    const base = (import.meta as any).env.VITE_SUPABASE_URL;
    return `${base}/functions/v1/mpesa-c2b-callback`;
  }, []);

  const consumerKeyValid = !cfg.consumer_key || /^[A-Za-z0-9]{25,50}$/.test(cfg.consumer_key);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("mpesa_config").select("*").eq("tenant_id", schoolId).maybeSingle();
    if (data) setCfg({ ...cfg, ...data });
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (cfg.consumer_key && !consumerKeyValid) {
      return toast({
        title: "Invalid Consumer Key",
        description: "Must be 25–50 alphanumeric characters (no spaces or symbols).",
        variant: "destructive",
      });
    }
    setSaving(true);
    const payload = { ...cfg, tenant_id: schoolId };
    const { error } = await sb.from("mpesa_config").upsert(payload, { onConflict: "tenant_id" });
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: "M-Pesa configuration updated." });
  };

  const testConnection = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("mpesa-test-connection");
    setTesting(false);
    if (error) return toast({ title: "Test failed", description: error.message, variant: "destructive" });
    if ((data as any)?.ok) toast({ title: "Connected", description: `Daraja ${(data as any).environment} reachable.` });
    else toast({ title: "Connection failed", description: JSON.stringify((data as any)?.error ?? data), variant: "destructive" });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(callbackUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle>Daraja API credentials</CardTitle>
          <CardDescription>Stored privately for your school. Only admins can read or update.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-900 dark:text-amber-200">
            <strong>Action required:</strong> If you previously registered your callback URL with Safaricom,
            please re-register it using the new URL below for proper tenant routing.
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select value={cfg.environment} onValueChange={(v) => setCfg({ ...cfg, environment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Shortcode type</Label>
              <Select value={cfg.shortcode_type} onValueChange={(v) => setCfg({ ...cfg, shortcode_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paybill">Paybill</SelectItem>
                  <SelectItem value="till">Till (Buy Goods)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paybill / Till number</Label>
              <Input value={cfg.shortcode ?? ""} onChange={(e) => setCfg({ ...cfg, shortcode: e.target.value })} placeholder="e.g. 174379" />
            </div>
            <div className="space-y-2">
              <Label>Initiator name (optional)</Label>
              <Input
                value={cfg.initiator_name ?? ""}
                onChange={(e) => setCfg({ ...cfg, initiator_name: e.target.value })}
                autoComplete="off"
                data-form-type="other"
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Consumer Key</Label>
              <Input
                value={cfg.consumer_key ?? ""}
                onChange={(e) => setCfg({ ...cfg, consumer_key: e.target.value.replace(/\s+/g, "") })}
                autoComplete="off"
                data-form-type="other"
                spellCheck={false}
                pattern="[A-Za-z0-9]{25,50}"
                maxLength={50}
                aria-invalid={!consumerKeyValid}
              />
              {!consumerKeyValid && (
                <p className="text-xs text-destructive">25–50 alphanumeric characters, no spaces or symbols.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Consumer Secret</Label>
              <div className="flex gap-2">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={cfg.consumer_secret ?? ""}
                  onChange={(e) => setCfg({ ...cfg, consumer_secret: e.target.value.replace(/\s+/g, "") })}
                  autoComplete="off"
                  data-form-type="other"
                  spellCheck={false}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Passkey (Lipa Na M-Pesa Online)</Label>
              <div className="flex gap-2">
                <Input
                  type={showPasskey ? "text" : "password"}
                  value={cfg.passkey ?? ""}
                  onChange={(e) => setCfg({ ...cfg, passkey: e.target.value.replace(/\s+/g, "") })}
                  autoComplete="off"
                  data-form-type="other"
                  spellCheck={false}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowPasskey(!showPasskey)}>
                  {showPasskey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>C2B Callback URL</Label>
              <div className="flex gap-2">
                <Input value={callbackUrl} readOnly className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={copy}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Register this single URL with Safaricom for both Validation and Confirmation. Tenant routing is resolved
                from the <code className="font-mono">BusinessShortCode</code> in the callback payload — your Paybill/Till
                number must be saved above before registering.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save configuration
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Test connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* -------------------- Transactions -------------------- */
function TransactionsTab({ schoolId }: { schoolId: string }) {
  const [rows, setRows] = useState<MpesaTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [minAmt, setMinAmt] = useState<string>("");
  const [maxAmt, setMaxAmt] = useState<string>("");
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [matchOpen, setMatchOpen] = useState<MpesaTx | null>(null);
  const [matchStudent, setMatchStudent] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from("mpesa_transactions").select("*").eq("tenant_id", schoolId).order("transaction_time", { ascending: false }).limit(200);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (from) q = q.gte("transaction_time", new Date(from).toISOString());
    if (to) q = q.lte("transaction_time", new Date(to + "T23:59:59").toISOString());
    if (minAmt) q = q.gte("amount", Number(minAmt));
    if (maxAmt) q = q.lte("amount", Number(maxAmt));
    const { data } = await q;
    setRows((data as MpesaTx[]) ?? []);
    setLoading(false);
  }, [schoolId, statusFilter, from, to, minAmt, maxAmt]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    sb.from("students").select("id, first_name, last_name, admission_number").eq("tenant_id", schoolId).order("first_name").then(({ data }: any) => setStudents(data ?? []));
    const ch = supabase.channel("mpesa_tx_" + schoolId)
      .on("postgres_changes", { event: "*", schema: "public", table: "mpesa_transactions", filter: `tenant_id=eq.${schoolId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const studentName = (id: string | null) => {
    if (!id) return "—";
    const s = students.find((x) => x.id === id);
    return s ? `${s.first_name} ${s.last_name}` : "—";
  };

  const saveMatch = async () => {
    if (!matchOpen || !matchStudent) return;
    // Calls the SQL function that atomically creates a payment, allocates
    // it to the oldest outstanding invoice, generates a receipt, and marks
    // the transaction as matched. Idempotent on the M-Pesa receipt number.
    const { error } = await sb.rpc("manual_reconcile_mpesa", {
      _txn: matchOpen.id, _student: matchStudent, _invoice: null,
    });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Reconciled", description: "Payment posted and receipt issued." });
      setMatchOpen(null); setMatchStudent(""); load();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-5 gap-3">
            <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                  <SelectItem value="reversed">Reversed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Min amount</Label><Input type="number" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} /></div>
            <div><Label className="text-xs">Max amount</Label><Input type="number" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Account ref</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No transactions yet.</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.transaction_time).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{r.mpesa_receipt}</TableCell>
                  <TableCell>{r.phone ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell>{r.account_reference ?? "—"}</TableCell>
                  <TableCell>{studentName(r.matched_student_id)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      r.status === "matched" ? "bg-success/10 text-success border-success/20" :
                      r.status === "reversed" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      "bg-warning/10 text-warning border-warning/20"
                    }>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status !== "matched" && (
                      <Button size="sm" variant="outline" onClick={() => { setMatchOpen(r); setMatchStudent(""); }}>Match</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!matchOpen} onOpenChange={(o) => !o && setMatchOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Match transaction to student</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Receipt <span className="font-mono">{matchOpen?.mpesa_receipt}</span> · {Number(matchOpen?.amount ?? 0).toLocaleString()} · ref {matchOpen?.account_reference ?? "—"}
            </div>
            <Select value={matchStudent} onValueChange={setMatchStudent}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}{s.admission_number ? ` · ${s.admission_number}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchOpen(null)}>Cancel</Button>
            <Button onClick={saveMatch} disabled={!matchStudent}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* -------------------- STK Push -------------------- */
function StkTab({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [studentId, setStudentId] = useState("");
  const [invoices, setInvoices] = useState<InvoiceLite[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<StkRow[]>([]);

  const loadHistory = useCallback(async () => {
    const { data } = await sb.from("mpesa_stk_requests").select("*").eq("tenant_id", schoolId).order("created_at", { ascending: false }).limit(50);
    setHistory((data as StkRow[]) ?? []);
  }, [schoolId]);

  useEffect(() => {
    sb.from("students").select("id, first_name, last_name, admission_number").eq("tenant_id", schoolId).order("first_name").then(({ data }: any) => setStudents(data ?? []));
    loadHistory();
    const ch = supabase.channel("stk_" + schoolId)
      .on("postgres_changes", { event: "*", schema: "public", table: "mpesa_stk_requests", filter: `tenant_id=eq.${schoolId}` }, () => loadHistory())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [schoolId, loadHistory]);

  useEffect(() => {
    if (!studentId) { setInvoices([]); setInvoiceId(""); return; }
    sb.from("student_invoices")
      .select("id, total, paid_total, balance, status, invoice_number, student_id")
      .eq("tenant_id", schoolId).eq("student_id", studentId)
      .gt("balance", 0).not("status", "in", "(void,draft,paid)")
      .order("due_date", { ascending: true })
      .then(({ data }: any) => setInvoices(data ?? []));
    sb.from("students").select("guardian_phone, phone").eq("id", studentId).maybeSingle().then(({ data }: any) => {
      if (data && !phone) setPhone(data.guardian_phone || data.phone || "");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) setAmount(String(Math.max(0, Number(inv.balance))));
  }, [invoiceId, invoices]);

  const send = async () => {
    if (!phone || !amount) return toast({ title: "Missing fields", description: "Phone and amount required.", variant: "destructive" });
    setSending(true);
    const inv = invoices.find((i) => i.id === invoiceId);
    const student = students.find((s) => s.id === studentId);
    const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
      body: {
        phone, amount: Number(amount),
        invoice_id: invoiceId || null, student_id: studentId || null,
        account_reference: inv?.invoice_number || student?.admission_number || "Fees",
      },
    });
    setSending(false);
    if (error) return toast({ title: "STK failed", description: error.message, variant: "destructive" });
    if ((data as any)?.ok) toast({ title: "STK sent", description: "Prompt delivered to phone." });
    else toast({ title: "STK rejected", description: JSON.stringify((data as any)?.response ?? data), variant: "destructive" });
    loadHistory();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Initiate STK Push</CardTitle><CardDescription>Push a payment prompt to a parent's phone for an invoice.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student (optional)" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name}{s.admission_number ? ` · ${s.admission_number}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Invoice (unpaid)</Label>
              <Select value={invoiceId} onValueChange={setInvoiceId} disabled={!studentId || invoices.length === 0}>
                <SelectTrigger><SelectValue placeholder={studentId ? (invoices.length ? "Select invoice" : "No unpaid invoices") : "Pick a student first"} /></SelectTrigger>
                <SelectContent>
                  {invoices.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.invoice_number ?? i.id.slice(0, 8)} · bal {Number(i.balance).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2547XXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <Button onClick={send} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send STK Push
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent requests</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead><TableHead>Receipt</TableHead><TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No STK requests yet.</TableCell></TableRow>
              ) : history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-xs">{new Date(h.created_at).toLocaleString()}</TableCell>
                  <TableCell>{h.phone}</TableCell>
                  <TableCell className="text-right">{Number(h.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      h.status === "success" ? "bg-success/10 text-success border-success/20" :
                      h.status === "pending" ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-destructive/10 text-destructive border-destructive/20"
                    }>{h.status}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.mpesa_receipt ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{h.result_desc ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}