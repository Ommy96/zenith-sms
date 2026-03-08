import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function RevenueChart() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;
  const [data, setData] = useState<{ month: string; revenue: number; collected: number }[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    const fetch = async () => {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("amount, paid_amount, created_at")
        .eq("school_id", schoolId);
      if (!invoices?.length) return;

      const byMonth: Record<string, { revenue: number; collected: number }> = {};
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      invoices.forEach((inv) => {
        const d = new Date(inv.created_at!);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}`;
        if (!byMonth[key]) byMonth[key] = { revenue: 0, collected: 0 };
        byMonth[key].revenue += Number(inv.amount);
        byMonth[key].collected += Number(inv.paid_amount || 0);
      });

      const sorted = Object.entries(byMonth).sort(([a],[b]) => a.localeCompare(b)).slice(-7);
      setData(sorted.map(([key, val]) => ({
        month: months[parseInt(key.split("-")[1])],
        revenue: val.revenue,
        collected: val.collected,
      })));
    };
    fetch();
  }, [schoolId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">Revenue Overview</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Monthly invoiced vs collected</p>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">No invoice data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(220, 13%, 91%)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Invoiced" />
            <Area type="monotone" dataKey="collected" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" name="Collected" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
