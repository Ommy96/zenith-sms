import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserX, AlertTriangle, FileText, Wallet, Receipt, Users, ArrowRight, Smartphone } from "lucide-react";
import { RevenueChart } from "@/components/RevenueChart";
import { RecentActivity } from "@/components/RecentActivity";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

type TileColor = "primary" | "success" | "warning" | "info" | "destructive";

const colorMap: Record<TileColor, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

interface ActionTileProps {
  title: string;
  value: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  color: TileColor;
  to: string;
  hint?: React.ReactNode;
  delay?: number;
}

function ActionTile({ title, value, cta, icon: Icon, color, to, hint, delay = 0 }: ActionTileProps) {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={() => navigate(to)}
      className="group text-left rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/40 transition-all w-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-card-foreground truncate">{value}</p>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary group-hover:gap-2.5 transition-all">
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </motion.button>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1 || 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="text-success">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface MpesaTxn { id: string; sender: string; amount: number; student: string; at: string; }

function MpesaPanel({ txns, currency }: { txns: MpesaTxn[]; currency: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">Today's M-Pesa Transactions</h3>
        <Smartphone className="h-4 w-4 text-success" />
      </div>
      {txns.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No M-Pesa payments today</p>
      ) : (
        <div className="space-y-3">
          {txns.map((t) => (
            <div key={t.id} className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Smartphone className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{t.sender}</p>
                <p className="text-xs text-muted-foreground truncate">{t.student}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-card-foreground">{currency} {t.amount.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">{t.at}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const schoolId = profile?.tenant_id;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const [currency, setCurrency] = useState("KES");
  const [data, setData] = useState({
    absencesToday: 0,
    defaultersWeek: 0,
    pendingAdmissions: 0,
    collectedMonth: 0,
    collectedTrend: [] as number[],
    outstanding: 0,
    totalBilled: 0,
    activeStudents: 0,
    studentDelta: 0,
    mpesa: [] as MpesaTxn[],
  });

  useEffect(() => {
    if (!schoolId) return;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().split("T")[0];
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString();

    (async () => {
      const [schoolRes, absRes, defRes, admRes, invMonthRes, invAllRes, studentsRes, mpesaRes, invTrendRes] = await Promise.all([
        supabase.from("tenants").select("payment_config").eq("id", schoolId).maybeSingle(),
        supabase.from("attendance").select("id, student_id", { count: "exact" }).eq("tenant_id", schoolId).eq("date", todayStr).eq("status", "absent"),
        supabase.from("invoices").select("student_id").eq("tenant_id", schoolId).in("status", ["overdue", "pending"]).lte("due_date", todayStr).gte("due_date", weekAgo),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("tenant_id", schoolId).eq("status", "under_review"),
        supabase.from("invoices").select("paid_amount").eq("tenant_id", schoolId).gte("created_at", monthStart),
        supabase.from("invoices").select("amount, paid_amount").eq("tenant_id", schoolId),
        supabase.from("students").select("id, created_at", { count: "exact" }).eq("tenant_id", schoolId).eq("status", "active"),
        supabase.from("invoices").select("id, invoice_number, paid_amount, created_at, student_id, description").eq("tenant_id", schoolId).gt("paid_amount", 0).gte("created_at", todayStr).order("created_at", { ascending: false }).limit(5),
        supabase.from("invoices").select("paid_amount, created_at").eq("tenant_id", schoolId).gte("created_at", sixMonthsAgo),
      ]);

      const cur = (schoolRes.data?.payment_config as any)?.currency || "KES";
      setCurrency(cur);

      const defaulterStudents = new Set((defRes.data || []).map((r: any) => r.student_id));
      const collectedMonth = (invMonthRes.data || []).reduce((s, i: any) => s + Number(i.paid_amount || 0), 0);

      const all = invAllRes.data || [];
      const totalBilled = all.reduce((s, i: any) => s + Number(i.amount), 0);
      const collectedAll = all.reduce((s, i: any) => s + Number(i.paid_amount || 0), 0);
      const outstanding = totalBilled - collectedAll;

      const activeStudents = studentsRes.count || 0;
      const ninetyDaysAgo = new Date(today.getTime() - 90 * 86400000);
      const newStudents = (studentsRes.data || []).filter((s: any) => new Date(s.created_at) >= ninetyDaysAgo).length;

      // Sparkline: collections per month for last 6 months
      const trend: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        trend[`${d.getFullYear()}-${d.getMonth()}`] = 0;
      }
      (invTrendRes.data || []).forEach((inv: any) => {
        const d = new Date(inv.created_at);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (k in trend) trend[k] += Number(inv.paid_amount || 0);
      });

      // Fetch student names for mpesa
      const studentIds = [...new Set((mpesaRes.data || []).map((m: any) => m.student_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (studentIds.length) {
        const { data: studs } = await supabase.from("students").select("id, first_name, last_name, guardian_name").in("id", studentIds);
        (studs || []).forEach((s: any) => { nameMap[s.id] = `${s.first_name} ${s.last_name}`; });
      }
      const mpesa: MpesaTxn[] = (mpesaRes.data || []).map((m: any) => ({
        id: m.id,
        sender: m.invoice_number || "M-Pesa",
        amount: Number(m.paid_amount),
        student: nameMap[m.student_id] || m.description || "—",
        at: formatDistanceToNow(new Date(m.created_at), { addSuffix: true }),
      }));

      setData({
        absencesToday: absRes.count || 0,
        defaultersWeek: defaulterStudents.size,
        pendingAdmissions: admRes.count || 0,
        collectedMonth,
        collectedTrend: Object.values(trend),
        outstanding,
        totalBilled,
        activeStudents,
        studentDelta: newStudents,
        mpesa,
      });
    })();
  }, [schoolId]);

  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 10_000) return `${currency} ${(n / 1000).toFixed(0)}K`;
    return `${currency} ${n.toLocaleString()}`;
  };

  const outstandingPct = data.totalBilled > 0 ? Math.round((data.outstanding / data.totalBilled) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, {firstName}. Here's what needs your attention today.</p>
      </motion.div>

      {/* Row 1: Today's focus */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Today's Focus</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionTile delay={0.05} title="Today's Absences" value={data.absencesToday.toLocaleString()} cta="View list" icon={UserX} color="warning" to="/attendance?filter=absent&date=today" />
          <ActionTile delay={0.1} title="Fee Defaulters This Week" value={data.defaultersWeek.toLocaleString()} cta="Send reminders" icon={AlertTriangle} color="destructive" to="/fees?filter=defaulters&range=week" />
          <ActionTile delay={0.15} title="Pending Admissions" value={data.pendingAdmissions.toLocaleString()} cta="Review applications" icon={FileText} color="info" to="/admissions?status=under_review" />
        </div>
      </div>

      {/* Row 2: Financial pulse */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Financial Pulse</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionTile
            delay={0.2}
            title="Collected This Month"
            value={fmtMoney(data.collectedMonth)}
            cta="View payments"
            icon={Wallet}
            color="success"
            to="/finance-reports?view=collections&range=month"
            hint={<Sparkline data={data.collectedTrend} />}
          />
          <ActionTile
            delay={0.25}
            title="Outstanding Fees"
            value={fmtMoney(data.outstanding)}
            cta="View invoices"
            icon={Receipt}
            color="warning"
            to="/invoices?status=outstanding"
            hint={<span>{outstandingPct}% of total billed</span>}
          />
          <ActionTile
            delay={0.3}
            title="Active Students"
            value={data.activeStudents.toLocaleString()}
            cta="View students"
            icon={Users}
            color="primary"
            to="/students?status=active"
            hint={<span className={data.studentDelta > 0 ? "text-success" : "text-muted-foreground"}>{data.studentDelta > 0 ? `+${data.studentDelta}` : data.studentDelta} vs last term</span>}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <RecentActivity />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3"><MpesaPanel txns={data.mpesa} currency={currency} /></div>
      </div>
    </div>
  );
}
