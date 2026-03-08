import { motion } from "framer-motion";
import { UserPlus, Clock, CheckCircle, XCircle, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const applications = [
  { id: "APP-001", name: "Alex Nguyen", grade: "9A", date: "Mar 6, 2026", guardian: "Linh Nguyen", status: "Under Review" },
  { id: "APP-002", name: "Maya Patel", grade: "10A", date: "Mar 5, 2026", guardian: "Raj Patel", status: "Interview Scheduled" },
  { id: "APP-003", name: "Liam O'Brien", grade: "8A", date: "Mar 3, 2026", guardian: "Siobhan O'Brien", status: "Accepted" },
  { id: "APP-004", name: "Fatima Al-Hassan", grade: "11A", date: "Mar 1, 2026", guardian: "Omar Al-Hassan", status: "Under Review" },
  { id: "APP-005", name: "Carlos Reyes", grade: "9B", date: "Feb 28, 2026", guardian: "Maria Reyes", status: "Rejected" },
];

const statusColors: Record<string, string> = {
  "Under Review": "bg-warning/10 text-warning border-warning/20",
  "Interview Scheduled": "bg-info/10 text-info border-info/20",
  "Accepted": "bg-success/10 text-success border-success/20",
  "Rejected": "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Admissions() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage student applications and enrollment pipeline</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New Application</Button>
      </motion.div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: "5", icon: UserPlus },
          { label: "Under Review", value: "2", icon: Clock },
          { label: "Accepted", value: "1", icon: CheckCircle },
          { label: "Rejected", value: "1", icon: XCircle },
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search applications..." className="pl-9 h-9 text-sm" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Application</TableHead>
              <TableHead className="text-xs font-semibold">Grade</TableHead>
              <TableHead className="text-xs font-semibold">Guardian</TableHead>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-foreground">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.id}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{app.grade}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{app.guardian}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{app.date}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[11px] ${statusColors[app.status]}`}>{app.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
