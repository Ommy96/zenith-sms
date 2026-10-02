import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers, MoreHorizontal, Plus, Sparkles, Tags, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EntityFormDialog } from "@/components/scaffolding/EntityFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry, StudentPicker, useFinanceStudents, useLookups, useNameMap } from "@/components/finance/shared";
import { FEE_CATEGORIES, SCHOLAR_TYPES, kes, numericInput, refreshSetup, studentName } from "@/lib/finance/format";

const SEED = [
  ["TUITION", "Tuition Fee", "tuition", false, false],
  ["BOARDING", "Boarding Fee", "boarding", true, false],
  ["TRANSPORT", "Transport Fee", "transport", true, false],
  ["LUNCH", "Lunch Programme", "meals", true, false],
  ["ACTIVITY", "Activity Fee", "activities", false, false],
  ["EXAM", "Examination Fee", "exams", false, false],
  ["UNIFORM", "School Uniform", "uniform", true, false],
  ["BOOKS", "Books and Stationery", "books", true, false],
  ["DEV", "Development Fund", "other", false, false],
  ["CAUTION", "Caution Money", "deposit", false, true],
] as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

export default function Fees() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "items";
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Fees</h1>
        <p className="text-sm text-muted-foreground">What students can be charged, bundled into fee structures and assigned to learners.</p>
      </div>
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <TabsList>
          <TabsTrigger value="items">Fee items</TabsTrigger>
          <TabsTrigger value="structures">Fee structures</TabsTrigger>
          <TabsTrigger value="assignments">Student assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="items"><FeeItemsTab /></TabsContent>
        <TabsContent value="structures"><StructuresTab /></TabsContent>
        <TabsContent value="assignments"><AssignmentsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

export function useFeeItems() {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: [tenant?.id, "fee-items"], enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_items").select("*").eq("tenant_id", tenant!.id).order("code");
      if (error) throw error; return data ?? [];
    },
  });
}

/* ---------------- Fee items ---------------- */
const blankItem = { code: "", name: "", category: "tuition", is_refundable: false, is_optional: false, vat_applicable: false, vat_rate: "16", accounting_code: "", is_active: true };

