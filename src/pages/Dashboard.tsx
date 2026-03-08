import { Users, CreditCard, TrendingUp, UserCheck, GraduationCap, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { RevenueChart } from "@/components/RevenueChart";
import { RecentActivity } from "@/components/RecentActivity";
import { AttendanceChart } from "@/components/AttendanceChart";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, John. Here's what's happening today.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Students" value="2,847" change="+12% from last term" changeType="positive" icon={Users} color="primary" />
        <StatCard title="Fees Collected" value="$184K" change="+8% this month" changeType="positive" icon={CreditCard} color="success" />
        <StatCard title="Outstanding" value="$23K" change="32 pending" changeType="negative" icon={AlertCircle} color="warning" />
        <StatCard title="Attendance" value="94.2%" change="+1.5% this week" changeType="positive" icon={UserCheck} color="info" />
        <StatCard title="Teachers" value="186" change="4 on leave" changeType="neutral" icon={GraduationCap} color="primary" />
        <StatCard title="Revenue" value="$207K" change="+15% YoY" changeType="positive" icon={TrendingUp} color="success" />
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
