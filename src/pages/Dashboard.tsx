import { useState, useEffect } from "react";
import { Users, CreditCard, TrendingUp, UserCheck, GraduationCap, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { RecentActivity } from "@/components/RecentActivity";
import { AttendanceChart } from "@/components/AttendanceChart";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    staffOnLeave: 0,
    collected: 0,
    outstanding: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!schoolId) return;

    const fetchAll = async () => {
      const [studentsRes, staffRes, invoicesRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("status", "active"),
        supabase.from("staff").select("id, status").eq("school_id", schoolId),
        supabase.from("invoices").select("amount, paid_amount, status").eq("school_id", schoolId),
      ]);

      const studentCount = studentsRes.count || 0;
      const staffData = staffRes.data || [];
      const staffCount = staffData.length;
      const staffOnLeave = staffData.filter((s) => s.status === "on leave").length;

      const invData = invoicesRes.data || [];
      const totalRevenue = invData.reduce((s, i) => s + Number(i.amount), 0);
      const collected = invData.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
      const outstanding = totalRevenue - collected;
      const pendingInvoices = invData.filter((i) => i.status === "pending" || i.status === "overdue").length;

      setStats({ students: studentCount, staff: staffCount, staffOnLeave, collected, outstanding, pendingInvoices, totalRevenue });
    };

    fetchAll();
  }, [schoolId]);

  const fmt = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, {firstName}. Here's what's happening today.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Students" value={stats.students.toLocaleString()} change="active students" changeType="neutral" icon={Users} color="primary" />
        <StatCard title="Fees Collected" value={fmt(stats.collected)} change="total payments" changeType="positive" icon={CreditCard} color="success" />
        <StatCard title="Outstanding" value={fmt(stats.outstanding)} change={`${stats.pendingInvoices} pending`} changeType={stats.pendingInvoices > 0 ? "negative" : "neutral"} icon={AlertCircle} color="warning" />
        <StatCard title="Attendance" value="—" change="no data yet" changeType="neutral" icon={UserCheck} color="info" />
        <StatCard title="Staff" value={stats.staff.toLocaleString()} change={stats.staffOnLeave > 0 ? `${stats.staffOnLeave} on leave` : "all active"} changeType="neutral" icon={GraduationCap} color="primary" />
        <StatCard title="Revenue" value={fmt(stats.totalRevenue)} change="total invoiced" changeType="positive" icon={TrendingUp} color="success" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <RecentActivity />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceChart />
        <UpcomingEvents />
      </div>
    </div>
  );
}
