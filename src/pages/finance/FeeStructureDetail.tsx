import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ListPlus, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityFormDialog } from "@/components/scaffolding/EntityFormDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorRetry, useLookups, useNameMap } from "@/components/finance/shared";
import { SCHOLAR_TYPES, kes, numericInput, refreshSetup } from "@/lib/finance/format";
import { useFeeItems } from "./Fees";

export default function FeeStructureDetail() {
  const { id } = useParams();
  const { tenant, has_permission } = useTenant();
  const qc = useQueryClient();
  const lk = useLookups();
  const items = useFeeItems();
  const years = useNameMap(lk.data?.years); const grades = useNameMap(lk.data?.grades); const terms = useNameMap(lk.data?.terms);
  const canEdit = has_permission("fees.structure");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fee_item_id: "", term_id: "annual", amount: "", due_date_offset_days: "0", is_mandatory: true });

  const q = useQuery({
    queryKey: [tenant?.id, "fee-structure", id], enabled: !!tenant?.id && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_structures")
        .select("*, fee_structure_items(*, fee_items:fee_item_id(code, name))").eq("id", id).maybeSingle();
      if (error) throw error; return data;
    },
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [tenant?.id, "fee-structure", id] });
    qc.invalidateQueries({ queryKey: [tenant?.id, "fee-structures"] });
    refreshSetup(tenant!.id);
  };

  const save = async () => {
    const amount = Number(form.amount);
    if (!form.fee_item_id) throw new Error("Choose a fee item");
    if (!(amount > 0)) throw new Error("Enter an amount greater than 0");
    const fi = items.data?.find((i: any) => i.id === form.fee_item_id);
    const { error } = await supabase.from("fee_structure_items").insert({
      tenant_id: tenant!.id, fee_structure_id: id, fee_item_id: form.fee_item_id,
      term_id: form.term_id === "annual" ? null : form.term_id, amount,
      currency: tenant?.currency_code ?? "KES",
      due_date_offset_days: Math.max(0, parseInt(form.due_date_offset_days || "0", 10)),
      is_mandatory: form.is_mandatory ?? !fi?.is_optional,
    });
    if (error) throw new Error("Could not add the line item");
    toast.success("Line item added"); invalidate();
  };
  const remove = async (lineId: string) => {
    const { error } = await supabase.from("fee_structure_items").delete().eq("id", lineId);
    if (error) return toast.error("Could not delete the line item"); invalidate();
  };

  if (q.isError) return <div className="p-6"><ErrorRetry onRetry={() => q.refetch()} /></div>;
  if (q.isLoading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  const s: any = q.data;
  if (!s) return <div className="p-6"><EmptyState title="Fee structure not found" /></div>;
  const lines = [...(s.fee_structure_items ?? [])].sort((a: any, b: any) => (terms[a.term_id] ?? "~").localeCompare(terms[b.term_id] ?? "~"));
  const termTotals = lines.reduce((acc: Record<string, number>, l: any) => { const k = l.term_id ?? "annual"; acc[k] = (acc[k] ?? 0) + Number(l.amount); return acc; }, {});
  const total = lines.reduce((a: number, l: any) => a + Number(l.amount), 0);
  const yearTerms = (lk.data?.terms ?? []).filter((t: any) => t.academic_year_id === s.academic_year_id);

  return (
    <div className="space-y-6 p-6">
      <Link to="/finance/fees?tab=structures" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-4 w-4" />Fee structures</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{s.name}</h1>
          <p className="text-sm text-muted-foreground">
            {years[s.academic_year_id] ?? "—"} · {s.grade_level_id ? grades[s.grade_level_id] : "All grades"} · {SCHOLAR_TYPES.find((t) => t.value === s.scholar_type)?.label ?? "—"}{!s.is_active && " · Inactive"}
          </p>
        </div>
        {canEdit && <Button size="sm" onClick={() => { setForm({ fee_item_id: "", term_id: lk.data?.currentTerm || "annual", amount: "", due_date_offset_days: "0", is_mandatory: true }); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add line item</Button>}
      </div>

      {!lines.length ? (
        <EmptyState icon={<ListPlus className="h-5 w-5" />} title="No line items yet" description="Add fee items with an amount for each term, or leave the term as Annual." />
      ) : (
        <div className="rounded-lg border"><Table>
          <TableHeader><TableRow>
            <TableHead>Fee item</TableHead><TableHead>Term</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Currency</TableHead>
            <TableHead className="text-right">Due offset</TableHead><TableHead>Mandatory</TableHead><TableHead className="w-10" />
          </TableRow></TableHeader>
          <TableBody>{lines.map((l: any) => (
            <TableRow key={l.id}>
              <TableCell><span className="font-mono text-xs mr-2">{l.fee_items?.code}</span>{l.fee_items?.name}</TableCell>
              <TableCell>{l.term_id ? terms[l.term_id] ?? "—" : "Annual"}</TableCell>
              <TableCell className="text-right font-mono">{kes(l.amount, l.currency)}</TableCell>
              <TableCell>{l.currency}</TableCell>
              <TableCell className="text-right font-mono">{l.due_date_offset_days} days</TableCell>
              <TableCell>{l.is_mandatory ? "Yes" : "Optional"}</TableCell>
              <TableCell>{canEdit && <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Delete line" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>}</TableCell>
            </TableRow>
          ))}</TableBody>
          <TableFooter>
            {Object.entries(termTotals).map(([k, v]) => (
              <TableRow key={k}><TableCell colSpan={2} className="text-muted-foreground">Subtotal — {k === "annual" ? "Annual" : terms[k]}</TableCell>
                <TableCell className="text-right font-mono">{kes(v)}</TableCell><TableCell colSpan={4} /></TableRow>
            ))}
            <TableRow><TableCell colSpan={2} className="font-semibold">Total per year</TableCell>
              <TableCell className="text-right font-mono font-semibold text-primary">{kes(total)}</TableCell><TableCell colSpan={4} /></TableRow>
          </TableFooter>
        </Table></div>
      )}

      <EntityFormDialog open={open} onOpenChange={setOpen} title="Add line item" onSubmit={save} submitLabel="Add">
        <div><Label>Fee item</Label>
          <Select value={form.fee_item_id} onValueChange={(v) => { const fi = items.data?.find((i: any) => i.id === v); setForm({ ...form, fee_item_id: v, is_mandatory: !fi?.is_optional }); }}>
            <SelectTrigger><SelectValue placeholder={items.data?.length ? "Select" : "Create fee items first"} /></SelectTrigger>
            <SelectContent>{(items.data ?? []).filter((i: any) => i.is_active).map((i: any) => <SelectItem key={i.id} value={i.id}>{i.code} — {i.name}</SelectItem>)}</SelectContent>
          </Select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Term</Label>
            <Select value={form.term_id} onValueChange={(v) => setForm({ ...form, term_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="annual">Annual</SelectItem>{yearTerms.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label>Amount ({tenant?.currency_code ?? "KES"})</Label><Input inputMode="decimal" className="font-mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: numericInput(e.target.value) })} placeholder="15000" /></div>
        </div>
        <div><Label>Due date offset (days from term start)</Label><Input inputMode="numeric" value={form.due_date_offset_days} onChange={(e) => setForm({ ...form, due_date_offset_days: e.target.value.replace(/\D/g, "").slice(0, 3) })} /></div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_mandatory} onCheckedChange={(v) => setForm({ ...form, is_mandatory: v })} />Mandatory</label>
      </EntityFormDialog>
    </div>
  );
}
