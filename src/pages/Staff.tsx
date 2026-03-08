import { motion } from "framer-motion";
import { Search, Plus, Download, MoreHorizontal, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const staff = [
  { id: "TCH001", name: "Mrs. Anderson", email: "anderson@school.edu", department: "Mathematics", role: "Head of Dept", status: "Active", classes: 4 },
  { id: "TCH002", name: "Mr. Thompson", email: "thompson@school.edu", department: "English", role: "Senior Teacher", status: "Active", classes: 5 },
  { id: "TCH003", name: "Ms. Chen", email: "chen@school.edu", department: "Science", role: "Teacher", status: "Active", classes: 6 },
  { id: "TCH004", name: "Mr. Okafor", email: "okafor@school.edu", department: "History", role: "Teacher", status: "On Leave", classes: 0 },
  { id: "TCH005", name: "Dr. Patel", email: "patel@school.edu", department: "Physics", role: "Head of Dept", status: "Active", classes: 3 },
  { id: "TCH006", name: "Mrs. Garcia", email: "garcia@school.edu", department: "Biology", role: "Teacher", status: "Active", classes: 5 },
  { id: "TCH007", name: "Mr. Kim", email: "kim@school.edu", department: "Chemistry", role: "Senior Teacher", status: "Active", classes: 4 },
  { id: "TCH008", name: "Ms. Roberts", email: "roberts@school.edu", department: "Art", role: "Teacher", status: "Active", classes: 6 },
];

export default function Staff() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff & HR</h1>
          <p className="text-sm text-muted-foreground mt-1">{staff.length} staff members across all departments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
          <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Staff</Button>
        </div>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search staff..." className="pl-9 h-9 text-sm" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Staff</TableHead>
              <TableHead className="text-xs font-semibold">Department</TableHead>
              <TableHead className="text-xs font-semibold">Role</TableHead>
              <TableHead className="text-xs font-semibold">Classes</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground shrink-0">
                      {s.name.split(" ").pop()?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{s.department}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[11px]">{s.role}</Badge></TableCell>
                <TableCell className="text-sm">{s.classes}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "Active" ? "default" : "outline"} className={`text-[11px] ${s.status === "On Leave" ? "bg-warning/10 text-warning border-warning/20" : ""}`}>
                    {s.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
