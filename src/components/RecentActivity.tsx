import { motion } from "framer-motion";
import { UserPlus, CreditCard, ClipboardCheck, AlertTriangle, BookOpen } from "lucide-react";

const activities = [
  { icon: UserPlus, label: "New student enrolled", detail: "Sarah Johnson — Grade 10A", time: "2 min ago", color: "text-success" },
  { icon: CreditCard, label: "Fee payment received", detail: "$1,200 — Mark Williams", time: "15 min ago", color: "text-primary" },
  { icon: ClipboardCheck, label: "Exam results published", detail: "Mid-term — Grade 9", time: "1 hr ago", color: "text-info" },
  { icon: AlertTriangle, label: "Low attendance alert", detail: "Grade 8B — 68% today", time: "2 hrs ago", color: "text-warning" },
  { icon: BookOpen, label: "Assignment submitted", detail: "Physics Lab Report — 24 students", time: "3 hrs ago", color: "text-primary" },
];

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{item.time}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
