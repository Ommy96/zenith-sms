import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Money } from "@/components/Money";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Play, Users, Settings2, Trash2, CheckCircle2 } from "lucide-react";

type Row = Record<string, any>;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function PayrollTab({ tenantId, canManage }: { tenantId: string; canManage: boolean }) {
  const [tab, setTab] = useState<"periods" | "compensation">("periods");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === "periods" ? "default" : "outline"} size="sm" onClick={() => setTab("periods")}>Pay Periods</Button>
        <Button variant={tab === "compensation" ? "default" : "outline"} size="sm" onClick={() => setTab("compensation")}>Staff Compensation</Button>
      </div>
      {tab === "periods" ? <PeriodsView tenantId={tenantId} canManage={canManage} /> : <CompensationView tenantId={tenantId} canManage={canManage} />}
    </div>
  );
}

/* ============== PERIODS ============== */
function PeriodsView({ tenantId, canManage }: { tenantId: string; canManage: boolean }) {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, pay_date: "" });

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payroll_periods").select("*").eq("tenant_id", tenantId).order("year", { ascending: false }).order("month", { ascending: false });
    setPeriods(data || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { reload(); }, [reload]);

  const createPeriod = async () => {
    const { error } = await supabase.from("payroll_periods").insert({
      tenant_id: tenantId, year: form.year, month: form.month,
      pay_date: form.pay_date || null, status: "draft",
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Period created" });
    setCreating(false);
    reload();
  };

  const process = async (p: Row) => {
    if (!confirm(`Process payroll for ${MONTHS[p.month - 1]} ${p.year}? Payslips will be generated for all active staff with a compensation profile.`)) return;
    const { data, error } = await supabase.rpc("process_payroll_period" as any, { _period: p.id });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `Processed ${data} payslips` });
    reload();
    if (selected?.id === p.id) setSelected({ ...selected, status: "processed" });
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin mx-auto my-12" />;

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Pay periods</CardTitle>
          {canManage && (
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild><Button size="sm" variant="ghost"><Plus className="h-3 w-3 mr-1" />New</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New pay period</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></div>
                  <div><Label>Month</Label>
                    <select className="w-full border rounded px-2 py-1.5 text-sm bg-background" value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}>
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><Label>Pay date</Label><Input type="date" value={form.pay_date} onChange={(e) => setForm({ ...form, pay_date: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={createPeriod}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
          {periods.length === 0 && <div className="text-xs text-muted-foreground p-3">No pay periods yet.</div>}
          {periods.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)}
              className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-muted ${selected?.id === p.id ? "bg-muted" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{MONTHS[p.month - 1]} {p.year}</span>
                <Badge variant={p.status === "paid" ? "default" : p.status === "processed" ? "secondary" : "outline"} className="text-[10px]">{p.status}</Badge>
              </div>
              {p.pay_date && <div className="text-xs text-muted-foreground">Pay: {p.pay_date}</div>}
            </button>
          ))}
        </CardContent>
      </Card>

      {selected ? (
        <PayslipsView period={selected} tenantId={tenantId} canManage={canManage} onProcess={() => process(selected)} />
      ) : (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">Select a pay period to view payslips.</CardContent></Card>
      )}
    </div>
  );
}

