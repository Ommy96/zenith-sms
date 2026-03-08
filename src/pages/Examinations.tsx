import { motion } from "framer-motion";
import { ClipboardList, Calendar, TrendingUp, Award, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const exams = [
  { name: "Mid-Term Examination", type: "Mid-Term", date: "Mar 15–22, 2026", grades: "8–12", status: "Upcoming", papers: 42 },
  { name: "Unit Test 3", type: "Unit Test", date: "Feb 10–12, 2026", grades: "8–12", status: "Completed", papers: 42 },
  { name: "Term 1 Final", type: "Final", date: "Dec 8–18, 2025", grades: "8–12", status: "Completed", papers: 45 },
  { name: "Unit Test 2", type: "Unit Test", date: "Oct 15–17, 2025", grades: "8–12", status: "Completed", papers: 42 },
];

const performanceData = [
  { subject: "Math", avg: 72 },
  { subject: "English", avg: 78 },
  { subject: "Science", avg: 68 },
  { subject: "History", avg: 81 },
  { subject: "Physics", avg: 65 },
  { subject: "Biology", avg: 74 },
  { subject: "Chemistry", avg: 70 },
  { subject: "Art", avg: 88 },
];

const statusColors: Record<string, string> = {
  Upcoming: "bg-primary/10 text-primary border-primary/20",
  Completed: "bg-success/10 text-success border-success/20",
  "In Progress": "bg-warning/10 text-warning border-warning/20",
};

export default function Examinations() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examinations & Results</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage exams, grading, and performance analytics</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Schedule Exam</Button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Upcoming Exams", value: "1", icon: Calendar },
          { label: "Completed", value: "3", icon: ClipboardList },
          { label: "Avg Score", value: "74.5%", icon: TrendingUp },
          { label: "Top Performers", value: "42", icon: Award },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exams Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-card-foreground">Exam Schedule</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Exam</TableHead>
                <TableHead className="text-xs font-semibold">Date</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.name} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <p className="text-sm font-medium">{exam.name}</p>
                    <p className="text-xs text-muted-foreground">{exam.type} · {exam.papers} papers</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{exam.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] ${statusColors[exam.status]}`}>{exam.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>

        {/* Performance Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-1">Subject Performance</h3>
          <p className="text-xs text-muted-foreground mb-4">Average scores by subject (Unit Test 3)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={performanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,10%,46%)', fontSize: 12 }} />
              <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,10%,46%)', fontSize: 12 }} width={70} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="avg" fill="hsl(245,58%,51%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