function FeeItemsTab() {
  const { tenant, has_permission } = useTenant();
  const qc = useQueryClient();
  const q = useFeeItems();
  const [cat, setCat] = useState("all");
  const [edit, setEdit] = useState<any | null>(null);
  const [form, setForm] = useState<any>(blankItem);
  const [seedOpen, setSeedOpen] = useState(false);
  const canEdit = has_permission("fees.structure");
  const rows = (q.data ?? []).filter((r: any) => cat === "all" || r.category === cat);
  const invalidate = () => { qc.invalidateQueries({ queryKey: [tenant?.id, "fee-items"] }); refreshSetup(tenant!.id); };

  const open = (row?: any) => {
    setForm(row ? { ...row, vat_rate: String(row.vat_rate ?? 0), accounting_code: row.accounting_code ?? "" } : blankItem);
    setEdit(row ?? {});
  };
  const save = async () => {
    const code = form.code.trim().toUpperCase(), name = form.name.trim();
    if (!/^[A-Z0-9_-]{2,20}$/.test(code)) throw new Error("Code must be 2–20 letters, numbers, - or _");
    if (!name || name.length > 120) throw new Error("Name is required (max 120 characters)");
    const payload = {
      code, name, category: form.category, is_refundable: form.is_refundable, is_optional: form.is_optional,
      vat_applicable: form.vat_applicable, vat_rate: form.vat_applicable ? Number(form.vat_rate || 0) : 0,
      accounting_code: form.accounting_code.trim() || null, is_active: form.is_active,
    };
    const { error } = edit?.id
      ? await supabase.from("fee_items").update(payload).eq("id", edit.id)
      : await supabase.from("fee_items").insert({ ...payload, tenant_id: tenant!.id });
    if (error) throw new Error(error.code === "23505" ? `A fee item with code ${code} already exists` : "Could not save the fee item");
    toast.success(edit?.id ? "Fee item updated" : "Fee item created");
    invalidate();
  };
  const toggleActive = async (row: any) => {
    const { error } = await supabase.from("fee_items").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) return toast.error("Could not update the fee item");
    invalidate();
  };
  const seed = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fee_items").insert(SEED.map(([code, name, category, is_optional, is_refundable]) => ({
        tenant_id: tenant!.id, code, name, category, is_optional, is_refundable,
      })));
      if (error) throw error;
    },
    onSuccess: () => { toast.success("10 common fee items added"); invalidate(); },
    onError: () => toast.error("Could not add the fee items"),
  });

  if (q.isError) return <ErrorRetry onRetry={() => q.refetch()} />;
  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {FEE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {canEdit && q.data?.length === 0 && (
          <Button variant="outline" size="sm" onClick={() => setSeedOpen(true)}><Sparkles className="h-4 w-4 mr-1" />Seed common Kenya fee items</Button>
        )}
        {canEdit && <Button size="sm" onClick={() => open()}><Plus className="h-4 w-4 mr-1" />New fee item</Button>}
      </div>

      {q.isLoading ? <Skeleton className="h-48 w-full" /> : rows.length === 0 ? (
        <EmptyState icon={<Tags className="h-5 w-5" />} title={q.data?.length ? "No items in this category" : "No fee items yet"}
          description="Fee items are the things you can charge for — tuition, lunch, transport and so on." />
      ) : (
        <div className="rounded-lg border"><Table>
          <TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead>
            <TableHead>Refundable</TableHead><TableHead>Optional</TableHead><TableHead className="text-right">VAT</TableHead>
            <TableHead>Accounting code</TableHead><TableHead>Active</TableHead><TableHead className="w-10" />
          </TableRow></TableHeader>
          <TableBody>{rows.map((r: any) => (
            <TableRow key={r.id} className={r.is_active ? "" : "opacity-60"}>
              <TableCell className="font-mono text-xs">{r.code}</TableCell>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell><span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">{cap(r.category)}</span></TableCell>
              <TableCell>{r.is_refundable ? "Yes" : "—"}</TableCell>
              <TableCell>{r.is_optional ? "Optional" : "Mandatory"}</TableCell>
              <TableCell className="text-right font-mono">{r.vat_applicable ? `${r.vat_rate}%` : "—"}</TableCell>
              <TableCell className="font-mono text-xs">{r.accounting_code ?? "—"}</TableCell>
              <TableCell>{r.is_active ? "Active" : "Inactive"}</TableCell>
              <TableCell>{canEdit && (
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => open(r)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleActive(r)}>{r.is_active ? "Deactivate" : "Activate"}</DropdownMenuItem>
                  </DropdownMenuContent></DropdownMenu>
              )}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></div>
      )}

      <EntityFormDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "Edit fee item" : "New fee item"} onSubmit={save}>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Code</Label><Input className="font-mono uppercase" value={form.code} maxLength={20} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SPORTS" /></div>
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FEE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{cap(c)}</SelectItem>)}</SelectContent>
            </Select></div>
        </div>
        <div><Label>Name</Label><Input value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sports Kit" /></div>
        <div className="flex flex-wrap gap-4">
          {([["is_refundable", "Refundable"], ["is_optional", "Optional"], ["vat_applicable", "VAT applicable"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm"><Checkbox checked={form[k]} onCheckedChange={(v) => setForm({ ...form, [k]: !!v })} />{l}</label>
          ))}
        </div>
        {form.vat_applicable && <div><Label>VAT rate (%)</Label><Input inputMode="decimal" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: numericInput(e.target.value) })} /></div>}
        <div><Label>Accounting code (optional)</Label><Input value={form.accounting_code} maxLength={40} onChange={(e) => setForm({ ...form, accounting_code: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />Active</label>
      </EntityFormDialog>

      <AlertDialog open={seedOpen} onOpenChange={setSeedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Add common Kenya fee items?</AlertDialogTitle>
            <AlertDialogDescription>This adds 10 items: Tuition, Boarding, Transport, Lunch, Activity, Exam, Uniform, Books, Development Fund and Caution Money. You can edit them afterwards.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => seed.mutate()}>Add items</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------- Fee structures ---------------- */
export function useStructures() {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: [tenant?.id, "fee-structures"], enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_structures")
        .select("*, fee_structure_items(amount, term_id, fee_item_id, is_mandatory)").eq("tenant_id", tenant!.id).order("name");
      if (error) throw error; return data ?? [];
    },
  });
}

