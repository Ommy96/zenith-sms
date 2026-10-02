import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, MoreHorizontal, Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry, InvoiceStatusChip, KpiRow, useFinanceStudents, useLookups, useNameMap } from "@/components/finance/shared";
import { GenerateTermDialog, NewInvoiceDialog } from "@/components/finance/InvoiceDialogs";
import { INVOICE_STATUS, kes, openSignedPdf, studentName, todayISO } from "@/lib/finance/format";

const all = "all";

export function useInvoices() {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: [tenant?.id, "invoices"], enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices")
        .select("*, students:student_id(first_name, last_name, admission_number)")
        .eq("tenant_id", tenant!.id).order("issue_date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    },
  });
}

export default function Invoices() {
  const { has_permission } = useTenant();
  const nav = useNavigate();
  const q = useInvoices();
  const lk = useLookups();
  const students = useFinanceStudents();
  const years = useNameMap(lk.data?.years); const terms = useNameMap(lk.data?.terms);
  const [f, setF] = useState({ status: all, year: all, term: all, grade: all, cls: all, search: "", from: "", to: "" });
  const [newOpen, setNewOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const canCreate = has_permission("invoices.create");
  const stu = useMemo(() => Object.fromEntries((students.data ?? []).map((s) => [s.id, s])), [students.data]);
  const today = todayISO();

  const rows = (q.data ?? []).filter((i: any) => {
    const s = stu[i.student_id];
    const effective = i.status !== "paid" && i.status !== "draft" && i.status !== "cancelled" && i.due_date && i.due_date < today && Number(i.balance) > 0 ? "overdue" : i.status;
    if (f.status !== all && effective !== f.status && i.status !== f.status) return false;
    if (f.year !== all && i.academic_year_id !== f.year) return false;
    if (f.term !== all && i.term_id !== f.term) return false;
    if (f.grade !== all && s?.grade_level_id !== f.grade) return false;
    if (f.cls !== all && s?.class_id !== f.cls) return false;
    if (f.from && i.issue_date < f.from) return false;
    if (f.to && i.issue_date > f.to) return false;
    if (f.search) {
      const needle = f.search.toLowerCase();
      if (![i.invoice_number, studentName(i.students), i.students?.admission_number].some((v) => String(v ?? "").toLowerCase().includes(needle))) return false;
    }
    return true;
  });
  const live = rows.filter((i: any) => !["draft", "cancelled", "written_off"].includes(i.status));
  const billed = live.reduce((a: number, i: any) => a + Number(i.total), 0);
  const paid = live.reduce((a: number, i: any) => a + Number(i.amount_paid), 0);
  const outstanding = live.reduce((a: number, i: any) => a + Number(i.balance), 0);
  const overdue = live.filter((i: any) => i.due_date && i.due_date < today).reduce((a: number, i: any) => a + Number(i.balance), 0);

  const print = (i: any) => openSignedPdf("generate-invoice-pdf", { invoice_id: i.id }, `${i.invoice_number}.pdf`).catch((e) => toast.error(e.message));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold">Invoices</h1><p className="text-sm text-muted-foreground">Bills issued to students and what's still owed.</p></div>
        {canCreate && <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setGenOpen(true)}><Wand2 className="h-4 w-4 mr-1" />Generate for term</Button>
          <Button size="sm" onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1" />New invoice</Button>
        </div>}
      </div>
      <KpiRow items={[{ label: "Billed", value: billed }, { label: "Collected", value: paid, tone: "success" }, { label: "Outstanding", value: outstanding, tone: "danger" }, { label: "Overdue", value: overdue, tone: "danger" }]} />

      <div className="flex flex-wrap gap-2">
        <Input className="w-64" placeholder="Invoice #, student or admission #" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
        <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>All statuses</SelectItem>{["draft", "issued", "partial", "paid", "overdue", "cancelled"].map((s) => <SelectItem key={s} value={s}>{INVOICE_STATUS[s].label}</SelectItem>)}</SelectContent></Select>
        <Select value={f.year} onValueChange={(v) => setF({ ...f, year: v })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>All years</SelectItem>{lk.data?.years.map((y: any) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select>
        <Select value={f.term} onValueChange={(v) => setF({ ...f, term: v })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>All terms</SelectItem>{lk.data?.terms.filter((t: any) => f.year === all || t.academic_year_id === f.year).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name} {years[t.academic_year_id] ?? ""}</SelectItem>)}</SelectContent></Select>
        <Select value={f.grade} onValueChange={(v) => setF({ ...f, grade: v })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>All grades</SelectItem>{lk.data?.grades.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
        <Select value={f.cls} onValueChange={(v) => setF({ ...f, cls: v })}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={all}>All classes</SelectItem>{lk.data?.classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Input type="date" className="w-40" aria-label="Issued from" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
        <Input type="date" className="w-40" aria-label="Issued to" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
      </div>

      {q.isError ? <ErrorRetry onRetry={() => q.refetch()} /> : q.isLoading ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title={q.data?.length ? "No invoices match these filters" : "No invoices yet"}
          description="Create one for a student, or generate a whole term from fee structures." actionLabel={canCreate && !q.data?.length ? "New invoice" : undefined} onAction={() => setNewOpen(true)} />
      ) : (
        <div className="rounded-lg border"><Table>
          <TableHeader><TableRow>
            <TableHead>Invoice #</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Term</TableHead><TableHead>Issued</TableHead><TableHead>Due</TableHead>
            <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead><TableHead className="w-10" />
          </TableRow></TableHeader>
          <TableBody>{rows.map((i: any) => {
            const late = i.due_date && i.due_date < today && Number(i.balance) > 0 && !["draft", "cancelled", "written_off"].includes(i.status);
            return (
              <TableRow key={i.id}>
                <TableCell><Link to={`/finance/invoices/${i.id}`} className="font-mono text-xs text-primary hover:underline">{i.invoice_number ?? "—"}</Link></TableCell>
                <TableCell><div className="font-medium">{studentName(i.students)}</div><div className="text-xs text-muted-foreground font-mono">{i.students?.admission_number}</div></TableCell>
                <TableCell>{stu[i.student_id]?.class_name ?? "—"}</TableCell>
                <TableCell>{i.term_id ? terms[i.term_id] : "—"}</TableCell>
                <TableCell>{i.issue_date}</TableCell>
                <TableCell className={late ? "text-destructive font-medium" : ""}>{i.due_date ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{kes(i.total, i.currency)}</TableCell>
                <TableCell className="text-right font-mono">{kes(i.amount_paid, i.currency)}</TableCell>
                <TableCell className={`text-right font-mono ${Number(i.balance) > 0 ? "text-destructive" : ""}`}>{kes(i.balance, i.currency)}</TableCell>
                <TableCell><InvoiceStatusChip status={late && i.status === "issued" ? "overdue" : i.status} /></TableCell>
                <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => nav(`/finance/invoices/${i.id}`)}>View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => print(i)}>Print PDF</DropdownMenuItem>
                  </DropdownMenuContent></DropdownMenu></TableCell>
              </TableRow>
            );
          })}</TableBody>
          <TableFooter><TableRow>
            <TableCell colSpan={6} className="text-muted-foreground">{rows.length} invoice{rows.length === 1 ? "" : "s"} (drafts and cancelled excluded from totals)</TableCell>
            <TableCell className="text-right font-mono">{kes(billed)}</TableCell><TableCell className="text-right font-mono">{kes(paid)}</TableCell>
            <TableCell className="text-right font-mono text-destructive">{kes(outstanding)}</TableCell><TableCell colSpan={2} />
          </TableRow></TableFooter>
        </Table></div>
      )}
      <NewInvoiceDialog open={newOpen} onOpenChange={setNewOpen} />
      <GenerateTermDialog open={genOpen} onOpenChange={setGenOpen} />
    </div>
  );
}
