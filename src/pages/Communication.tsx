import { motion } from "framer-motion";
import { Megaphone, Mail, MessageSquare, Send, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const announcements = [
  { title: "Mid-Term Exam Schedule Released", date: "Mar 8, 2026", audience: "All", priority: "High" },
  { title: "Parent-Teacher Meeting — March 18", date: "Mar 5, 2026", audience: "Parents", priority: "Medium" },
  { title: "Science Fair Registration Open", date: "Mar 3, 2026", audience: "Students", priority: "Low" },
  { title: "Fee Payment Deadline Reminder", date: "Mar 1, 2026", audience: "Parents", priority: "High" },
  { title: "New Library Books Available", date: "Feb 28, 2026", audience: "All", priority: "Low" },
];

const messages = [
  { from: "Mrs. Anderson", subject: "Grade 10A Math Assignment", time: "2 hrs ago", unread: true },
  { from: "Mr. Thompson", subject: "English Essay Deadline Extension", time: "5 hrs ago", unread: true },
  { from: "Dr. Patel", subject: "Physics Lab Equipment Request", time: "1 day ago", unread: false },
  { from: "Ms. Chen", subject: "Science Fair Volunteering", time: "2 days ago", unread: false },
];

const priorityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-warning/10 text-warning border-warning/20",
  Low: "bg-muted text-muted-foreground border-border",
};

export default function Communication() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Communication Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Announcements, messaging, and notifications</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> New Announcement</Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Announcements", value: "24", icon: Megaphone },
          { label: "Unread Messages", value: "7", icon: Mail },
          { label: "SMS Sent", value: "1,240", icon: Send },
          { label: "Pending Alerts", value: "3", icon: Bell },
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

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements" className="text-sm">Announcements</TabsTrigger>
          <TabsTrigger value="messages" className="text-sm">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-4 space-y-3">
          {announcements.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.date} · {a.audience}</p>
                </div>
              </div>
              <Badge variant="outline" className={`text-[11px] shrink-0 ${priorityColors[a.priority]}`}>{a.priority}</Badge>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="messages" className="mt-4 space-y-3">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer flex items-center justify-between gap-4 ${m.unread ? "border-primary/30" : "border-border"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 shrink-0 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground">
                  {m.from.split(" ").pop()?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{m.subject}</p>
                  <p className="text-xs text-muted-foreground">{m.from} · {m.time}</p>
                </div>
              </div>
              {m.unread && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
