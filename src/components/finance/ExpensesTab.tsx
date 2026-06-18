import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Money } from "@/components/Money";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, Download, Check, X, Trash2, Receipt, Building2 } from "lucide-react";

type Row = Record<string, any>;

const METHODS = ["cash", "mpesa", "bank_transfer", "cheque", "card", "other"] as const;
const STATUSES = ["draft", "submitted", "approved", "rejected", "paid", "void"] as const;

const STATUS_BADGE: Record<string, string> = {
  draft: "secondary",
  submitted: "outline",
  approved: "default",
  paid: "default",
  rejected: "destructive",
  void: "secondary",
};

export function ExpensesTab({ tenantId, canManage, canApprove }: { tenantId: string; canManage: boolean; canApprove: boolean }) {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string>(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [showVendor, setShowVendor] = useState(false);
  const [exporting, setExporting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [e, c, v] = await Promise.all([
      supabase.from("expenses" as any).select("*, expense_categories:category_id(name), expense_vendors:vendor_id(name)")
        .eq("tenant_id", tenantId).gte("expense_date", from).lte("expense_date", to)
        .order("expense_date", { ascending: false }).limit(500),
      supabase.from("expense_categories" as any).select("*").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
      supabase.from("expense_vendors" as any).select("*").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
    ]);
    setExpenses((e.data as Row[]) || []);
    setCategories((c.data as Row[]) || []);
    setVendors((v.data as Row[]) || []);
    setLoading(false);
  }, [tenantId, from, to]);

  useEffect(() => { reload(); }, [reload]);

  // Seed default categories if none
  useEffect(() => {
    if (!loading && categories.length === 0 && canManage) {
      supabase.rpc("seed_expense_categories" as any, { _tenant: tenantId }).then(() => reload());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const filtered = useMemo(() => {
    return expenses.filter((x) => {
      if (statusFilter !== "all" && x.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          x.expense_number?.toLowerCase().includes(q) ||
          x.description?.toLowerCase().includes(q) ||
          x.expense_categories?.name?.toLowerCase().includes(q) ||
          x.expense_vendors?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, statusFilter, search]);

  const totals = useMemo(() => {
    const all = filtered.reduce((a, b) => a + Number(b.total_amount || 0), 0);
    const approved = filtered.filter((x) => x.status === "approved" || x.status === "paid").reduce((a, b) => a + Number(b.total_amount || 0), 0);
    const pending = filtered.filter((x) => x.status === "submitted").reduce((a, b) => a + Number(b.total_amount || 0), 0);
    return { all, approved, pending };
  }, [filtered]);

  const setStatus = async (row: Row, action: "submitted" | "approved" | "rejected" | "paid" | "voided") => {
    const status =
      action === "submitted" ? "submitted" :
      action === "approved" ? "approved" :
      action === "rejected" ? "rejected" :
      action === "paid" ? "paid" : "void";
    const updates: any = { status };
    if (action === "approved") { updates.approved_at = new Date().toISOString(); }
    if (action === "paid") { updates.paid_at = new Date().toISOString(); }
    const { error } = await supabase.from("expenses" as any).update(updates).eq("id", row.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await supabase.from("expense_approvals" as any).insert({ tenant_id: tenantId, expense_id: row.id, action });
    toast({ title: `Marked ${status}` });
    reload();
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete expense ${row.expense_number}?`)) return;
    const { error } = await supabase.from("expenses" as any).delete().eq("id", row.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    reload();
  };

  const exportFile = async (format: "csv" | "quickbooks" | "xero") => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("accounting-export", {
        body: { tenant_id: tenantId, from, to, format },
      });
      if (error) throw error;
      const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || `expenses-${from}-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: `${data.row_count} rows` });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total (period)</div>
          <div className="text-2xl font-bold mt-1"><Money amount={totals.all} /></div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Approved & paid</div>
          <div className="text-2xl font-bold mt-1 text-green-600"><Money amount={totals.approved} /></div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Pending approval</div>
          <div className="text-2xl font-bold mt-1 text-amber-600"><Money amount={totals.pending} /></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" />Expenses</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-44" />
            <select className="border rounded px-2 py-1.5 text-sm bg-background" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={() => exportFile("csv")} disabled={exporting}>
              {exporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportFile("quickbooks")} disabled={exporting}>QuickBooks</Button>
            <Button size="sm" variant="outline" onClick={() => exportFile("xero")} disabled={exporting}>Xero</Button>
            {canManage && (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowVendor(true)}><Building2 className="h-3 w-3 mr-1" />Vendor</Button>
                <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />New expense</Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No expenses in this period.</TableCell></TableRow>
              )}
              {filtered.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-mono text-xs">{x.expense_number}</TableCell>
                  <TableCell className="text-xs">{x.expense_date}</TableCell>
                  <TableCell>{x.expense_categories?.name || "—"}</TableCell>
                  <TableCell>{x.expense_vendors?.name || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate" title={x.description}>{x.description}</TableCell>
                  <TableCell className="text-right font-medium"><Money amount={x.total_amount} /></TableCell>
                  <TableCell className="text-xs">{x.payment_method}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[x.status] as any}>{x.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      {canManage && x.status === "draft" && (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(x, "submitted")}>Submit</Button>
                      )}
                      {canApprove && x.status === "submitted" && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => setStatus(x, "approved")} title="Approve"><Check className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setStatus(x, "rejected")} title="Reject"><X className="h-3 w-3" /></Button>
                        </>
                      )}
                      {canManage && x.status === "approved" && (
                        <Button size="sm" variant="ghost" onClick={() => setStatus(x, "paid")}>Mark paid</Button>
                      )}
                      {canManage && (
                        <Button size="icon" variant="ghost" onClick={() => remove(x)}><Trash2 className="h-3 w-3" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ExpenseForm
        open={showForm} onOpenChange={setShowForm} tenantId={tenantId}
        categories={categories} vendors={vendors} onSaved={reload}
      />
      <VendorForm
        open={showVendor} onOpenChange={setShowVendor} tenantId={tenantId} onSaved={reload}
      />
    </div>
  );
}

function ExpenseForm({ open, onOpenChange, tenantId, categories, vendors, onSaved }:
  { open: boolean; onOpenChange: (v: boolean) => void; tenantId: string; categories: Row[]; vendors: Row[]; onSaved: () => void }) {
  const [form, setForm] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    category_id: "", vendor_id: "",
    description: "", amount: 0, tax_amount: 0,
    payment_method: "cash", payment_reference: "", notes: "",
    status: "submitted" as "draft" | "submitted",
  });
  const [saving, setSaving] = useState(false);

  const reset = () => setForm({
    expense_date: new Date().toISOString().slice(0, 10),
    category_id: "", vendor_id: "", description: "", amount: 0, tax_amount: 0,
    payment_method: "cash", payment_reference: "", notes: "", status: "submitted",
  });

  const save = async () => {
    if (!form.description || !form.amount) {
      return toast({ title: "Description and amount required", variant: "destructive" });
    }
    setSaving(true);
    const { error } = await supabase.from("expenses" as any).insert({
      tenant_id: tenantId,
      expense_date: form.expense_date,
      category_id: form.category_id || null,
      vendor_id: form.vendor_id || null,
      description: form.description,
      amount: form.amount,
      tax_amount: form.tax_amount || 0,
      payment_method: form.payment_method as any,
      payment_reference: form.payment_reference || null,
      notes: form.notes || null,
      status: form.status as any,
    });
    setSaving(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Expense recorded" });
    reset();
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>New expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="border rounded px-2 py-1.5 text-sm bg-background md:col-span-2" value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>
              <option value="">Vendor (optional)…</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <Input placeholder="Description" className="md:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input type="number" step="0.01" placeholder="Amount" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            <Input type="number" step="0.01" placeholder="Tax" value={form.tax_amount || ""} onChange={(e) => setForm({ ...form, tax_amount: Number(e.target.value) })} />
            <select className="border rounded px-2 py-1.5 text-sm bg-background" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <Input placeholder="Reference / receipt #" value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} />
            <Textarea className="md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <select className="border rounded px-2 py-1.5 text-sm bg-background md:col-span-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="submitted">Submit for approval</option>
              <option value="draft">Save as draft</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VendorForm({ open, onOpenChange, tenantId, onSaved }:
  { open: boolean; onOpenChange: (v: boolean) => void; tenantId: string; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", contact_phone: "", contact_email: "", tax_pin: "",
    bank_name: "", bank_account: "", mpesa_number: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return toast({ title: "Name required", variant: "destructive" });
    setSaving(true);
    const { error } = await supabase.from("expense_vendors" as any).insert({ tenant_id: tenantId, ...form });
    setSaving(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Vendor added" });
    setForm({ name: "", contact_phone: "", contact_email: "", tax_pin: "", bank_name: "", bank_account: "", mpesa_number: "", notes: "" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add vendor</DialogTitle></DialogHeader>
        <div className="grid gap-2 md:grid-cols-2">
          <Input placeholder="Vendor name" className="md:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          <Input placeholder="Email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          <Input placeholder="KRA PIN" value={form.tax_pin} onChange={(e) => setForm({ ...form, tax_pin: e.target.value })} />
          <Input placeholder="M-Pesa number" value={form.mpesa_number} onChange={(e) => setForm({ ...form, mpesa_number: e.target.value })} />
          <Input placeholder="Bank name" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
          <Input placeholder="Bank account" value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} />
          <Textarea className="md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}