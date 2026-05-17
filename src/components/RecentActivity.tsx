import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, CreditCard, ClipboardCheck, BookOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  icon: any;
  label: string;
  detail: string;
  time: string;
  color: string;
}

export function RecentActivity() {
  const { profile } = useAuth();
  const schoolId = profile?.tenant_id;
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    const fetch = async () => {
      const items: ActivityItem[] = [];

      // Recent students
      const { data: students } = await supabase
        .from("students").select("first_name, last_name, grade, created_at")
        .eq("tenant_id", schoolId).order("created_at", { ascending: false }).limit(2);
      students?.forEach(s => items.push({
        icon: UserPlus, label: "Student enrolled",
        detail: `${s.first_name} ${s.last_name} — ${s.grade || "N/A"}`,
        time: formatDistanceToNow(new Date(s.created_at!), { addSuffix: true }),
        color: "text-success",
      }));

      // Recent invoices
      const { data: invoices } = await supabase
        .from("invoices").select("invoice_number, amount, status, created_at")
        .eq("tenant_id", schoolId).order("created_at", { ascending: false }).limit(2);
      invoices?.forEach(i => items.push({
        icon: CreditCard, label: i.status === "paid" ? "Payment received" : "Invoice created",
        detail: `$${Number(i.amount).toLocaleString()} — ${i.invoice_number || ""}`,
        time: formatDistanceToNow(new Date(i.created_at!), { addSuffix: true }),
        color: "text-primary",
      }));

      // Recent exams
      const { data: exams } = await supabase
        .from("exams").select("name, status, created_at")
        .eq("tenant_id", schoolId).order("created_at", { ascending: false }).limit(1);
      exams?.forEach(e => items.push({
        icon: ClipboardCheck, label: `Exam ${e.status === "completed" ? "completed" : "scheduled"}`,
        detail: e.name,
        time: formatDistanceToNow(new Date(e.created_at!), { addSuffix: true }),
        color: "text-info",
      }));

      // Sort by most recent
      items.sort((a, b) => a.time.localeCompare(b.time));
      setActivities(items.slice(0, 5));
    };
    fetch();
  }, [schoolId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
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
      )}
    </motion.div>
  );
}
