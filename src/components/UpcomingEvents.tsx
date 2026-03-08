import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";

const events = [
  { title: "Mid-Term Exams Begin", date: "Mar 15, 2026", type: "Exam" },
  { title: "Parent-Teacher Meeting", date: "Mar 18, 2026", type: "Meeting" },
  { title: "Science Fair", date: "Mar 22, 2026", type: "Event" },
  { title: "Fee Payment Deadline", date: "Mar 31, 2026", type: "Finance" },
];

const typeColors: Record<string, string> = {
  Exam: "bg-destructive/10 text-destructive",
  Meeting: "bg-info/10 text-info",
  Event: "bg-success/10 text-success",
  Finance: "bg-warning/10 text-warning",
};

export function UpcomingEvents() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Upcoming Events</h3>
      <div className="space-y-3">
        {events.map((event, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">{event.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" /> {event.date}
              </p>
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeColors[event.type]}`}>
              {event.type}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
