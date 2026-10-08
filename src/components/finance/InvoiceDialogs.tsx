import { useEffect, useMemo, useState } from "react";
import { DatePicker } from "@/components/finance/DatePicker";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentPicker, useFinanceStudents, useLookups } from "./shared";
import { useFeeItems } from "@/pages/finance/Fees";
import { addDays, kes, numericInput, refreshSetup, todayISO } from "@/lib/finance/format";

interface Line { key: string; fee_item_id: string | null; description: string; quantity: string; unit_amount: string; }
const newKey = () => Math.random().toString(36).slice(2);

/** Structure lines for a student's active fee structures in a term (annual lines included). */
async function structureLines(tenantId: string, studentIds: string[], termId: string) {
  const { data } = await supabase.from("student_fee_structures")
    .select("student_id, fee_structures:fee_structure_id(id, fee_structure_items(id, fee_item_id, term_id, amount, is_mandatory, fee_items:fee_item_id(code, name)))")
    .eq("tenant_id", tenantId).in("student_id", studentIds).is("unassigned_at", null);
  const out: Record<string, any[]> = {};
  (data ?? []).forEach((a: any) => {
    const items = (a.fee_structures?.fee_structure_items ?? []).filter((i: any) => i.term_id === termId || i.term_id === null);
    out[a.student_id] = [...(out[a.student_id] ?? []), ...items];
  });
  return out;
}

export async function insertInvoice(p: {
  tenantId: string; userId?: string; studentId: string; yearId: string; termId: string | null; issueDate: string;
  dueDate: string | null; currency: string; notes?: string; issue: boolean;
  lines: { fee_item_id: string | null; description: string; quantity: number; unit_amount: number }[];
}) {
  const { data: inv, error } = await supabase.from("invoices").insert({
    tenant_id: p.tenantId, student_id: p.studentId, academic_year_id: p.yearId, term_id: p.termId,
    issue_date: p.issueDate, due_date: p.dueDate, currency: p.currency, notes: p.notes || null,
    status: "draft", created_by: p.userId ?? null,
  }).select("id").single();
  if (error) throw new Error("Could not create the invoice");
  const { error: lErr } = await supabase.from("invoice_line_items").insert(p.lines.map((l, i) => ({
    tenant_id: p.tenantId, invoice_id: inv.id, fee_item_id: l.fee_item_id, description: l.description,
    quantity: l.quantity, unit_amount: l.unit_amount, line_total: l.quantity * l.unit_amount, sort_order: (i + 1) * 10,
  })));
  if (lErr) { await supabase.from("invoices").delete().eq("id", inv.id); throw new Error("Could not save the invoice lines"); }
  if (p.issue) await supabase.from("invoices").update({ status: "issued", issued_at: new Date().toISOString() }).eq("id", inv.id);
  return inv.id as string;
}

