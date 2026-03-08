import { motion } from "framer-motion";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight, Search, Filter, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const stats = [
  { title: "Total Revenue", value: "$207,450", change: "+15.2%", up: true, icon: DollarSign, color: "bg-success/10 text-success" },
  { title: "Collected This Term", value: "$184,200", change: "+8.1%", up: true, icon: CheckCircle, color: "bg-primary/10 text-primary" },
  { title: "Outstanding", value: "$23,250", change: "32 invoices", up: false, icon: AlertCircle, color: "bg-warning/10 text-warning" },
  { title: "Overdue", value: "$8,400", change: "12 invoices", up: false, icon: TrendingUp, color: "bg-destructive/10 text-destructive" },
];

const revenueData = [
  { month: "Sep", collected: 45000, target: 52000 },
  { month: "Oct", collected: 52000, target: 52000 },
  { month: "Nov", collected: 48000, target: 52000 },
  { month: "Dec", collected: 55000, target: 52000 },
  { month: "Jan", collected: 60000, target: 55000 },
  { month: "Feb", collected: 58000, target: 55000 },
  { month: "Mar", collected: 62000, target: 55000 },
];

const pieData = [
  { name: "Tuition", value: 65 },
  { name: "Transport", value: 15 },
  { name: "Library", value: 8 },
  { name: "Lab Fees", value: 7 },
  { name: "Other", value: 5 },
];
const PIE_COLORS = ["hsl(245,58%,51%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(199,89%,48%)", "hsl(220,10%,75%)"];

const invoices = [
  { id: "INV-2026-001", student: "Sarah Johnson", grade: "10A", amount: "$1,200", date: "Mar 1, 2026", due: "Mar 15, 2026", status: "Paid" },
  { id: "INV-2026-002", student: "Mark Williams", grade: "9B", amount: "$1,200", date: "Mar 1, 2026", due: "Mar 15, 2026", status: "Pending" },
  { id: "INV-2026-003", student: "James Brown", grade: "8C", amount: "$1,200", date: "Feb 1, 2026", due: "Feb 15, 2026", status: "Overdue" },
  { id: "INV-2026-004", student: "Emily Davis", grade: "11A", amount: "$1,450", date: "Mar 1, 2026", due: "Mar 15, 2026", status: "Paid" },
  { id: "INV-2026-005", student: "Olivia Martinez", grade: "10B", amount: "$1,200", date: "Mar 1, 2026", due: "Mar 15, 2026", status: "Paid" },
  { id: "INV-2026-006", student: "Ethan Taylor", grade: "11B", amount: "$1,450", date: "Mar 1, 2026", due: "Mar 15, 2026", status: "Pending" },
];

const invoiceStatusColors: Record<string, string> = {
  Paid: "bg-success/10 text-success border-success/20",
  Pending: "bg-warning/10 text-warning border-warning/20",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Finance() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fee Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track collections, invoices, and financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
          <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Create Invoice</Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                <p className="text-2xl font-bold tracking-tight text-card-foreground">{stat.value}</p>
                <p className={`text-xs font-medium flex items-center gap-0.5 ${stat.up ? "text-success" : "text-muted-foreground"}`}>
                  {stat.up && <ArrowUpRight className="h-3 w-3" />}
                  {stat.change}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-1">Collection Trends</h3>
          <p className="text-xs text-muted-foreground mb-4">Monthly fee collection vs target</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(245,58%,51%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(245,58%,51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,10%,46%)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,10%,46%)', fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(220,13%,91%)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
              <Area type="monotone" dataKey="collected" stroke="hsl(245,58%,51%)" strokeWidth={2} fillOpacity={1} fill="url(#colCollected)" />
              <Area type="monotone" dataKey="target" stroke="hsl(220,10%,75%)" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-1">Fee Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Revenue by category</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {d.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Invoices Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Invoices</h3>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-9 h-8 text-xs" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Invoice</TableHead>
                <TableHead className="text-xs font-semibold">Student</TableHead>
                <TableHead className="text-xs font-semibold">Amount</TableHead>
                <TableHead className="text-xs font-semibold">Date</TableHead>
                <TableHead className="text-xs font-semibold">Due</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm font-medium text-primary">{inv.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{inv.student}</p>
                      <p className="text-xs text-muted-foreground">{inv.grade}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{inv.amount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inv.due}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] ${invoiceStatusColors[inv.status]}`}>{inv.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}
