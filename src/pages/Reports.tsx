import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Download, Users, DollarSign, ClipboardList, UserCheck,
  Loader2, TrendingUp, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportData {
  title: string;
  summary: { label: string; value: string; trend?: "up" | "down" | "neutral" }[];
  rows: Record<string, string | number>[];
  columns: string[];
}

const catColors: Record<string, string> = {
  Students: "bg-primary/10 text-primary",
  Finance: "bg-success/10 text-success",
  Attendance: "bg-info/10 text-info",
  Exams: "bg-warning/10 text-warning",
  Staff: "bg-accent text-accent-foreground",
};

export default function Reports() {
  const { profile } = useAuth();
  const schoolId = profile?.tenant_id;
  const [loading, setLoading] = useState<string | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const generateReport = async (type: string) => {
    if (!schoolId) return;
    setLoading(type);

    try {
      let data: ReportData | null = null;

      if (type === "students") {
        const { data: students } = await supabase
          .from("students").select("grade, gender, status, created_at")
          .eq("tenant_id", schoolId);
        const s = students || [];
        const grades: Record<string, number> = {};
        s.forEach(st => { const g = st.grade || "Unassigned"; grades[g] = (grades[g] || 0) + 1; });
        const active = s.filter(st => st.status === "active").length;
        const male = s.filter(st => st.gender === "male").length;
        const female = s.filter(st => st.gender === "female").length;

        data = {
          title: "Student Enrollment Report",
          summary: [
            { label: "Total Students", value: String(s.length) },
            { label: "Active", value: String(active), trend: "up" },
            { label: "Male / Female", value: `${male} / ${female}` },
          ],
          columns: ["Grade", "Count", "Percentage"],
          rows: Object.entries(grades).sort(([a],[b]) => a.localeCompare(b)).map(([grade, count]) => ({
            Grade: grade,
            Count: count,
            Percentage: `${Math.round((count / s.length) * 100)}%`,
          })),
        };
      }

      if (type === "finance") {
        const { data: invoices } = await supabase
          .from("invoices").select("amount, paid_amount, status, currency")
          .eq("tenant_id", schoolId);
        const inv = invoices || [];
        const total = inv.reduce((s, i) => s + Number(i.amount), 0);
        const collected = inv.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
        const rate = total > 0 ? Math.round((collected / total) * 100) : 0;
        const statuses: Record<string, { count: number; amount: number }> = {};
        inv.forEach(i => {
          const st = i.status || "pending";
          if (!statuses[st]) statuses[st] = { count: 0, amount: 0 };
          statuses[st].count++;
          statuses[st].amount += Number(i.amount);
        });

        const fmt = (n: number) => `$${n.toLocaleString()}`;
        data = {
          title: "Fee Collection Summary",
          summary: [
            { label: "Total Invoiced", value: fmt(total) },
            { label: "Collected", value: fmt(collected), trend: "up" },
            { label: "Collection Rate", value: `${rate}%`, trend: rate >= 80 ? "up" : "down" },
            { label: "Outstanding", value: fmt(total - collected), trend: "down" },
          ],
          columns: ["Status", "Count", "Amount"],
          rows: Object.entries(statuses).map(([status, val]) => ({
            Status: status.charAt(0).toUpperCase() + status.slice(1),
            Count: val.count,
            Amount: fmt(val.amount),
          })),
        };
      }

      if (type === "attendance") {
        const { data: records } = await supabase
          .from("attendance").select("date, status")
          .eq("tenant_id", schoolId);
        const att = records || [];
        const total = att.length;
        const present = att.filter(a => a.status === "present").length;
        const absent = att.filter(a => a.status === "absent").length;
        const late = att.filter(a => a.status === "late").length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        // By date
        const byDate: Record<string, { present: number; total: number }> = {};
        att.forEach(a => {
          if (!byDate[a.date]) byDate[a.date] = { present: 0, total: 0 };
          byDate[a.date].total++;
          if (a.status === "present") byDate[a.date].present++;
        });

        data = {
          title: "Attendance Analytics",
          summary: [
            { label: "Total Records", value: String(total) },
            { label: "Attendance Rate", value: `${rate}%`, trend: rate >= 85 ? "up" : "down" },
            { label: "Present / Absent / Late", value: `${present} / ${absent} / ${late}` },
          ],
          columns: ["Date", "Present", "Total", "Rate"],
          rows: Object.entries(byDate).sort(([a],[b]) => b.localeCompare(a)).slice(0, 14).map(([date, val]) => ({
            Date: date,
            Present: val.present,
            Total: val.total,
            Rate: `${Math.round((val.present / val.total) * 100)}%`,
          })),
        };
      }

      if (type === "exams") {
        const { data: results } = await supabase
          .from("exam_results").select("subject, score, grade, exam_id")
          .eq("tenant_id", schoolId);
        const res = results || [];
        const bySubject: Record<string, { scores: number[]; count: number }> = {};
        res.forEach(r => {
          if (!bySubject[r.subject]) bySubject[r.subject] = { scores: [], count: 0 };
          bySubject[r.subject].count++;
          if (r.score != null) bySubject[r.subject].scores.push(Number(r.score));
        });

        const totalResults = res.length;
        const allScores = res.filter(r => r.score != null).map(r => Number(r.score));
        const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
        const passRate = allScores.length > 0 ? Math.round((allScores.filter(s => s >= 50).length / allScores.length) * 100) : 0;

        data = {
          title: "Exam Performance Report",
          summary: [
            { label: "Total Results", value: String(totalResults) },
            { label: "Average Score", value: `${avgScore}%`, trend: avgScore >= 60 ? "up" : "down" },
            { label: "Pass Rate (≥50%)", value: `${passRate}%`, trend: passRate >= 70 ? "up" : "down" },
          ],
          columns: ["Subject", "Results", "Average", "Highest", "Lowest"],
          rows: Object.entries(bySubject).map(([subject, val]) => {
            const avg = val.scores.length > 0 ? Math.round(val.scores.reduce((a, b) => a + b, 0) / val.scores.length) : 0;
            return {
              Subject: subject,
              Results: val.count,
              Average: `${avg}%`,
              Highest: val.scores.length > 0 ? `${Math.max(...val.scores)}%` : "—",
              Lowest: val.scores.length > 0 ? `${Math.min(...val.scores)}%` : "—",
            };
          }),
        };
      }

      if (type === "staff") {
        const { data: staff } = await supabase
          .from("staff").select("department, role, status")
          .eq("tenant_id", schoolId);
        const s = staff || [];
        const byDept: Record<string, number> = {};
        s.forEach(st => { const d = st.department || "Unassigned"; byDept[d] = (byDept[d] || 0) + 1; });
        const active = s.filter(st => st.status === "active").length;
        const teachers = s.filter(st => st.role === "teacher").length;

        data = {
          title: "Staff Overview Report",
          summary: [
            { label: "Total Staff", value: String(s.length) },
            { label: "Active", value: String(active), trend: "up" },
            { label: "Teachers", value: String(teachers) },
          ],
          columns: ["Department", "Count", "Percentage"],
          rows: Object.entries(byDept).sort(([,a],[,b]) => b - a).map(([dept, count]) => ({
            Department: dept,
            Count: count,
            Percentage: `${Math.round((count / s.length) * 100)}%`,
          })),
        };
      }

      if (data) {
        setReport(data);
        setDialogOpen(true);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const exportCSV = () => {
    if (!report) return;
    const header = report.columns.join(",");
    const rows = report.rows.map(r => report.columns.map(c => `"${r[c] ?? ""}"`).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const reportCards = [
    { type: "students", title: "Student Enrollment Report", description: "Enrollment trends by grade, gender, and status", icon: Users, category: "Students" },
    { type: "finance", title: "Fee Collection Summary", description: "Revenue, outstanding balances, and collection rates", icon: DollarSign, category: "Finance" },
    { type: "attendance", title: "Attendance Analytics", description: "Daily and weekly attendance rates", icon: UserCheck, category: "Attendance" },
    { type: "exams", title: "Exam Performance Report", description: "Subject-wise averages, pass rates, and top performers", icon: ClipboardList, category: "Exams" },
    { type: "staff", title: "Staff Overview Report", description: "Department breakdown and role distribution", icon: BarChart3, category: "Staff" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate and export comprehensive school reports</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((rc, i) => (
          <motion.div key={rc.type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${catColors[rc.category]}`}>
                <rc.icon className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="text-[11px]">{rc.category}</Badge>
            </div>
            <h3 className="text-sm font-semibold text-card-foreground mb-1">{rc.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{rc.description}</p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 w-full" disabled={loading === rc.type} onClick={() => generateReport(rc.type)}>
              {loading === rc.type ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart3 className="h-3 w-3" />}
              {loading === rc.type ? "Generating..." : "Generate Report"}
            </Button>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {report && (
            <>
              <DialogHeader>
                <DialogTitle>{report.title}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {report.summary.map(s => (
                  <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      {s.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-success" />}
                      {s.trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  </div>
                ))}
              </div>

              {report.rows.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        {report.columns.map(c => (
                          <TableHead key={c} className="text-xs font-semibold">{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.rows.map((row, i) => (
                        <TableRow key={i}>
                          {report.columns.map(c => (
                            <TableCell key={c} className="text-sm">{row[c]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Button variant="outline" size="sm" className="gap-1.5 text-xs mt-2" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
