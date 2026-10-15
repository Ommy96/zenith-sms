import { useMemo, useState } from "react";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { shortDate } from "@/lib/portal/format";
import { usePortalData, must } from "@/lib/portal/usePortalData";
import { ListSkeleton, PageTitle, PortalEmpty, PortalError, StaleNote } from "@/components/portal/PortalStates";

const COLOR: Record<string, string> = {
  present: "bg-success text-success-foreground",
  absent: "bg-destructive text-destructive-foreground",
  late: "bg-primary text-primary-foreground",
  excused: "bg-background text-foreground ring-2 ring-inset ring-primary",
};
const LABEL: Record<string, string> = { present: "Present", absent: "Absent", late: "Late", excused: "Excused" };

export default function PortalAttendance() {
  const { activeChild } = usePortal();
  const [range, setRange] = useState<"term" | "year">("term");
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [picked, setPicked] = useState<any | null>(null);

  const { data, loading, error, cachedAt, retry } = usePortalData(
    activeChild ? `att:${activeChild.id}` : null,
    async () => {
      const [rec, term] = await Promise.all([
        supabase.from("attendance_records").select("id, status, reason, arrival_time, attendance_sessions:session_id(date, session_type)")
          .eq("student_id", activeChild!.id),
        supabase.from("terms").select("name, start_date, end_date").eq("tenant_id", activeChild!.tenant_id).eq("is_current", true).maybeSingle(),
      ]);
      return { records: must<any[]>(rec).filter((r) => r.attendance_sessions?.date), term: term.data };
    },
  );

  const term = data?.term;
  const yearStart = `${new Date().getFullYear()}-01-01`, yearEnd = `${new Date().getFullYear()}-12-31`;
  const from = range === "term" && term ? term.start_date : yearStart;
  const to = range === "term" && term ? term.end_date : yearEnd;
  const records = useMemo(() => (data?.records ?? [])
    .filter((r) => r.attendance_sessions.date >= from && r.attendance_sessions.date <= to)
    .sort((a, b) => b.attendance_sessions.date.localeCompare(a.attendance_sessions.date)), [data, from, to]);
  const byDate = useMemo(() => { const m = new Map<string, any>(); records.forEach((r) => { if (!m.has(r.attendance_sessions.date)) m.set(r.attendance_sessions.date, r); }); return m; }, [records]);
  const n = (s: string) => records.filter((r) => r.status === s).length;
  const pct = records.length ? Math.round(((n("present") + n("late")) / records.length) * 100) : null;

  const days = useMemo(() => {
    const first = (month.getDay() + 6) % 7; // Monday first
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  }, [month]);
  const iso = (d: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  if (!activeChild) return null;
  return (
    <div className="space-y-4">
      <PageTitle sub={activeChild.full_name}>Attendance</PageTitle>
      <StaleNote at={cachedAt} onRetry={retry} />
      <div className="grid h-12 grid-cols-2 rounded-lg bg-muted p-1">
        {(["term", "year"] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`rounded-md text-base font-medium ${range === r ? "bg-background shadow" : "text-muted-foreground"}`}>
            {r === "term" ? (term?.name || "This term") : "Full year"}
          </button>
        ))}
      </div>
      {loading && !data ? <ListSkeleton /> : error && !data ? <PortalError onRetry={retry} /> : (
        <>
          <Card><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Attendance</p>
            <p className="text-4xl font-bold text-primary">{pct != null ? `${pct}%` : "—"}</p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {(["present", "absent", "late", "excused"] as const).map((s) => (
                <div key={s}><p className="text-xl font-bold">{n(s)}</p><p className="text-xs text-muted-foreground">{LABEL[s]}</p></div>
              ))}
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button>
              <p className="text-base font-semibold">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                if (!d) return <div key={i} />;
                const rec = byDate.get(iso(d));
                return (
                  <button key={i} disabled={!rec} onClick={() => setPicked(rec)}
                    className={`flex h-11 items-center justify-center rounded-md text-sm font-medium ${rec ? COLOR[rec.status] ?? "bg-muted" : "bg-muted/50 text-muted-foreground"}`}>
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              {Object.keys(LABEL).map((s) => <span key={s} className="flex items-center gap-1"><span className={`h-3 w-3 rounded ${COLOR[s]}`} />{LABEL[s]}</span>)}
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted/50" />No record</span>
            </div>
            {picked && (
              <div className="mt-3 rounded-lg border p-3 text-base">
                <p className="font-semibold">{shortDate(picked.attendance_sessions.date)} — {LABEL[picked.status] ?? picked.status}</p>
                {picked.arrival_time && <p className="text-sm text-muted-foreground">Arrived {picked.arrival_time.slice(0, 5)}</p>}
                {picked.reason && <p className="text-sm">Reason: {picked.reason}</p>}
              </div>
            )}
          </CardContent></Card>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Absences</h2>
            {!records.some((r) => r.status === "absent") ? <PortalEmpty icon={CalendarCheck} title="No absences" text="Great attendance so far." /> : (
              <Card><CardContent className="divide-y p-0">
                {records.filter((r) => r.status === "absent").map((r) => (
                  <div key={r.id} className="p-4">
                    <p className="text-base font-medium">{shortDate(r.attendance_sessions.date)}</p>
                    <p className="text-sm text-muted-foreground">{r.reason || "No reason recorded"}</p>
                  </div>
                ))}
              </CardContent></Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
