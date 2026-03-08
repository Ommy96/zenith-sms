import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function AttendanceChart() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;
  const [data, setData] = useState<{ day: string; present: number; absent: number }[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    const fetch = async () => {
      // Get last 7 days of attendance
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      const startDate = weekAgo.toISOString().split("T")[0];

      const { data: records } = await supabase
        .from("attendance")
        .select("date, status")
        .eq("school_id", schoolId)
        .gte("date", startDate);

      if (!records?.length) return;

      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const byDate: Record<string, { present: number; absent: number }> = {};

      records.forEach(r => {
        if (!byDate[r.date]) byDate[r.date] = { present: 0, absent: 0 };
        if (r.status === "present") byDate[r.date].present++;
        else byDate[r.date].absent++;
      });

      const sorted = Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).slice(-5);
      setData(sorted.map(([date, val]) => ({
        day: days[new Date(date + "T12:00:00").getDay()],
        present: val.present,
        absent: val.absent,
      })));
    };
    fetch();
  }, [schoolId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">Weekly Attendance</h3>
        <p className="text-xs text-muted-foreground mt-0.5">This week's attendance overview</p>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No attendance data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(220, 13%, 91%)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
            <Bar dataKey="present" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Present" />
            <Bar dataKey="absent" fill="hsl(0, 72%, 51%)" radius={[6, 6, 0, 0]} opacity={0.6} name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
