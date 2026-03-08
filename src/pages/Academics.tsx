import { motion } from "framer-motion";
import { BookOpen, Users, Clock, GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const classes = [
  { name: "Grade 8A", students: 35, teacher: "Mrs. Anderson", subjects: 8, schedule: "Mon–Fri 8:00–14:30" },
  { name: "Grade 8B", students: 33, teacher: "Mr. Thompson", subjects: 8, schedule: "Mon–Fri 8:00–14:30" },
  { name: "Grade 9A", students: 38, teacher: "Ms. Chen", subjects: 9, schedule: "Mon–Fri 8:00–15:00" },
  { name: "Grade 9B", students: 36, teacher: "Mr. Okafor", subjects: 9, schedule: "Mon–Fri 8:00–15:00" },
  { name: "Grade 10A", students: 40, teacher: "Dr. Patel", subjects: 10, schedule: "Mon–Fri 7:30–15:30" },
  { name: "Grade 10B", students: 37, teacher: "Mrs. Garcia", subjects: 10, schedule: "Mon–Fri 7:30–15:30" },
  { name: "Grade 11A", students: 32, teacher: "Mr. Kim", subjects: 10, schedule: "Mon–Fri 7:30–16:00" },
  { name: "Grade 11B", students: 30, teacher: "Ms. Roberts", subjects: 10, schedule: "Mon–Fri 7:30–16:00" },
  { name: "Grade 12A", students: 28, teacher: "Dr. Müller", subjects: 8, schedule: "Mon–Fri 7:30–16:00" },
];

export default function Academics() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Classes & Subjects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage classes, subjects, and academic schedules</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add Class</Button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: "9", icon: BookOpen },
          { label: "Total Students", value: "309", icon: Users },
          { label: "Subjects Offered", value: "24", icon: GraduationCap },
          { label: "Avg Class Size", value: "34", icon: Clock },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <motion.div key={cls.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-card-foreground">{cls.name}</h3>
              <Badge variant="secondary" className="text-[11px]">{cls.students} students</Badge>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" /> {cls.teacher}</div>
              <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> {cls.subjects} subjects</div>
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {cls.schedule}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
