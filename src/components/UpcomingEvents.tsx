import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface EventItem {
  title: string;
  date: string;
  type: string;
}

const typeColors: Record<string, string> = {
  Exam: "bg-destructive/10 text-destructive",
  Invoice: "bg-warning/10 text-warning",
  Announcement: "bg-info/10 text-info",
};

export function UpcomingEvents() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    const fetch = async () => {
      const items: EventItem[] = [];
      const today = new Date().toISOString().split("T")[0];

      // Upcoming exams
      const { data: exams } = await supabase
        .from("exams").select("name, start_date")
        .eq("school_id", schoolId).eq("status", "upcoming")
        .gte("start_date", today).order("start_date").limit(3);
      exams?.forEach(e => items.push({
        title: e.name,
        date: e.start_date ? format(new Date(e.start_date + "T12:00:00"), "MMM d, yyyy") : "TBD",
        type: "Exam",
      }));

      // Upcoming invoice due dates
      const { data: invoices } = await supabase
        .from("invoices").select("invoice_number, due_date")
        .eq("school_id", schoolId).eq("status", "pending")
        .gte("due_date", today).order("due_date").limit(2);
      invoices?.forEach(i => items.push({
        title: `Fee Deadline — ${i.invoice_number || "Invoice"}`,
        date: i.due_date ? format(new Date(i.due_date + "T12:00:00"), "MMM d, yyyy") : "TBD",
        type: "Invoice",
      }));

      // Recent announcements
      const { data: announcements } = await supabase
        .from("announcements").select("title, created_at")
        .eq("school_id", schoolId).order("created_at", { ascending: false }).limit(2);
      announcements?.forEach(a => items.push({
        title: a.title,
        date: format(new Date(a.created_at!), "MMM d, yyyy"),
        type: "Announcement",
      }));

      setEvents(items.slice(0, 4));
    };
    fetch();
  }, [schoolId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Upcoming Events</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
      ) : (
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
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${typeColors[event.type] || "bg-muted text-muted-foreground"}`}>
                {event.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