function StructuresTab() {
  const { tenant, has_permission } = useTenant();
  const qc = useQueryClient();
  const nav = useNavigate();
  const q = useStructures();
  const lk = useLookups();
  const years = useNameMap(lk.data?.years); const grades = useNameMap(lk.data?.grades);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", academic_year_id: "", grade_level_id: "all", scholar_type: "day", is_active: true });
  const canEdit = has_permission("fees.structure");

  const save = async () => {
    const name = form.name.trim();
    if (!name || name.length > 120) throw new Error("Name is required (max 120 characters)");
    const year = form.academic_year_id || lk.data?.currentYear;
    if (!year) throw new Error("Create an academic year first");
    const { data, error } = await supabase.from("fee_structures").insert({
      tenant_id: tenant!.id, name, academic_year_id: year,
      grade_level_id: form.grade_level_id === "all" ? null : form.grade_level_id,
      scholar_type: form.scholar_type, is_active: form.is_active,
    }).select("id").single();
    if (error) throw new Error("Could not create the fee structure");
    qc.invalidateQueries({ queryKey: [tenant?.id, "fee-structures"] }); refreshSetup(tenant!.id);
    toast.success("Fee structure created");
    nav(`/finance/fees/structures/${data.id}`);
  };

  if (q.isError) return <ErrorRetry onRetry={() => q.refetch()} />;
  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-end">{canEdit && (
        <Button size="sm" onClick={() => { setForm({ name: "", academic_year_id: lk.data?.currentYear ?? "", grade_level_id: "all", scholar_type: "day", is_active: true }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />New fee structure</Button>)}</div>
      {q.isLoading ? <Skeleton className="h-48 w-full" /> : !q.data?.length ? (
        <EmptyState icon={<Layers className="h-5 w-5" />} title="No fee structures yet" description="A fee structure bundles fee items with amounts per term, e.g. “Grade 1 Day Scholar 2026”." />
      ) : (
        <div className="rounded-lg border"><Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Academic year</TableHead><TableHead>Grade level</TableHead><TableHead>Scholar type</TableHead>
            <TableHead className="text-right">Line items</TableHead><TableHead className="text-right">Total per year</TableHead><TableHead>Active</TableHead>
          </TableRow></TableHeader>
          <TableBody>{q.data.map((s: any) => (
            <TableRow key={s.id} className="cursor-pointer" onClick={() => nav(`/finance/fees/structures/${s.id}`)}>
              <TableCell className="font-medium text-primary">{s.name}</TableCell>
              <TableCell>{years[s.academic_year_id] ?? "—"}</TableCell>
              <TableCell>{s.grade_level_id ? grades[s.grade_level_id] ?? "—" : "All grades"}</TableCell>
              <TableCell>{SCHOLAR_TYPES.find((t) => t.value === s.scholar_type)?.label ?? "—"}</TableCell>
              <TableCell className="text-right font-mono">{s.fee_structure_items?.length ?? 0}</TableCell>
              <TableCell className="text-right font-mono">{kes((s.fee_structure_items ?? []).reduce((a: number, i: any) => a + Number(i.amount), 0))}</TableCell>
              <TableCell>{s.is_active ? "Active" : "Inactive"}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></div>
      )}
      <EntityFormDialog open={open} onOpenChange={setOpen} title="New fee structure" onSubmit={save} submitLabel="Create">
        <div><Label>Name</Label><Input value={form.name} maxLength={120} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Grade 1 Day Scholar 2026" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Academic year</Label>
            <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{lk.data?.years.map((y: any) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Grade level</Label>
            <Select value={form.grade_level_id} onValueChange={(v) => setForm({ ...form, grade_level_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All grades</SelectItem>{lk.data?.grades.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select></div>
        </div>
        <div><Label>Scholar type</Label>
          <Select value={form.scholar_type} onValueChange={(v) => setForm({ ...form, scholar_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SCHOLAR_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select></div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />Active</label>
      </EntityFormDialog>
    </div>
  );
}

/* ---------------- Assignments ---------------- */
function AssignmentsTab() {
  const { tenant, has_permission } = useTenant();
  const qc = useQueryClient();
  const students = useFinanceStudents();
  const structures = useStructures();
  const lk = useLookups();
  const years = useNameMap(lk.data?.years);
  const canEdit = has_permission("fees.structure");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", fee_structure_id: "", academic_year_id: "" });
  const [bulk, setBulk] = useState({ class_id: "", fee_structure_id: "" });

  const q = useQuery({
    queryKey: [tenant?.id, "student-fee-structures"], enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("student_fee_structures")
        .select("*, students:student_id(first_name, last_name, admission_number), fee_structures:fee_structure_id(name)")
        .eq("tenant_id", tenant!.id).is("unassigned_at", null).order("assigned_at", { ascending: false });
      if (error) throw error; return data ?? [];
    },
  });
  const classOf = useMemo(() => Object.fromEntries((students.data ?? []).map((s) => [s.id, s.class_name])), [students.data]);
  const invalidate = () => { qc.invalidateQueries({ queryKey: [tenant?.id, "student-fee-structures"] }); refreshSetup(tenant!.id); };

  const pickStudent = (id: string) => {
    const st = students.data?.find((s) => s.id === id);
    const match = (structures.data ?? []).find((f: any) => f.is_active && st?.grade_level_id && f.grade_level_id === st.grade_level_id);
    setForm((f) => ({ ...f, student_id: id, fee_structure_id: match?.id ?? f.fee_structure_id }));
  };
  const save = async () => {
    if (!form.student_id || !form.fee_structure_id) throw new Error("Choose a student and a fee structure");
    const year = form.academic_year_id || lk.data?.currentYear;
    const { error } = await supabase.from("student_fee_structures").insert({
      tenant_id: tenant!.id, student_id: form.student_id, fee_structure_id: form.fee_structure_id, academic_year_id: year,
    });
    if (error) throw new Error(error.code === "23505" ? "This student already has that structure" : "Could not assign the fee structure");
    toast.success("Fee structure assigned"); invalidate();
  };
  const bulkStudents = (students.data ?? []).filter((s) => s.class_id === bulk.class_id);
  const runBulk = async () => {
    if (!bulk.class_id || !bulk.fee_structure_id) throw new Error("Choose a class and a fee structure");
    if (!bulkStudents.length) throw new Error("No active students in that class");
    const already = new Set((q.data ?? []).filter((a: any) => a.fee_structure_id === bulk.fee_structure_id).map((a: any) => a.student_id));
    const rows = bulkStudents.filter((s) => !already.has(s.id)).map((s) => ({
      tenant_id: tenant!.id, student_id: s.id, fee_structure_id: bulk.fee_structure_id, academic_year_id: lk.data?.currentYear,
    }));
    if (rows.length) { const { error } = await supabase.from("student_fee_structures").insert(rows); if (error) throw new Error("Could not assign the class"); }
    toast.success(`Assigned to ${rows.length} student${rows.length === 1 ? "" : "s"}`); invalidate();
  };
  const unassign = async (id: string) => {
    const { error } = await supabase.from("student_fee_structures").update({ unassigned_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error("Could not remove the assignment"); invalidate();
  };

  if (q.isError) return <ErrorRetry onRetry={() => q.refetch()} />;
  return (
    <div className="space-y-4 pt-2">
      {canEdit && <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => { setBulk({ class_id: "", fee_structure_id: "" }); setBulkOpen(true); }}>Bulk assign class</Button>
        <Button size="sm" onClick={() => { setForm({ student_id: "", fee_structure_id: "", academic_year_id: lk.data?.currentYear ?? "" }); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Assign fee structure</Button>
      </div>}
      {q.isLoading ? <Skeleton className="h-48 w-full" /> : !q.data?.length ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="No students assigned yet" description="Assign a fee structure so invoices can be generated from it." />
      ) : (
        <div className="rounded-lg border"><Table>
          <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Fee structure</TableHead><TableHead>Academic year</TableHead><TableHead>Assigned</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
          <TableBody>{q.data.map((a: any) => (
            <TableRow key={a.id}>
              <TableCell><Link className="font-medium text-primary hover:underline" to={`/academics/students/${a.student_id}`}>{studentName(a.students)}</Link>
                <div className="text-xs text-muted-foreground font-mono">{a.students?.admission_number}</div></TableCell>
              <TableCell>{classOf[a.student_id] ?? "—"}</TableCell>
              <TableCell><Link className="hover:underline" to={`/finance/fees/structures/${a.fee_structure_id}`}>{a.fee_structures?.name}</Link></TableCell>
              <TableCell>{years[a.academic_year_id] ?? "—"}</TableCell>
              <TableCell>{new Date(a.assigned_at).toLocaleDateString("en-KE")}</TableCell>
              <TableCell>{canEdit && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => unassign(a.id)}>Remove assignment</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></div>
      )}

      <EntityFormDialog open={open} onOpenChange={setOpen} title="Assign fee structure" onSubmit={save} submitLabel="Assign">
        <div><Label>Student</Label><StudentPicker value={form.student_id} onChange={pickStudent} students={students.data ?? []} /></div>
        <div><Label>Fee structure</Label>
          <Select value={form.fee_structure_id} onValueChange={(v) => setForm({ ...form, fee_structure_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{(structures.data ?? []).filter((s: any) => s.is_active).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><Label>Academic year</Label>
          <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{lk.data?.years.map((y: any) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
          </Select></div>
      </EntityFormDialog>

      <EntityFormDialog open={bulkOpen} onOpenChange={setBulkOpen} title="Bulk assign a class" onSubmit={runBulk} submitLabel={`Assign ${bulkStudents.length || ""} students`}>
        <div><Label>Class</Label>
          <Select value={bulk.class_id} onValueChange={(v) => setBulk({ ...bulk, class_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{lk.data?.classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><Label>Fee structure</Label>
          <Select value={bulk.fee_structure_id} onValueChange={(v) => setBulk({ ...bulk, fee_structure_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{(structures.data ?? []).filter((s: any) => s.is_active).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select></div>
        {bulk.class_id && <div className="rounded-md bg-muted p-3 text-sm">
          <p className="font-medium">{bulkStudents.length} active student{bulkStudents.length === 1 ? "" : "s"}</p>
          <p className="text-muted-foreground text-xs mt-1">{bulkStudents.slice(0, 8).map(studentName).join(", ")}{bulkStudents.length > 8 ? "…" : ""}</p>
        </div>}
      </EntityFormDialog>
    </div>
  );
}
