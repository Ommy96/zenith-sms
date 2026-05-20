import { useEffect, useState } from "react";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ClipboardCheck, GraduationCap, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalDashboard() {
  const { activeChild, loading } = usePortal();
  const [balance, setBalance] = useState<number>(0);
  const [currency, setCurrency] = useState("KES");
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [lastExamPct, setLastExamPct] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!activeChild) return;
    (async () => {
      setLoadingData(true);
      const [{ data: inv }, { data: tenant }, { data: att }, { data: results }] = await Promise.all([
        supabase.from("student_invoices").select("balance").eq("student_id", activeChild.id),
        supabase.from("tenants").select("currency_code").eq("id", activeChild.tenant_id).maybeSingle(),
        supabase.from("attendance_records").select("status").eq("student_id", activeChild.id).limit(60),
        supabase.from("student_exam_results").select("raw_marks, max_marks").eq("student_id", activeChild.id).order("created_at", { ascending: false }).limit(10),
      ]);
      setBalance((inv || []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0));
      if (tenant?.currency_code) setCurrency(tenant.currency_code);
      if (att && att.length) {
        const present = att.filter((a: any) => a.status === "present" || a.status === "late").length;
        setAttendancePct(Math.round((present / att.length) * 100));
      }
      if (results && results.length) {
        const totals = results.reduce(
          (acc: any, r: any) => ({ s: acc.s + Number(r.raw_marks || 0), m: acc.m + Number(r.max_marks || 0) }),
          { s: 0, m: 0 }
        );
        if (totals.m) setLastExamPct(Math.round((totals.s / totals.m) * 100));
      }
      setLoadingData(false);
    })();
  }, [activeChild?.id]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!activeChild) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        No children linked to your account yet. Please contact your school.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hi 👋</h1>
        <p className="text-sm text-muted-foreground">Here's the latest for {activeChild.first_name}.</p>
      </div>

      {/* Fee balance hero */}
      <Link to="/portal/fees">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs opacity-80 uppercase tracking-wide">Outstanding fees</p>
                <p className="text-3xl font-bold mt-1">
                  {loadingData ? "—" : `${currency} ${balance.toLocaleString()}`}
                </p>
                {balance > 0 && (
                  <Badge variant="secondary" className="mt-2 bg-white/20 text-primary-foreground border-0">
                    Tap to pay via M-Pesa
                  </Badge>
                )}
                {balance <= 0 && !loadingData && (
                  <Badge variant="secondary" className="mt-2 bg-white/20 text-primary-foreground border-0">
                    ✓ All paid
                  </Badge>
                )}
              </div>
              <Wallet className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/portal/academics">
          <Card className="hover:border-primary transition">
            <CardContent className="p-4 space-y-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div className="text-xs text-muted-foreground">Last exam avg</div>
              <div className="text-2xl font-bold">{lastExamPct != null ? `${lastExamPct}%` : "—"}</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/portal/academics">
          <Card className="hover:border-primary transition">
            <CardContent className="p-4 space-y-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <div className="text-xs text-muted-foreground">Attendance</div>
              <div className="text-2xl font-bold">{attendancePct != null ? `${attendancePct}%` : "—"}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Link to="/portal/calendar">
        <Card className="hover:border-primary transition">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-sm">School calendar</div>
                <div className="text-xs text-muted-foreground">Term dates & events</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}