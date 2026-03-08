import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const data = [
  { day: "Mon", present: 92, absent: 8 },
  { day: "Tue", present: 88, absent: 12 },
  { day: "Wed", present: 95, absent: 5 },
  { day: "Thu", present: 90, absent: 10 },
  { day: "Fri", present: 85, absent: 15 },
];

export function AttendanceChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">Weekly Attendance</h3>
        <p className="text-xs text-muted-foreground mt-0.5">This week's attendance overview</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid hsl(220, 13%, 91%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="present" fill="hsl(245, 58%, 51%)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="absent" fill="hsl(0, 72%, 51%)" radius={[6, 6, 0, 0]} opacity={0.6} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
