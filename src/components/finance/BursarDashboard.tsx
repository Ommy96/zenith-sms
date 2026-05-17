import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/Money";
import { Loader2, TrendingUp, AlertTriangle, Banknote, Wallet, Receipt } from "lucide-react";

type Row = Record<string, any>;

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash", mpesa: "M-Pesa", airtel_money: "Airtel", bank_transfer: "Bank",
  cheque: "Cheque", card: "Card", pos: "POS", other: "Other",
};

export function BursarDashboard({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Row[]>([]);
  const [payments, setPayments] = useState<Row[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      setLoading(true);
      const since = new Date(); since.setDate(since.getDate() - 90);
      const [inv, pay] = await Promise.all([
        supabase.from("student_invoices")
          .select("id, total, paid_total, balance, status, due_date, issued_at, student_id, students:student_id(first_name,last_name,admission_number)")
          .eq("tenant_id", tenantId).neq("status", "void"),
        supabase.from("student_payments")
          .select("id, amount, method, paid_at, students:student_id(first_name,last_name,admission_number)")
          .eq("tenant_id", tenantId).gte("paid_at", since.toISOString())
          .order("paid_at", { ascending: false }).limit(500),
      ]);
      setInvoices(inv.data || []);
      setPayments(pay.data || []);
      setLoading(false);
    })();
  }, [tenantId]);

  const metrics = useMemo(() => {
    const billed = invoices.reduce((a, b) => a + Number(b.total || 0), 0);
    const collected = invoices.reduce((a, b) => a + Number(b.paid_total || 0), 0);
    const outstanding = invoices.reduce((a, b) => a + Number(b.balance || 0), 0);
    const rate = billed > 0 ? Math.round((collected / billed) * 100) : 0;

    // Aging buckets on outstanding balance
    const today = new Date();
    const buckets = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    for (const inv of invoices) {
      const bal = Number(inv.balance || 0);
      if (bal <= 0 || !inv.due_date) { buckets.current += bal; continue; }
      const days = Math.floor((today.getTime() - new Date(inv.due_date).getTime()) / 86400000);
      if (days <= 0) buckets.current += bal;
      else if (days <= 30) buckets["1-30"] += bal;
      else if (days <= 60) buckets["31-60"] += bal;
      else if (days <= 90) buckets["61-90"] += bal;
      else buckets["90+"] += bal;
    }

    // Method mix (last 90d)
    const mix: Record<string, number> = {};
    let mixTotal = 0;
    for (const p of payments) {
      const m = p.method || "other";
      mix[m] = (mix[m] || 0) + Number(p.amount);
      mixTotal += Number(p.amount);
    }

    // Today / 7d collections
    const todayStr = today.toISOString().slice(0, 10);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    let todayCol = 0, weekCol = 0;
    for (const p of payments) {
      const d = new Date(p.paid_at);
      const amt = Number(p.amount);
      if (p.paid_at?.slice(0, 10) === todayStr) todayCol += amt;
      if (d >= weekAgo) weekCol += amt;
    }

    // Top defaulters (group by student)
    const byStudent: Record<string, { name: string; admission: string; balance: number; overdue: number }> = {};
    for (const inv of invoices) {
      const bal = Number(inv.balance || 0);
      if (bal <= 0) continue;
      const key = inv.student_id;
      const s = inv.students || {};
      if (!byStudent[key]) byStudent[key] = {
        name: `${s.first_name || ""} ${s.last_name || ""}`.trim() || "—",
        admission: s.admission_number || "—",
        balance: 0, overdue: 0,
      };
      byStudent[key].balance += bal;
      if (inv.status === "overdue") byStudent[key].overdue += bal;
    }
    const defaulters = Object.entries(byStudent)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.balance - a.balance).slice(0, 8);

    return { billed, collected, outstanding, rate, buckets, mix, mixTotal, todayCol, weekCol, defaulters };
  }, [invoices, payments]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi icon={<Receipt className="h-4 w-4" />} label="Today" value={<Money amount={metrics.todayCol} />} sub="collected" />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Last 7 days" value={<Money amount={metrics.weekCol} />} sub="collected" accent="text-emerald-600" />
        <Kpi icon={<Banknote className="h-4 w-4" />} label="Outstanding" value={<Money amount={metrics.outstanding} />} sub={`${metrics.rate}% collection rate`} accent="text-amber-600" />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Defaulters" value={metrics.defaulters.length} sub="students with balance" accent="text-destructive" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Aging */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" /> Aging buckets</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(["current","1-30","31-60","61-90","90+"] as const).map((k) => {
              const v = (metrics.buckets as any)[k] as number;
              const pct = metrics.outstanding > 0 ? (v / metrics.outstanding) * 100 : 0;
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize">{k === "current" ? "Current" : `${k} days overdue`}</span>
                    <span className="font-mono"><Money amount={v} /></span>
                  </div>
                  <div className="h-1.5 rounded bg-muted overflow-hidden">
                    <div
                      className={`h-full ${k === "current" ? "bg-emerald-500" : k === "90+" ? "bg-destructive" : "bg-amber-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Method mix */}
        <Card>
          <CardHeader><CardTitle className="text-base">Payment method mix · last 90d</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {metrics.mixTotal === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : Object.entries(metrics.mix).sort((a,b)=>b[1]-a[1]).map(([m, amt]) => {
              const pct = (amt / metrics.mixTotal) * 100;
              return (
                <div key={m}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{METHOD_LABEL[m] || m}</span>
                    <span className="font-mono"><Money amount={amt} /> · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 rounded bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Defaulters */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top defaulters</CardTitle></CardHeader>
          <CardContent>
            {metrics.defaulters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outstanding balances. </p>
            ) : (
              <ul className="divide-y">
                {metrics.defaulters.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.admission}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive"><Money amount={d.balance} /></p>
                      {d.overdue > 0 && <Badge variant="destructive" className="text-[10px]">overdue <Money amount={d.overdue} /></Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent payments */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent payments</CardTitle></CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <ul className="divide-y">
                {payments.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{p.students?.first_name} {p.students?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleString()} · {METHOD_LABEL[p.method] || p.method}</p>
                    </div>
                    <p className="font-semibold text-emerald-600"><Money amount={Number(p.amount)} /></p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>{label}</span>{icon}
        </div>
        <div className={`text-2xl font-bold mt-1 ${accent || ""}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}