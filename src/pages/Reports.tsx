import { motion } from "framer-motion";
import { BarChart3, Download, FileText, Users, DollarSign, ClipboardList, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const reports = [
  { title: "Student Enrollment Report", description: "Enrollment trends by grade, term, and year", icon: Users, category: "Students", lastGenerated: "Mar 7, 2026" },
  { title: "Fee Collection Summary", description: "Revenue, outstanding balances, and collection rates", icon: DollarSign, category: "Finance", lastGenerated: "Mar 6, 2026" },
  { title: "Attendance Analytics", description: "Daily, weekly, and monthly attendance rates", icon: UserCheck, category: "Attendance", lastGenerated: "Mar 8, 2026" },
  { title: "Exam Performance Report", description: "Subject-wise averages, pass rates, and top performers", icon: ClipboardList, category: "Exams", lastGenerated: "Feb 28, 2026" },
  { title: "Teacher Workload Analysis", description: "Classes, subjects, and hours per teacher", icon: BarChart3, category: "Staff", lastGenerated: "Mar 1, 2026" },
  { title: "Custom Report Builder", description: "Create custom reports with selected data and filters", icon: FileText, category: "Custom", lastGenerated: "—" },
];

const catColors: Record<string, string> = {
  Students: "bg-primary/10 text-primary",
  Finance: "bg-success/10 text-success",
  Attendance: "bg-info/10 text-info",
  Exams: "bg-warning/10 text-warning",
  Staff: "bg-accent text-accent-foreground",
  Custom: "bg-muted text-muted-foreground",
};

export default function Reports() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate and export comprehensive school reports</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report, i) => (
          <motion.div key={report.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${catColors[report.category]}`}>
                <report.icon className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="text-[11px]">{report.category}</Badge>
            </div>
            <h3 className="text-sm font-semibold text-card-foreground mb-1">{report.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{report.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Last: {report.lastGenerated}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="h-3 w-3" /> Export
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
