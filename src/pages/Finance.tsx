import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle, ArrowUpRight,
  Search, Download, Plus, MoreHorizontal, Edit, Trash2, Eye,
  ChevronLeft, ChevronRight, Loader2, Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices">;
type StudentOption = { id: string; first_name: string; last_name: string; grade: string | null };

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const emptyForm = {
  student_id: "",
  amount: "",
  description: "",
  due_date: "",
  term: "",
  academic_year: "",
  status: "pending",
  paid_amount: "0",
  currency: "USD",
};

export default function Finance() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;

  const [invoices, setInvoices] = useState<(Invoice & { student?: { first_name: string; last_name: string; grade: string | null } })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Stats
  const [stats, setStats] = useState({ totalAmount: 0, collected: 0, outstanding: 0, overdue: 0, overdueCount: 0, pendingCount: 0 });

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<(typeof invoices)[0] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase.from("invoices").select("amount, paid_amount, status").eq("school_id", schoolId);
    if (data) {
      const totalAmount = data.reduce((s, i) => s + Number(i.amount), 0);
      const collected = data.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
      const outstanding = totalAmount - collected;
      const overdue = data.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.amount) - Number(i.paid_amount || 0), 0);
      const overdueCount = data.filter((i) => i.status === "overdue").length;
      const pendingCount = data.filter((i) => i.status === "pending").length;
      setStats({ totalAmount, collected, outstanding, overdue, overdueCount, pendingCount });
    }
  }, [schoolId]);

  const fetchInvoices = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);

    let query = supabase
      .from("invoices")
      .select("*, student:students(first_name, last_name, grade)", { count: "exact" })
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count, error } = await query;
    if (error) {
      toast({ title: "Error loading invoices", description: error.message, variant: "destructive" });
    } else {
      setInvoices((data as any) || []);
      setTotal(count || 0);
    }
    setLoading(false);
  }, [schoolId, search, statusFilter, page]);

  const fetchStudents = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase.from("students").select("id, first_name, last_name, grade").eq("school_id", schoolId).eq("status", "active").order("first_name");
    setStudents(data || []);
  }, [schoolId]);

  useEffect(() => { fetchInvoices(); fetchStats(); }, [fetchInvoices, fetchStats]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    setForm({
      student_id: inv.student_id,
      amount: String(inv.amount),
      description: inv.description || "",
      due_date: inv.due_date || "",
      term: inv.term || "",
      academic_year: inv.academic_year || "",
      status: inv.status || "pending",
      paid_amount: String(inv.paid_amount || 0),
      currency: inv.currency || "USD",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId) return;
    if (!form.student_id || !form.amount) {
      toast({ title: "Student and amount are required", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      student_id: form.student_id,
      amount: parseFloat(form.amount),
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      term: form.term.trim() || null,
      academic_year: form.academic_year.trim() || null,
      status: form.status,
      paid_amount: parseFloat(form.paid_amount) || 0,
      currency: form.currency || "USD",
      school_id: schoolId,
    };

    if (editing) {
      const { error } = await supabase.from("invoices").update(payload).eq("id", editing.id);
      if (error) toast({ title: "Error updating invoice", description: error.message, variant: "destructive" });
      else toast({ title: "Invoice updated" });
    } else {
      const invNum = `INV-${new Date().getFullYear()}-${String(total + 1).padStart(4, "0")}`;
      const { error } = await supabase.from("invoices").insert({ ...payload, invoice_number: invNum });
      if (error) toast({ title: "Error creating invoice", description: error.message, variant: "destructive" });
      else toast({ title: "Invoice created" });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchInvoices();
    fetchStats();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("invoices").delete().eq("id", deleteTarget.id);
    if (error) toast({ title: "Error deleting invoice", description: error.message, variant: "destructive" });
    else toast({ title: "Invoice deleted" });
    setDeleting(false);
    setDeleteTarget(null);
    fetchInvoices();
    fetchStats();
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const statCards = [
    { title: "Total Revenue", value: fmt(stats.totalAmount), sub: `${total} invoices`, icon: DollarSign, color: "bg-success/10 text-success" },
    { title: "Collected", value: fmt(stats.collected), sub: "payments received", icon: CheckCircle, color: "bg-primary/10 text-primary" },
    { title: "Outstanding", value: fmt(stats.outstanding), sub: `${stats.pendingCount} pending`, icon: AlertCircle, color: "bg-warning/10 text-warning" },
    { title: "Overdue", value: fmt(stats.overdue), sub: `${stats.overdueCount} invoices`, icon: TrendingUp, color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fee Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track collections, invoices, and financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Create Invoice</Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-2xl font-bold tracking-tight text-card-foreground">{stat.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{stat.sub}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by invoice # or description..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Invoice</TableHead>
              <TableHead className="text-xs font-semibold">Student</TableHead>
              <TableHead className="text-xs font-semibold">Amount</TableHead>
              <TableHead className="text-xs font-semibold">Paid</TableHead>
              <TableHead className="text-xs font-semibold">Due Date</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No invoices found</p>
                    <p className="text-xs text-muted-foreground/70">Create your first invoice to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-medium text-primary">{inv.invoice_number || "—"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{inv.student ? `${inv.student.first_name} ${inv.student.last_name}` : "—"}</p>
                      <p className="text-xs text-muted-foreground">{inv.student?.grade || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{fmt(Number(inv.amount))}</TableCell>
                  <TableCell className="text-sm">{fmt(Number(inv.paid_amount || 0))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.due_date || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] capitalize ${statusColors[inv.status || "pending"] || ""}`}>
                      {inv.status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-sm gap-2" onClick={() => openEdit(inv)}><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-sm gap-2"><Eye className="h-3.5 w-3.5" /> View</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-sm gap-2 text-destructive" onClick={() => setDeleteTarget(inv)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">Showing {invoices.length} of {total} invoices</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <span className="text-xs text-muted-foreground px-2">Page {page + 1} of {totalPages || 1}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </motion.div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Student *</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} {s.grade ? `(${s.grade})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Paid Amount</Label>
                <Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Term</Label>
                <Input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="e.g. Term 1" />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} placeholder="e.g. 2026" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Invoice description" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {deleteTarget?.invoice_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
