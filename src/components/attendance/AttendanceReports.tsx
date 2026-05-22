import { useState, useCallback, useEffect } from "react";
import { Loader2, TrendingDown, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type ChronicRow = {
  student_id: string; full_name: string; admission_number: string | null;
  class_name: string | null; absent_days: number; late_days: number;
  total_marked: number; absence_pct: number | null;
};

export default function AttendanceReports() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const today = new Date();
  const monthAgo = new Date(); monthAgo.setDate(today.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const [from, setFrom] = useState(fmt(monthAgo));
  const [to, setTo] = useState(fmt(today));
  const [minAbsences, setMinAbsences] = useState(3);
  const [rows, setRows] = useState<ChronicRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("attendance_chronic_absentees", {
      _tenant: tenantId, _from: from, _to: to, _min_absences: minAbsences,
    });
    if (error) toast({ title: "Failed to load report", description: error.message, variant: "destructive" });
    setRows((data as ChronicRow[]) || []);
    setLoading(false);
  }, [tenantId, from, to, minAbsences]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCsv = () => {
    const header = ["Name", "Adm#", "Class", "Absent days", "Late days", "Total marked", "Absence %"];
    const lines = [header.join(",")].concat(
      rows.map((r) => [r.full_name, r.admission_number || "", r.class_name || "",
        r.absent_days, r.late_days, r.total_marked, r.absence_pct ?? ""].join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chronic-absentees-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px] h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px] h-9 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Min absences</label>
          <Input type="number" min={1} value={minAbsences} onChange={(e) => setMinAbsences(Number(e.target.value) || 1)}
            className="w-[100px] h-9 text-sm" />
        </div>
        <Button onClick={fetchData} size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
          Refresh
        </Button>
        <Button onClick={exportCsv} size="sm" variant="outline" disabled={rows.length === 0}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingDown className="h-4 w-4" /> Chronic absentees</div>
          <p className="text-2xl font-bold mt-1">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Users className="h-4 w-4" /> Total absent days</div>
          <p className="text-2xl font-bold mt-1">{rows.reduce((sum, r) => sum + r.absent_days, 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingDown className="h-4 w-4" /> Worst absence %</div>
          <p className="text-2xl font-bold mt-1">{rows[0]?.absence_pct ?? "—"}%</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Student</TableHead>
              <TableHead className="text-xs font-semibold">Class</TableHead>
              <TableHead className="text-xs font-semibold text-right">Absent</TableHead>
              <TableHead className="text-xs font-semibold text-right">Late</TableHead>
              <TableHead className="text-xs font-semibold text-right">Marked</TableHead>
              <TableHead className="text-xs font-semibold text-right">Absence %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                No chronic absentees in this period — that's great!
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.student_id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="font-medium text-sm">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground">{r.admission_number}</div>
                </TableCell>
                <TableCell className="text-sm">{r.class_name || "—"}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{r.absent_days}</Badge>
                </TableCell>
                <TableCell className="text-right text-sm">{r.late_days}</TableCell>
                <TableCell className="text-right text-sm">{r.total_marked}</TableCell>
                <TableCell className="text-right font-semibold text-sm">{r.absence_pct ?? "—"}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}