/* ============== PAYSLIPS for a period ============== */
function PayslipsView({ period, tenantId, canManage, onProcess }: { period: Row; tenantId: string; canManage: boolean; onProcess: () => void }) {
  const [slips, setSlips] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<Row | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("payslips").select("*, staff:staff_id(first_name,last_name,staff_number,kra_pin,nssf_number,nhif_or_shif_number,bank_name,bank_account_number)").eq("period_id", period.id).order("created_at");
    setSlips(data || []);
    setLoading(false);
  }, [period.id]);

  useEffect(() => { reload(); }, [reload]);

  const totals = useMemo(() => slips.reduce((a, s) => ({
    gross: a.gross + Number(s.gross_pay || 0),
    paye: a.paye + Number(s.paye || 0),
    shif: a.shif + Number(s.shif || 0),
    nssf: a.nssf + Number(s.nssf || 0),
    housing: a.housing + Number(s.housing_levy || 0),
    net: a.net + Number(s.net_pay || 0),
  }), { gross: 0, paye: 0, shif: 0, nssf: 0, housing: 0, net: 0 }), [slips]);

  const markAllPaid = async () => {
    if (!confirm("Mark all payslips in this period as paid?")) return;
    const { error } = await supabase.from("payslips").update({ status: "paid", paid_at: new Date().toISOString() }).eq("period_id", period.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await supabase.from("payroll_periods").update({ status: "paid" }).eq("id", period.id);
    toast({ title: "Marked as paid" });
    reload();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-base">{MONTHS[period.month - 1]} {period.year} — Payslips</CardTitle>
        {canManage && (
          <div className="flex gap-2">
            <Button size="sm" onClick={onProcess}><Play className="h-3 w-3 mr-1" />{period.status === "draft" ? "Process" : "Re-process"}</Button>
            {period.status === "processed" && <Button size="sm" variant="outline" onClick={markAllPaid}><CheckCircle2 className="h-3 w-3 mr-1" />Mark all paid</Button>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto my-8" /> : slips.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">No payslips yet. Click <strong>Process</strong> to generate them.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4 text-xs">
              <Totals label="Gross" value={totals.gross} />
              <Totals label="PAYE" value={totals.paye} />
              <Totals label="SHIF" value={totals.shif} />
              <Totals label="NSSF" value={totals.nssf} />
              <Totals label="Housing" value={totals.housing} />
              <Totals label="Net" value={totals.net} accent />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Staff</TableHead><TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">PAYE</TableHead><TableHead className="text-right">SHIF</TableHead>
                  <TableHead className="text-right">NSSF</TableHead><TableHead className="text-right">AHL</TableHead>
                  <TableHead className="text-right">Net</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {slips.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => setView(s)}>
                      <TableCell>
                        <div className="font-medium text-sm">{s.staff?.first_name} {s.staff?.last_name}</div>
                        <div className="text-xs text-muted-foreground">{s.staff?.staff_number}</div>
                      </TableCell>
                      <TableCell className="text-right"><Money amount={s.gross_pay} /></TableCell>
                      <TableCell className="text-right"><Money amount={s.paye} /></TableCell>
                      <TableCell className="text-right"><Money amount={s.shif} /></TableCell>
                      <TableCell className="text-right"><Money amount={s.nssf} /></TableCell>
                      <TableCell className="text-right"><Money amount={s.housing_levy} /></TableCell>
                      <TableCell className="text-right font-semibold"><Money amount={s.net_pay} /></TableCell>
                      <TableCell><Badge variant={s.status === "paid" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Payslip — {view?.staff?.first_name} {view?.staff?.last_name}</DialogTitle></DialogHeader>
            {view && <PayslipDetail slip={view} period={period} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function Totals({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded border p-2">
      <div className="text-muted-foreground text-[10px] uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-semibold ${accent ? "text-primary" : ""}`}><Money amount={value} /></div>
    </div>
  );
}

function PayslipDetail({ slip, period }: { slip: Row; period: Row }) {
  const rows = [
    ["Basic Salary", slip.basic_salary],
    ["House Allowance", slip.house_allowance],
    ["Transport Allowance", slip.transport_allowance],
    ["Other Allowances", slip.other_allowances],
  ];
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Period: {MONTHS[period.month - 1]} {period.year}</div>
        <div>Staff #: {slip.staff?.staff_number}</div>
        <div>KRA PIN: {slip.staff?.kra_pin || "—"}</div>
        <div>NSSF: {slip.staff?.nssf_number || "—"}</div>
      </div>
      <div className="rounded border">
        <div className="bg-muted px-3 py-1.5 font-medium text-xs">EARNINGS</div>
        {rows.map(([k, v]) => (
          <div key={k as string} className="flex justify-between px-3 py-1.5 border-t text-xs">
            <span>{k}</span><Money amount={Number(v || 0)} />
          </div>
        ))}
        <div className="flex justify-between px-3 py-1.5 border-t font-semibold bg-muted/30">
          <span>Gross Pay</span><Money amount={slip.gross_pay} />
        </div>
      </div>
      <div className="rounded border">
        <div className="bg-muted px-3 py-1.5 font-medium text-xs">DEDUCTIONS</div>
        {[
          ["PAYE", slip.paye],
          ["SHIF (2.75%)", slip.shif],
          ["NSSF", slip.nssf],
          ["Housing Levy (1.5%)", slip.housing_levy],
          ["Other", slip.other_deductions],
        ].map(([k, v]) => (
          <div key={k as string} className="flex justify-between px-3 py-1.5 border-t text-xs">
            <span>{k}</span><Money amount={Number(v || 0)} />
          </div>
        ))}
        <div className="flex justify-between px-3 py-1.5 border-t font-semibold bg-muted/30">
          <span>Total Deductions</span><Money amount={slip.total_deductions} />
        </div>
      </div>
      <div className="flex justify-between p-3 rounded bg-primary/10 border border-primary/30 font-bold">
        <span>NET PAY</span><Money amount={slip.net_pay} />
      </div>
    </div>
  );
}

/* ============== COMPENSATION ============== */
function CompensationView({ tenantId, canManage }: { tenantId: string; canManage: boolean }) {
  const [staff, setStaff] = useState<Row[]>([]);
  const [comp, setComp] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      supabase.from("staff").select("id, first_name, last_name, staff_number, role, status").eq("tenant_id", tenantId).eq("status", "active").order("first_name"),
      supabase.from("staff_compensation").select("*").eq("tenant_id", tenantId),
    ]);
    setStaff(s.data || []);
    const map: Record<string, Row> = {};
    (c.data || []).forEach((r) => { map[r.staff_id] = r; });
    setComp(map);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin mx-auto my-12" />;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Staff compensation profiles</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Staff</TableHead><TableHead>Role</TableHead>
            <TableHead className="text-right">Basic</TableHead><TableHead className="text-right">House</TableHead>
            <TableHead className="text-right">Transport</TableHead><TableHead>Statutory</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {staff.map((s) => {
              const c = comp[s.id];
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-muted-foreground">{s.staff_number}</div>
                  </TableCell>
                  <TableCell className="text-xs">{s.role}</TableCell>
                  <TableCell className="text-right">{c ? <Money amount={c.basic_salary} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-right">{c ? <Money amount={c.house_allowance} /> : "—"}</TableCell>
                  <TableCell className="text-right">{c ? <Money amount={c.transport_allowance} /> : "—"}</TableCell>
                  <TableCell className="text-xs">
                    {c ? (
                      <div className="flex gap-1 flex-wrap">
                        {c.pays_paye && <Badge variant="outline" className="text-[9px]">PAYE</Badge>}
                        {c.pays_shif && <Badge variant="outline" className="text-[9px]">SHIF</Badge>}
                        {c.pays_nssf && <Badge variant="outline" className="text-[9px]">NSSF</Badge>}
                        {c.pays_housing_levy && <Badge variant="outline" className="text-[9px]">AHL</Badge>}
                      </div>
                    ) : <Badge variant="secondary" className="text-[10px]">Not set</Badge>}
                  </TableCell>
                  <TableCell>
                    {canManage && (
                      <Button size="sm" variant="ghost" onClick={() => setEditing({ staff: s, comp: c })}>
                        <Settings2 className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Compensation — {editing?.staff?.first_name} {editing?.staff?.last_name}</DialogTitle></DialogHeader>
            {editing && <CompForm tenantId={tenantId} staff={editing.staff} initial={editing.comp} onSaved={() => { setEditing(null); reload(); }} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function CompForm({ tenantId, staff, initial, onSaved }: { tenantId: string; staff: Row; initial?: Row; onSaved: () => void }) {
  const [f, setF] = useState({
    basic_salary: initial?.basic_salary ?? 0,
    house_allowance: initial?.house_allowance ?? 0,
    transport_allowance: initial?.transport_allowance ?? 0,
    other_allowances: (initial?.other_allowances ?? []) as { name: string; amount: number; taxable: boolean }[],
    recurring_deductions: (initial?.recurring_deductions ?? []) as { name: string; amount: number }[],
    pays_paye: initial?.pays_paye ?? true,
    pays_shif: initial?.pays_shif ?? true,
    pays_nssf: initial?.pays_nssf ?? true,
    pays_housing_levy: initial?.pays_housing_levy ?? true,
    personal_relief: initial?.personal_relief ?? 2400,
    insurance_relief: initial?.insurance_relief ?? 0,
  });

  const save = async () => {
    const payload = { tenant_id: tenantId, staff_id: staff.id, ...f };
    const { error } = await supabase.from("staff_compensation").upsert(payload, { onConflict: "staff_id" });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    onSaved();
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs">Basic</Label><Input type="number" value={f.basic_salary} onChange={(e) => setF({ ...f, basic_salary: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">House</Label><Input type="number" value={f.house_allowance} onChange={(e) => setF({ ...f, house_allowance: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Transport</Label><Input type="number" value={f.transport_allowance} onChange={(e) => setF({ ...f, transport_allowance: Number(e.target.value) })} /></div>
      </div>

      <div className="rounded border p-2">
        <div className="flex justify-between items-center mb-1">
          <Label className="text-xs">Other allowances</Label>
          <Button size="sm" variant="ghost" onClick={() => setF({ ...f, other_allowances: [...f.other_allowances, { name: "", amount: 0, taxable: true }] })}><Plus className="h-3 w-3" /></Button>
        </div>
        {f.other_allowances.map((a, i) => (
          <div key={i} className="grid grid-cols-12 gap-1 mt-1">
            <Input className="col-span-5" placeholder="Name" value={a.name} onChange={(e) => setF({ ...f, other_allowances: f.other_allowances.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
            <Input className="col-span-3" type="number" value={a.amount} onChange={(e) => setF({ ...f, other_allowances: f.other_allowances.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) } : x) })} />
            <div className="col-span-3 flex items-center gap-1 text-xs"><Switch checked={a.taxable} onCheckedChange={(v) => setF({ ...f, other_allowances: f.other_allowances.map((x, j) => j === i ? { ...x, taxable: v } : x) })} />Taxable</div>
            <Button className="col-span-1" size="icon" variant="ghost" onClick={() => setF({ ...f, other_allowances: f.other_allowances.filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>

      <div className="rounded border p-2">
        <div className="flex justify-between items-center mb-1">
          <Label className="text-xs">Recurring deductions</Label>
          <Button size="sm" variant="ghost" onClick={() => setF({ ...f, recurring_deductions: [...f.recurring_deductions, { name: "", amount: 0 }] })}><Plus className="h-3 w-3" /></Button>
        </div>
        {f.recurring_deductions.map((a, i) => (
          <div key={i} className="grid grid-cols-12 gap-1 mt-1">
            <Input className="col-span-8" placeholder="Name (e.g. SACCO, Loan)" value={a.name} onChange={(e) => setF({ ...f, recurring_deductions: f.recurring_deductions.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
            <Input className="col-span-3" type="number" value={a.amount} onChange={(e) => setF({ ...f, recurring_deductions: f.recurring_deductions.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) } : x) })} />
            <Button className="col-span-1" size="icon" variant="ghost" onClick={() => setF({ ...f, recurring_deductions: f.recurring_deductions.filter((_, j) => j !== i) })}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center gap-2"><Switch checked={f.pays_paye} onCheckedChange={(v) => setF({ ...f, pays_paye: v })} />PAYE</label>
        <label className="flex items-center gap-2"><Switch checked={f.pays_shif} onCheckedChange={(v) => setF({ ...f, pays_shif: v })} />SHIF</label>
        <label className="flex items-center gap-2"><Switch checked={f.pays_nssf} onCheckedChange={(v) => setF({ ...f, pays_nssf: v })} />NSSF</label>
        <label className="flex items-center gap-2"><Switch checked={f.pays_housing_levy} onCheckedChange={(v) => setF({ ...f, pays_housing_levy: v })} />Housing Levy</label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">Personal relief</Label><Input type="number" value={f.personal_relief} onChange={(e) => setF({ ...f, personal_relief: Number(e.target.value) })} /></div>
        <div><Label className="text-xs">Insurance relief</Label><Input type="number" value={f.insurance_relief} onChange={(e) => setF({ ...f, insurance_relief: Number(e.target.value) })} /></div>
      </div>

      <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
    </div>
  );
}