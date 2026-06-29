import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Money } from "@/components/Money";
import {
  Loader2, Plus, Wallet, Receipt, FileText, TrendingUp, AlertCircle,
  Layers, Trash2, Banknote, Bell,
  Users, ReceiptText, Eye, Download,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BursarDashboard } from "@/components/finance/BursarDashboard";
import { RemindersTab } from "@/components/finance/RemindersTab";
import { PayrollTab } from "@/components/finance/PayrollTab";
import { ExpensesTab } from "@/components/finance/ExpensesTab";

const CATEGORIES = ["tuition","transport","boarding","lunch","exam","activity","uniform","book","development","other"] as const;
const METHODS = ["cash","mpesa","airtel_money","bank_transfer","cheque","card","pos","other"] as const;

type Row = Record<string, any>;

export default function Finance() {
  const { user, profile } = useAuth();
  const { can } = useTenant();
  const tenantId = profile?.tenant_id;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "dashboard";

  const [loading, setLoading] = useState(true);
  const [structures, setStructures] = useState<Row[]>([]);
  const [invoices, setInvoices] = useState<Row[]>([]);
  const [payments, setPayments] = useState<Row[]>([]);
  const [students, setStudents] = useState<Row[]>([]);
  const [terms, setTerms] = useState<Row[]>([]);
  const [years, setYears] = useState<Row[]>([]);
  const [grades, setGrades] = useState<Row[]>([]);
  const [stats, setStats] = useState({ billed: 0, collected: 0, outstanding: 0, overdueCount: 0 });

  const reload = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [s, inv, pay, st, t, y, g] = await Promise.all([
      supabase.from("fee_structures").select("*, fee_items(id, name, amount, category)").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase.from("student_invoices").select("*, students:student_id(first_name,last_name,admission_number), terms:term_id(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200),
      supabase.from("student_payments").select("*, students:student_id(first_name,last_name,admission_number)").eq("tenant_id", tenantId).order("paid_at", { ascending: false }).limit(200),
      supabase.from("students").select("id, first_name, last_name, admission_number, current_class_id").eq("tenant_id", tenantId).order("first_name").limit(2000),
      supabase.from("terms").select("id, name, is_current").eq("tenant_id", tenantId),
      supabase.from("academic_years").select("id, name, is_current").eq("tenant_id", tenantId),
      supabase.from("grade_levels").select("id, name").eq("tenant_id", tenantId),
    ]);
    setStructures(s.data || []);
    setInvoices(inv.data || []);
    setPayments(pay.data || []);
    setStudents(st.data || []);
    setTerms(t.data || []);
    setYears(y.data || []);
    setGrades(g.data || []);

    // Stats
    const billed = (inv.data || []).filter((r) => r.status !== "void" && r.status !== "draft").reduce((a, b) => a + Number(b.total || 0), 0);
    const collected = (inv.data || []).reduce((a, b) => a + Number(b.paid_total || 0), 0);
    const outstanding = (inv.data || []).filter((r) => r.status !== "void").reduce((a, b) => a + Number(b.balance || 0), 0);
    const overdueCount = (inv.data || []).filter((r) => r.status === "overdue").length;
    setStats({ billed, collected, outstanding, overdueCount });
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { reload(); }, [reload]);

  // Seed fee categories once
  useEffect(() => {
    if (!tenantId) return;
    supabase.rpc("seed_fee_categories" as any, { _tenant: tenantId }).then(() => {});
  }, [tenantId]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!can("finance.view")) {
    return <div className="p-8 text-sm text-muted-foreground">You do not have access to Finance.</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Finance & Billing</h1>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<FileText className="h-4 w-4" />} label="Billed" value={<Money amount={stats.billed} />} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Collected" value={<Money amount={stats.collected} />} accent="text-green-600" />
        <StatCard icon={<Banknote className="h-4 w-4" />} label="Outstanding" value={<Money amount={stats.outstanding} />} accent="text-amber-600" />
        <StatCard icon={<AlertCircle className="h-4 w-4" />} label="Overdue invoices" value={stats.overdueCount} accent="text-destructive" />
      </div>

      <Tabs value={tabFromUrl} onValueChange={(v) => setSearchParams(v === "dashboard" ? {} : { tab: v })}>
        <TabsList>
          <TabsTrigger value="dashboard"><TrendingUp className="h-3 w-3 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="invoices"><FileText className="h-3 w-3 mr-1" />Invoices</TabsTrigger>
          <TabsTrigger value="payments"><Receipt className="h-3 w-3 mr-1" />Payments</TabsTrigger>
          <TabsTrigger value="structures"><Layers className="h-3 w-3 mr-1" />Fee Structures</TabsTrigger>
          <TabsTrigger value="reminders"><Bell className="h-3 w-3 mr-1" />Reminders</TabsTrigger>
          {can("payroll.view") && <TabsTrigger value="payroll"><Users className="h-3 w-3 mr-1" />Payroll</TabsTrigger>}
          {can("expenses.view") && <TabsTrigger value="expenses"><ReceiptText className="h-3 w-3 mr-1" />Expenses</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <BursarDashboard tenantId={tenantId!} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <InvoicesTab
            tenantId={tenantId!} userId={user?.id}
            invoices={invoices} students={students} structures={structures}
            years={years} terms={terms} canEdit={can("finance.invoice")}
            onChange={reload} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsTab
            tenantId={tenantId!} userId={user?.id}
            payments={payments} students={students} invoices={invoices}
            canRecord={can("finance.payment.record")} onChange={reload} />
        </TabsContent>

        <TabsContent value="structures" className="mt-4">
          <StructuresTab
            tenantId={tenantId!} userId={user?.id}
            structures={structures} years={years} terms={terms} grades={grades}
            canConfigure={can("finance.configure")} onChange={reload} />
        </TabsContent>

        <TabsContent value="reminders" className="mt-4">
          <RemindersTab tenantId={tenantId!} canConfigure={can("finance.configure")} />
        </TabsContent>

        {can("payroll.view") && (
          <TabsContent value="payroll" className="mt-4">
            <PayrollTab tenantId={tenantId!} canManage={can("payroll.manage")} />
          </TabsContent>
        )}

        {can("expenses.view") && (
          <TabsContent value="expenses" className="mt-4">
            <ExpensesTab tenantId={tenantId!} canManage={can("expenses.manage")} canApprove={can("expenses.approve")} />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>{label}</span>{icon}
        </div>
        <div className={`text-2xl font-bold mt-1 ${accent || ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

/* ===================== INVOICES ===================== */

function InvoicesTab({ tenantId, userId, invoices, students, structures, years, terms, canEdit, onChange }:
  { tenantId: string; userId?: string; invoices: Row[]; students: Row[]; structures: Row[]; years: Row[]; terms: Row[]; canEdit: boolean; onChange: () => void }) {

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    student_id: "", structure_id: "", academic_year_id: "", term_id: "",
    due_date: "", notes: "",
    lines: [] as { category: string; description: string; quantity: number; unit_amount: number }[],
  });

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.invoice_number?.toLowerCase().includes(q) ||
          i.students?.first_name?.toLowerCase().includes(q) ||
          i.students?.last_name?.toLowerCase().includes(q) ||
          i.students?.admission_number?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, search, statusFilter]);

  const applyStructure = (structureId: string) => {
    const s = structures.find((x) => x.id === structureId);
    if (!s) return;
    const lines = (s.fee_items || []).map((it: Row) => ({
      category: it.category, description: it.name, quantity: 1, unit_amount: Number(it.amount),
    }));
    setForm((f) => ({ ...f, structure_id: structureId, lines }));
  };

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { category: "tuition", description: "", quantity: 1, unit_amount: 0 }] }));
  const removeLine = (idx: number) => setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));

  const totalPreview = form.lines.reduce((a, l) => a + (Number(l.unit_amount) * Number(l.quantity)), 0);

  const create = async (issue: boolean) => {
    if (!form.student_id || form.lines.length === 0) {
      return toast({ title: "Pick a student and add at least one line", variant: "destructive" });
    }
    const { data: inv, error } = await supabase.from("student_invoices").insert({
      tenant_id: tenantId, student_id: form.student_id, created_by: userId,
      academic_year_id: form.academic_year_id || null, term_id: form.term_id || null,
      structure_id: form.structure_id || null, due_date: form.due_date || null,
      notes: form.notes || null,
      issued_at: issue ? new Date().toISOString().slice(0, 10) : null,
      status: issue ? "issued" : "draft",
    }).select("id").single();
    if (error || !inv) return toast({ title: "Failed", description: error?.message, variant: "destructive" });

    const linesPayload = form.lines.map((l) => ({
      tenant_id: tenantId, invoice_id: inv.id,
      category: l.category as any, description: l.description || "Fee",
      quantity: l.quantity, unit_amount: l.unit_amount,
    }));
    const { error: linesErr } = await supabase.from("student_invoice_lines").insert(linesPayload);
    if (linesErr) return toast({ title: "Lines failed", description: linesErr.message, variant: "destructive" });

    toast({ title: issue ? "Invoice issued" : "Draft saved" });
    setOpen(false);
    setForm({ student_id: "", structure_id: "", academic_year_id: "", term_id: "", due_date: "", notes: "", lines: [] });
    onChange();
  };

  const bulkIssueFromStructure = async (structureId: string) => {
    const s = structures.find((x) => x.id === structureId);
    if (!s) return;
    if (!confirm(`Issue this fee structure to ALL ${students.length} students? An invoice will be created per student.`)) return;
    let success = 0;
    for (const stu of students) {
      const { data: inv, error } = await supabase.from("student_invoices").insert({
        tenant_id: tenantId, student_id: stu.id, created_by: userId,
        academic_year_id: s.academic_year_id, term_id: s.term_id,
        structure_id: s.id, status: "issued",
        issued_at: new Date().toISOString().slice(0, 10),
      }).select("id").single();
      if (error || !inv) continue;
      const linesPayload = (s.fee_items || []).map((it: Row) => ({
        tenant_id: tenantId, invoice_id: inv.id,
        category: it.category as any, description: it.name,
        quantity: 1, unit_amount: Number(it.amount), fee_item_id: it.id,
      }));
      if (linesPayload.length) await supabase.from("student_invoice_lines").insert(linesPayload);
      success++;
    }
    toast({ title: `Issued ${success} invoices` });
    onChange();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Invoices</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <select className="border rounded px-2 py-1.5 text-sm bg-background" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </select>
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New invoice</Button></DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
                      <option value="">Student…</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.admission_number} • {s.first_name} {s.last_name}</option>)}
                    </select>
                    <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.structure_id} onChange={(e) => applyStructure(e.target.value)}>
                      <option value="">Apply fee structure (optional)…</option>
                      {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.academic_year_id} onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })}>
                      <option value="">Academic year…</option>
                      {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                    <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })}>
                      <option value="">Term…</option>
                      {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <Input type="date" placeholder="Due date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                  </div>

                  <div className="rounded border">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <div className="text-sm font-medium">Line items</div>
                      <Button size="sm" variant="ghost" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Line</Button>
                    </div>
                    {form.lines.length === 0 && <div className="text-xs text-muted-foreground p-3">No lines yet.</div>}
                    {form.lines.map((l, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-1 p-2 border-b last:border-b-0">
                        <select className="col-span-3 border rounded px-2 py-1 text-sm bg-background"
                          value={l.category} onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((x, i) => i === idx ? { ...x, category: e.target.value } : x) }))}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Input className="col-span-5" placeholder="Description" value={l.description}
                          onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((x, i) => i === idx ? { ...x, description: e.target.value } : x) }))} />
                        <Input className="col-span-1" type="number" value={l.quantity} step="1"
                          onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((x, i) => i === idx ? { ...x, quantity: Number(e.target.value) } : x) }))} />
                        <Input className="col-span-2" type="number" placeholder="Amount" value={l.unit_amount} step="0.01"
                          onChange={(e) => setForm((f) => ({ ...f, lines: f.lines.map((x, i) => i === idx ? { ...x, unit_amount: Number(e.target.value) } : x) }))} />
                        <Button className="col-span-1" size="icon" variant="ghost" onClick={() => removeLine(idx)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                    <div className="flex justify-end p-2 text-sm font-medium border-t">
                      Total: <Money amount={totalPreview} className="ml-2" />
                    </div>
                  </div>

                  <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => create(false)}>Save draft</Button>
                  <Button onClick={() => create(true)}>Issue invoice</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {canEdit && structures.length > 0 && (
            <select className="border rounded px-2 py-1.5 text-sm bg-background" defaultValue=""
              onChange={(e) => { if (e.target.value) { bulkIssueFromStructure(e.target.value); e.target.value = ""; } }}>
              <option value="">Bulk issue…</option>
              {structures.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Student</TableHead>
              <TableHead>Term</TableHead><TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead>
              <TableHead>Due</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No invoices.</TableCell></TableRow>
            )}
            {filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                <TableCell>{i.students?.first_name} {i.students?.last_name}<div className="text-xs text-muted-foreground">{i.students?.admission_number}</div></TableCell>
                <TableCell className="text-xs">{i.terms?.name || "—"}</TableCell>
                <TableCell className="text-right"><Money amount={Number(i.total)} /></TableCell>
                <TableCell className="text-right"><Money amount={Number(i.paid_total)} /></TableCell>
                <TableCell className="text-right font-medium"><Money amount={Number(i.balance)} /></TableCell>
                <TableCell className="text-xs">{i.due_date || "—"}</TableCell>
                <TableCell>
                  <Badge variant={
                    i.status === "paid" ? "default" :
                    i.status === "overdue" ? "destructive" :
                    i.status === "void" ? "outline" : "secondary"
                  }>{i.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ===================== PAYMENTS ===================== */

function PaymentsTab({ tenantId, userId, payments, students, invoices, canRecord, onChange }:
  { tenantId: string; userId?: string; payments: Row[]; students: Row[]; invoices: Row[]; canRecord: boolean; onChange: () => void }) {

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: "", amount: "", method: "cash", reference: "", notes: "",
    invoice_id: "",
  });

  const studentInvoices = useMemo(() => {
    if (!form.student_id) return [];
    return invoices.filter((i) => i.student_id === form.student_id && Number(i.balance) > 0);
  }, [invoices, form.student_id]);

  const record = async () => {
    if (!form.student_id || !form.amount) return toast({ title: "Student and amount required", variant: "destructive" });
    const amt = Number(form.amount);
    if (amt <= 0) return toast({ title: "Amount must be > 0", variant: "destructive" });

    const { data: pay, error } = await supabase.from("student_payments").insert({
      tenant_id: tenantId, student_id: form.student_id, received_by: userId,
      amount: amt, method: form.method as any,
      reference: form.reference || null, notes: form.notes || null,
    }).select("id").single();
    if (error || !pay) return toast({ title: "Failed", description: error?.message, variant: "destructive" });

    // Allocate
    let remaining = amt;
    const targets = form.invoice_id
      ? studentInvoices.filter((i) => i.id === form.invoice_id)
      : studentInvoices.slice().sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
    const allocs: any[] = [];
    for (const inv of targets) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, Number(inv.balance));
      allocs.push({ tenant_id: tenantId, payment_id: pay.id, invoice_id: inv.id, amount: take });
      remaining -= take;
    }
    if (allocs.length) await supabase.from("payment_allocations").insert(allocs);

    // Receipt row (DB trigger fills receipt_number)
    const { data: rcp } = await supabase
      .from("student_receipts")
      .insert({ tenant_id: tenantId, payment_id: pay.id, receipt_number: "" })
      .select("id")
      .single();

    // Fire-and-forget PDF generation so the bursar can print/share immediately.
    if (rcp?.id) {
      supabase.functions.invoke("generate-receipt-pdf", { body: { receipt_id: rcp.id } })
        .catch(() => { /* non-blocking */ });
    }

    toast({ title: "Payment recorded", description: remaining > 0 ? `Unallocated: ${remaining.toFixed(2)}` : "All allocated" });
    setOpen(false);
    setForm({ student_id: "", amount: "", method: "cash", reference: "", notes: "", invoice_id: "" });
    onChange();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Payments</CardTitle>
        {canRecord && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Record payment</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value, invoice_id: "" })}>
                  <option value="">Student…</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.admission_number} • {s.first_name} {s.last_name}</option>)}
                </select>
                {studentInvoices.length > 0 && (
                  <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })}>
                    <option value="">Auto-allocate to oldest outstanding</option>
                    {studentInvoices.map((i) => <option key={i.id} value={i.id}>{i.invoice_number} — bal {i.balance}</option>)}
                  </select>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <Input placeholder="Reference (M-Pesa code, cheque #, etc.)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                <Textarea placeholder="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <DialogFooter><Button onClick={record}>Record & issue receipt</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments yet.</TableCell></TableRow>}
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{new Date(p.paid_at).toLocaleDateString()}</TableCell>
                <TableCell>{p.students?.first_name} {p.students?.last_name}<div className="text-xs text-muted-foreground">{p.students?.admission_number}</div></TableCell>
                <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{p.reference || "—"}</TableCell>
                <TableCell className="text-right font-medium"><Money amount={Number(p.amount)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ===================== STRUCTURES ===================== */

function StructuresTab({ tenantId, userId, structures, years, terms, canConfigure, onChange }:
  { tenantId: string; userId?: string; structures: Row[]; years: Row[]; terms: Row[]; grades: Row[]; canConfigure: boolean; onChange: () => void }) {

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", academic_year_id: "", term_id: "", currency: "KES",
    items: [] as { category: string; name: string; amount: number; is_mandatory: boolean }[],
  });

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { category: "tuition", name: "", amount: 0, is_mandatory: true }] }));
  const removeItem = (idx: number) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const save = async () => {
    if (!form.name) return toast({ title: "Name required", variant: "destructive" });
    const { data: s, error } = await supabase.from("fee_structures").insert({
      tenant_id: tenantId, name: form.name, created_by: userId,
      academic_year_id: form.academic_year_id || null,
      term_id: form.term_id || null, currency: form.currency,
    }).select("id").single();
    if (error || !s) return toast({ title: "Failed", description: error?.message, variant: "destructive" });
    if (form.items.length) {
      await supabase.from("fee_items").insert(form.items.map((it, idx) => ({
        tenant_id: tenantId, structure_id: s.id,
        category: it.category as any, name: it.name || "Item",
        amount: it.amount, is_mandatory: it.is_mandatory, sort_order: idx,
      })));
    }
    toast({ title: "Saved" });
    setOpen(false);
    setForm({ name: "", academic_year_id: "", term_id: "", currency: "KES", items: [] });
    onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this fee structure?")) return;
    await supabase.from("fee_structures").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-3">
      {canConfigure && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />New structure</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New fee structure</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Input placeholder="Name (e.g. 'Form 1 — Term 1 2026')" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-3 gap-2">
                  <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.academic_year_id} onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })}>
                    <option value="">Year…</option>
                    {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                  <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })}>
                    <option value="">Term…</option>
                    {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <Input placeholder="KES" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                </div>
                <div className="rounded border">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <div className="text-sm font-medium">Items</div>
                    <Button size="sm" variant="ghost" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Item</Button>
                  </div>
                  {form.items.length === 0 && <div className="text-xs text-muted-foreground p-3">No items yet.</div>}
                  {form.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1 p-2 border-b last:border-b-0">
                      <select className="col-span-3 border rounded px-2 py-1 text-sm bg-background" value={it.category}
                        onChange={(e) => setForm((f) => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, category: e.target.value } : x) }))}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <Input className="col-span-6" placeholder="Item name" value={it.name}
                        onChange={(e) => setForm((f) => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, name: e.target.value } : x) }))} />
                      <Input className="col-span-2" type="number" value={it.amount}
                        onChange={(e) => setForm((f) => ({ ...f, items: f.items.map((x, i) => i === idx ? { ...x, amount: Number(e.target.value) } : x) }))} />
                      <Button className="col-span-1" size="icon" variant="ghost" onClick={() => removeItem(idx)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter><Button onClick={save}>Save structure</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {structures.length === 0 && <div className="text-sm text-muted-foreground py-8 text-center md:col-span-2">No fee structures yet. Create one to start billing.</div>}
        {structures.map((s) => {
          const total = (s.fee_items || []).reduce((a: number, b: Row) => a + Number(b.amount), 0);
          return (
            <Card key={s.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">{s.currency} • {s.fee_items?.length || 0} items</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-bold"><Money amount={total} currency={s.currency} /></div>
                  {canConfigure && <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {(s.fee_items || []).map((it: Row) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <span><Badge variant="outline" className="mr-1 text-xs">{it.category}</Badge>{it.name}</span>
                    <Money amount={Number(it.amount)} currency={s.currency} />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}