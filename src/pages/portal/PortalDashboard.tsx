import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Activity, CalendarCheck, GraduationCap, Receipt, CheckCircle2, Smartphone, Users } from "lucide-react";
import { money, shortDate } from "@/lib/portal/format";
import { usePortalData, must } from "@/lib/portal/usePortalData";
import { PortalEmpty, PortalError, StaleNote } from "@/components/portal/PortalStates";
import { MpesaPayDialog } from "@/components/portal/MpesaPayDialog";

function Ring({ pct }: { pct: number }) {
  const r = 18, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" className="stroke-muted" strokeWidth="5" />
      <circle cx="22" cy="22" r={r} fill="none" className="stroke-primary" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} />
    </svg>
  );
}

export default function PortalDashboard() {
  const { activeChild, guardian, currency, loading, error: ctxErr, refresh } = usePortal();
  const firstName = (guardian?.preferred_name || guardian?.full_name || "").split(/\s+/)[0];

  const { data, loading: busy, error, cachedAt, retry } = usePortalData(
    activeChild ? `dash:${activeChild.id}` : null,
    async () => {
      const id = activeChild!.id;
      const { data: term } = await supabase.from("terms").select("start_date, end_date")
        .eq("tenant_id", activeChild!.tenant_id).eq("is_current", true).maybeSingle();
      const [inv, att, res, pay, act] = await Promise.all([
        supabase.from("invoices").select("balance").eq("student_id", id).neq("status", "cancelled"),
        supabase.from("attendance_records").select("status, attendance_sessions:session_id(date)").eq("student_id", id),
        supabase.from("student_exam_results").select("raw_marks, max_marks, grade_letter, exams:exam_id(name, start_date)")
          .eq("student_id", id).order("created_at", { ascending: false }).limit(30),
        supabase.from("payments").select("id, amount, paid_at").eq("student_id", id).order("paid_at", { ascending: false }).limit(1),
        supabase.from("student_activity").select("id, title, description, event_type, occurred_at")
          .eq("student_id", id).order("occurred_at", { ascending: false }).limit(10),
      ]);
      const balance = must<any[]>(inv).reduce((s, r) => s + Number(r.balance || 0), 0);
      const records = must<any[]>(att).filter((r) => {
        const d = r.attendance_sessions?.date;
        return !term || !d || (d >= term.start_date && d <= term.end_date);
      });
      const count = (s: string) => records.filter((r) => r.status === s).length;
      const results = must<any[]>(res);
      const latestExam = results[0]?.exams?.name ?? null;
      const examRows = results.filter((r) => r.exams?.name === latestExam);
      const tot = examRows.reduce((a, r) => ({ s: a.s + Number(r.raw_marks || 0), m: a.m + Number(r.max_marks || 0) }), { s: 0, m: 0 });
      return {
        balance,
        att: { present: count("present"), absent: count("absent"), late: count("late"), total: records.length },
        exam: latestExam ? { name: latestExam, pct: tot.m ? Math.round((tot.s / tot.m) * 100) : null } : null,
        payment: must<any[]>(pay)[0] ?? null,
        activity: must<any[]>(act),
      };
    },
  );

  if (loading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (ctxErr) return <PortalError onRetry={refresh} />;
  if (!activeChild) return <PortalEmpty icon={Users} title="No children linked yet" text="Please contact your school to link your child to this number." />;

  const attPct = data?.att.total ? Math.round(((data.att.present + data.att.late) / data.att.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hello {firstName || "there"}</h1>
        <p className="text-base text-muted-foreground">Here's the latest for {activeChild.first_name}.</p>
      </div>
      <StaleNote at={cachedAt} onRetry={retry} />

      <Card className="border-primary/30">
        <CardContent className="p-5 space-y-3">
          <div>
            <p className="text-lg font-semibold">{activeChild.full_name}</p>
            <p className="text-base text-muted-foreground">
              {activeChild.class_name || "No class"} · <span className="font-mono">{activeChild.admission_number || "—"}</span>
            </p>
          </div>
          {busy && !data ? <Skeleton className="h-10 w-40" /> : error && !data ? <PortalError onRetry={retry} /> : (data?.balance ?? 0) > 0 ? (
            <>
              <p className="text-3xl font-bold text-primary">{money(data!.balance, currency)} owed</p>
              <MpesaPayDialog amount={data!.balance}>
                <Button className="min-h-12 w-full text-base"><Smartphone className="mr-2 h-5 w-5" /> Pay now via M-Pesa</Button>
              </MpesaPayDialog>
            </>
          ) : (
            <p className="flex items-center gap-2 text-xl font-semibold text-success"><CheckCircle2 className="h-6 w-6" /> Fully paid for this term</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/portal/attendance">
          <Card className="h-full hover:border-primary transition"><CardContent className="p-4 flex items-center gap-3">
            <Ring pct={attPct} />
            <div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground"><CalendarCheck className="h-4 w-4" /> Attendance this term</p>
              {data?.att.total ? (
                <p className="text-base"><b>{data.att.present}</b> present · <b>{data.att.absent}</b> absent · <b>{data.att.late}</b> late</p>
              ) : <p className="text-base">No records yet</p>}
            </div>
          </CardContent></Card>
        </Link>
        <Link to="/portal/report-cards">
          <Card className="h-full hover:border-primary transition"><CardContent className="p-4">
            <p className="flex items-center gap-1 text-sm text-muted-foreground"><GraduationCap className="h-4 w-4" /> Latest exam</p>
            {data?.exam ? (<><p className="text-base font-medium truncate">{data.exam.name}</p><p className="text-2xl font-bold">{data.exam.pct != null ? `${data.exam.pct}%` : "—"}</p></>)
              : <p className="text-base">No results yet</p>}
          </CardContent></Card>
        </Link>
        <Link to="/portal/fees?tab=payments">
          <Card className="h-full hover:border-primary transition"><CardContent className="p-4">
            <p className="flex items-center gap-1 text-sm text-muted-foreground"><Receipt className="h-4 w-4" /> Latest payment</p>
            {data?.payment ? (<><p className="text-xl font-bold">{money(data.payment.amount, currency)}</p>
              <p className="text-sm text-muted-foreground">{shortDate(data.payment.paid_at)} · <span className="text-primary">Receipt available</span></p></>)
              : <p className="text-base">No payments yet</p>}
          </CardContent></Card>
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Recent activity</h2>
        {busy && !data ? <Skeleton className="h-24 w-full" /> : !data?.activity.length ? (
          <PortalEmpty icon={Activity} title="No activity yet" text="School updates about your child will appear here." />
        ) : (
          <Card><CardContent className="divide-y p-0">
            {data.activity.map((a: any) => (
              <div key={a.id} className="flex gap-3 p-4">
                <Activity className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-base font-medium">{a.title}</p>
                  {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                  <p className="text-xs text-muted-foreground">{shortDate(a.occurred_at)}</p>
                </div>
              </div>
            ))}
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
