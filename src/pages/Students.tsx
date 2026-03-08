import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Plus, Filter, Download, MoreHorizontal, Mail, Eye,
  ChevronLeft, ChevronRight, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const students = [
  { id: "STU001", name: "Sarah Johnson", email: "sarah.j@school.edu", grade: "10A", status: "Active", feeStatus: "Paid", guardian: "Michael Johnson", phone: "+1 555-0101", attendance: "96%" },
  { id: "STU002", name: "Mark Williams", email: "mark.w@school.edu", grade: "9B", status: "Active", feeStatus: "Pending", guardian: "Lisa Williams", phone: "+1 555-0102", attendance: "91%" },
  { id: "STU003", name: "Emily Davis", email: "emily.d@school.edu", grade: "11A", status: "Active", feeStatus: "Paid", guardian: "Robert Davis", phone: "+1 555-0103", attendance: "98%" },
  { id: "STU004", name: "James Brown", email: "james.b@school.edu", grade: "8C", status: "Active", feeStatus: "Overdue", guardian: "Patricia Brown", phone: "+1 555-0104", attendance: "72%" },
  { id: "STU005", name: "Olivia Martinez", email: "olivia.m@school.edu", grade: "10B", status: "Active", feeStatus: "Paid", guardian: "Carlos Martinez", phone: "+1 555-0105", attendance: "94%" },
  { id: "STU006", name: "Daniel Wilson", email: "daniel.w@school.edu", grade: "12A", status: "Active", feeStatus: "Paid", guardian: "Karen Wilson", phone: "+1 555-0106", attendance: "89%" },
  { id: "STU007", name: "Sophia Lee", email: "sophia.l@school.edu", grade: "9A", status: "Inactive", feeStatus: "N/A", guardian: "David Lee", phone: "+1 555-0107", attendance: "—" },
  { id: "STU008", name: "Ethan Taylor", email: "ethan.t@school.edu", grade: "11B", status: "Active", feeStatus: "Pending", guardian: "Susan Taylor", phone: "+1 555-0108", attendance: "85%" },
];

const feeStatusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/10 text-warning border-warning/20",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
  "N/A": "bg-muted text-muted-foreground border-border",
};

export default function Students() {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === "all" || s.grade === gradeFilter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchGrade && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">{students.length} students enrolled across all grades</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input placeholder="First name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input placeholder="Last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="student@school.edu" type="email" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grade / Class</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                      <SelectContent>
                        {["8A","8B","8C","9A","9B","10A","10B","11A","11B","12A"].map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Guardian Name</Label>
                    <Input placeholder="Guardian name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input placeholder="+1 555-0100" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="All Grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {["8C","9A","9B","10A","10B","11A","11B","12A"].map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Student</TableHead>
              <TableHead className="text-xs font-semibold">Grade</TableHead>
              <TableHead className="text-xs font-semibold">Guardian</TableHead>
              <TableHead className="text-xs font-semibold">Attendance</TableHead>
              <TableHead className="text-xs font-semibold">Fee Status</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No students found</p>
                    <p className="text-xs text-muted-foreground/70">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {student.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{student.grade}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{student.guardian}</p>
                      <p className="text-xs text-muted-foreground">{student.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{student.attendance}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] ${feeStatusColors[student.feeStatus]}`}>
                      {student.feeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === "Active" ? "default" : "secondary"} className="text-[11px]">
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-sm gap-2"><Eye className="h-3.5 w-3.5" /> View Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-sm gap-2"><Mail className="h-3.5 w-3.5" /> Send Message</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {students.length} students</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">1</Button>
            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">2</Button>
            <Button variant="outline" size="icon" className="h-7 w-7"><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