export function NewInvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const students = useFinanceStudents();
  const lk = useLookups();
  const feeItems = useFeeItems();
  const [f, setF] = useState({ student_id: "", year: "", term: "", issue: todayISO(), due: addDays(todayISO(), 14), notes: "" });
  const [lines, setLines] = useState<Line[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setF({ student_id: "", year: lk.data?.currentYear ?? "", term: lk.data?.currentTerm ?? "", issue: todayISO(), due: addDays(todayISO(), 14), notes: "" }); setLines([]); setPicked({}); }
  }, [open, lk.data]);

  const struct = useQuery({
    queryKey: [tenant?.id, "structure-lines", f.student_id, f.term], enabled: !!f.student_id && !!f.term,
    queryFn: async () => (await structureLines(tenant!.id, [f.student_id], f.term))[f.student_id] ?? [],
  });
  const total = lines.reduce((a, l) => a + Number(l.quantity || 0) * Number(l.unit_amount || 0), 0);

  const addFromStructure = () => {
    const chosen = (struct.data ?? []).filter((i: any) => picked[i.id]);
    if (!chosen.length) return toast.message("Tick at least one fee to add");
    setLines((ls) => [...ls, ...chosen.map((i: any) => ({ key: newKey(), fee_item_id: i.fee_item_id, description: i.fee_items?.name ?? "Fee", quantity: "1", unit_amount: String(i.amount) }))]);
    setPicked({});
  };
  const upd = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const submit = async (issue: boolean) => {
    if (!f.student_id) return toast.error("Choose a student");
    if (!f.year) return toast.error("Choose an academic year");
    const clean = lines.map((l) => ({ fee_item_id: l.fee_item_id, description: l.description.trim().slice(0, 200), quantity: Number(l.quantity), unit_amount: Number(l.unit_amount) }));
    if (!clean.length) return toast.error("Add at least one line");
    if (clean.some((l) => !l.description || !(l.quantity > 0) || !(l.unit_amount >= 0))) return toast.error("Each line needs a description, quantity above 0 and an amount");
    if (f.due && f.due < f.issue) return toast.error("Due date can't be before the issue date");
    setSaving(true);
    try {
      const id = await insertInvoice({ tenantId: tenant!.id, userId: user?.id, studentId: f.student_id, yearId: f.year, termId: f.term || null,
        issueDate: f.issue, dueDate: f.due || null, currency: tenant?.currency_code ?? "KES", notes: f.notes.trim().slice(0, 500), issue, lines: clean });
      qc.invalidateQueries({ queryKey: [tenant?.id, "invoices"] }); refreshSetup(tenant!.id);
      toast.success(issue ? "Invoice issued" : "Draft invoice saved");
      onOpenChange(false); nav(`/finance/invoices/${id}`);
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const yearTerms = (lk.data?.terms ?? []).filter((t: any) => t.academic_year_id === f.year);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Student</Label><StudentPicker value={f.student_id} onChange={(v) => setF({ ...f, student_id: v })} students={students.data ?? []} /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label>Academic year</Label><Select value={f.year} onValueChange={(v) => setF({ ...f, year: v, term: "" })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{lk.data?.years.map((y: any) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Term</Label><Select value={f.term} onValueChange={(v) => setF({ ...f, term: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{yearTerms.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Issue date</Label><DatePicker value={f.issue} onChange={(v) => setF({ ...f, issue: v, due: addDays(v, 14) })} /></div>
            <div><Label>Due date</Label><DatePicker value={f.due} onChange={(v) => setF({ ...f, due: v })} /></div>
          </div>

          {f.student_id && f.term && (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-sm font-medium">Add from fee structure</p>
              {struct.isLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : !struct.data?.length ? (
                <p className="text-xs text-muted-foreground">No fee structure lines for this student in this term. Assign a structure under Fees, or add custom lines.</p>
              ) : (<>
                {struct.data.map((i: any) => (
                  <label key={i.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={!!picked[i.id]} onCheckedChange={(v) => setPicked({ ...picked, [i.id]: !!v })} />
                    <span className="font-mono text-xs">{i.fee_items?.code}</span><span className="flex-1">{i.fee_items?.name}{i.term_id ? "" : " (annual)"}</span>
                    <span className="font-mono">{kes(i.amount)}</span>
                  </label>
                ))}
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setPicked(Object.fromEntries(struct.data.map((i: any) => [i.id, true])))}>Select all</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={addFromStructure}>Add selected</Button>
                </div>
              </>)}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between"><p className="text-sm font-medium">Line items</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, { key: newKey(), fee_item_id: null, description: "", quantity: "1", unit_amount: "" }])}><Plus className="h-4 w-4 mr-1" />Add custom line</Button></div>
            {lines.length === 0 && <p className="text-xs text-muted-foreground">No lines yet.</p>}
            {lines.map((l) => (
              <div key={l.key} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3"><Select value={l.fee_item_id ?? "none"} onValueChange={(v) => { const fi = feeItems.data?.find((x: any) => x.id === v); upd(l.key, { fee_item_id: v === "none" ? null : v, description: fi?.name ?? l.description }); }}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Fee item" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No item</SelectItem>{(feeItems.data ?? []).map((x: any) => <SelectItem key={x.id} value={x.id}>{x.code}</SelectItem>)}</SelectContent></Select></div>
                <Input className="col-span-4 h-9" placeholder="Description" maxLength={200} value={l.description} onChange={(e) => upd(l.key, { description: e.target.value })} />
                <Input className="col-span-1 h-9 font-mono text-right" inputMode="numeric" value={l.quantity} onChange={(e) => upd(l.key, { quantity: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                <Input className="col-span-2 h-9 font-mono text-right" inputMode="decimal" placeholder="Amount" value={l.unit_amount} onChange={(e) => upd(l.key, { unit_amount: numericInput(e.target.value) })} />
                <span className="col-span-1 text-right font-mono text-xs">{(Number(l.quantity || 0) * Number(l.unit_amount || 0)).toLocaleString("en-KE")}</span>
                <Button type="button" variant="ghost" size="icon" className="col-span-1 h-8 w-8" aria-label="Remove line" onClick={() => setLines(lines.filter((x) => x.key !== l.key))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <div className="flex justify-end gap-6 border-t pt-2 text-sm"><span className="text-muted-foreground">Total</span><span className="font-mono font-semibold">{kes(total)}</span></div>
          </div>
          <div><Label>Notes</Label><Textarea maxLength={500} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => submit(false)}>Save as draft</Button>
          <Button disabled={saving} onClick={() => submit(true)}>{saving ? "Saving…" : "Save & issue"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GenerateTermDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const qc = useQueryClient();
  const lk = useLookups();
  const students = useFinanceStudents();
  const [f, setF] = useState({ year: "", term: "", grades: [] as string[], classes: [] as string[], issue: todayISO(), offset: "14" });
  const [fees, setFees] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => { if (open) { setF({ year: lk.data?.currentYear ?? "", term: lk.data?.currentTerm ?? "", grades: [], classes: [], issue: todayISO(), offset: "14" }); setProgress(null); } }, [open, lk.data]);

  const scoped = useMemo(() => (students.data ?? []).filter((s) =>
    (!f.grades.length || (s.grade_level_id && f.grades.includes(s.grade_level_id))) && (!f.classes.length || (s.class_id && f.classes.includes(s.class_id)))), [students.data, f.grades, f.classes]);

  const preview = useQuery({
    queryKey: [tenant?.id, "gen-preview", f.term, scoped.map((s) => s.id).join(",")], enabled: open && !!f.term && scoped.length > 0,
    queryFn: async () => {
      const [lines, { data: existing }] = await Promise.all([
        structureLines(tenant!.id, scoped.map((s) => s.id), f.term),
        supabase.from("invoices").select("student_id").eq("tenant_id", tenant!.id).eq("term_id", f.term).not("status", "in", "(cancelled,written_off)"),
      ]);
      const already = new Set((existing ?? []).map((e: any) => e.student_id));
      return { lines, already };
    },
  });
  const feeOptions = useMemo(() => {
    const m = new Map<string, any>();
    Object.values(preview.data?.lines ?? {}).flat().forEach((i: any) => { if (!m.has(i.fee_item_id)) m.set(i.fee_item_id, i); });
    return [...m.values()];
  }, [preview.data]);
  useEffect(() => { setFees(Object.fromEntries(feeOptions.map((i: any) => [i.fee_item_id, i.is_mandatory]))); }, [feeOptions]);

  const eligible = scoped.filter((s) => !preview.data?.already.has(s.id) &&
    (preview.data?.lines[s.id] ?? []).some((i: any) => fees[i.fee_item_id]));
  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const run = async (issue: boolean) => {
    if (!eligible.length) return toast.error("No students to invoice with these settings");
    setProgress(0);
    let done = 0, failed = 0;
    for (const s of eligible) {
      const lines = (preview.data!.lines[s.id] ?? []).filter((i: any) => fees[i.fee_item_id])
        .map((i: any) => ({ fee_item_id: i.fee_item_id, description: i.fee_items?.name ?? "Fee", quantity: 1, unit_amount: Number(i.amount) }));
      try {
        await insertInvoice({ tenantId: tenant!.id, userId: user?.id, studentId: s.id, yearId: f.year, termId: f.term, issueDate: f.issue,
          dueDate: addDays(f.issue, Number(f.offset || 0)), currency: tenant?.currency_code ?? "KES", issue, lines });
        done++;
      } catch { failed++; }
      setProgress(Math.round(((done + failed) / eligible.length) * 100));
    }
    qc.invalidateQueries({ queryKey: [tenant?.id, "invoices"] }); refreshSetup(tenant!.id);
    if (failed) toast.error(`${done} invoices created, ${failed} failed`); else toast.success(`${done} invoice${done === 1 ? "" : "s"} created`);
    onOpenChange(false);
  };

  const yearTerms = (lk.data?.terms ?? []).filter((t: any) => t.academic_year_id === f.year);
  return (
    <Dialog open={open} onOpenChange={(o) => progress === null && onOpenChange(o)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Generate invoices for a term</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Academic year</Label><Select value={f.year} onValueChange={(v) => setF({ ...f, year: v, term: "" })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{lk.data?.years.map((y: any) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Term</Label><Select value={f.term} onValueChange={(v) => setF({ ...f, term: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{yearTerms.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label>Grade levels (none = all)</Label><div className="flex flex-wrap gap-1.5 mt-1">{lk.data?.grades.map((g: any) => (
            <Button key={g.id} type="button" size="sm" variant={f.grades.includes(g.id) ? "default" : "outline"} className="h-7" onClick={() => setF({ ...f, grades: toggleIn(f.grades, g.id) })}>{g.name}</Button>))}</div></div>
          <div><Label>Classes (none = all)</Label><div className="flex flex-wrap gap-1.5 mt-1">{lk.data?.classes.map((c: any) => (
            <Button key={c.id} type="button" size="sm" variant={f.classes.includes(c.id) ? "default" : "outline"} className="h-7" onClick={() => setF({ ...f, classes: toggleIn(f.classes, c.id) })}>{c.name}</Button>))}</div></div>
          {feeOptions.length > 0 && <div><Label>Fees to include</Label><div className="grid grid-cols-2 gap-1 mt-1">{feeOptions.map((i: any) => (
            <label key={i.fee_item_id} className="flex items-center gap-2 text-sm"><Checkbox checked={!!fees[i.fee_item_id]} onCheckedChange={(v) => setFees({ ...fees, [i.fee_item_id]: !!v })} />{i.fee_items?.name}{!i.is_mandatory && <span className="text-xs text-muted-foreground">optional</span>}</label>))}</div></div>}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Issue date</Label><DatePicker value={f.issue} onChange={(v) => setF({ ...f, issue: v })} /></div>
            <div><Label>Due in (days)</Label><Input inputMode="numeric" value={f.offset} onChange={(e) => setF({ ...f, offset: e.target.value.replace(/\D/g, "").slice(0, 3) })} /></div>
          </div>
          <div className="rounded-md bg-muted p-3 text-sm">
            {!f.term ? "Choose a term to preview." : preview.isLoading ? "Checking fee structures…" :
              <><span className="font-semibold">{eligible.length}</span> student{eligible.length === 1 ? "" : "s"} will be invoiced.
                {preview.data && preview.data.already.size > 0 && <span className="text-muted-foreground"> Students already invoiced this term are skipped.</span>}</>}
          </div>
          {progress !== null && <Progress value={progress} />}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={progress !== null} onClick={() => run(false)}>Save as drafts</Button>
          <Button disabled={progress !== null} onClick={() => run(true)}>Issue immediately</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
