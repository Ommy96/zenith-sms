import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const data = [
  { month: "Jan", revenue: 42000, fees: 38000 },
  { month: "Feb", revenue: 48000, fees: 42000 },
  { month: "Mar", revenue: 55000, fees: 49000 },
  { month: "Apr", revenue: 51000, fees: 46000 },
  { month: "May", revenue: 60000, fees: 54000 },
  { month: "Jun", revenue: 58000, fees: 52000 },
  { month: "Jul", revenue: 65000, fees: 59000 },
];

export function RevenueChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">Revenue Overview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Monthly fee collection vs revenue</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(245, 58%, 51%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(245, 58%, 51%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" tick={{ fill: 'hsl(220, 10%, 46%)' }} />
          <YAxis axisLine={false} tickLine={false} className="text-xs" tick={{ fill: 'hsl(220, 10%, 46%)' }} tickFormatter={(v) => `$${v / 1000}k`} />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid hsl(220, 13%, 91%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Area type="monotone" dataKey="revenue" stroke="hsl(245, 58%, 51%)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
          <Area type="monotone" dataKey="fees" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fillOpacity={1} fill="url(#colorFees)" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
