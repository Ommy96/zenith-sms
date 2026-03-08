import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bus, Library, Package, MapPin, BookOpen, Box, Truck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const moduleData: Record<string, { title: string; icon: any; stats: { label: string; value: string; icon: any }[]; items: { name: string; detail: string; status: string }[] }> = {
  "/transport": {
    title: "Transport Management",
    icon: Bus,
    stats: [
      { label: "Active Routes", value: "12", icon: MapPin },
      { label: "Vehicles", value: "8", icon: Truck },
      { label: "Students Using", value: "420", icon: Bus },
      { label: "Avg Trip Time", value: "35 min", icon: Clock },
    ],
    items: [
      { name: "Route A — North District", detail: "Bus #01 · 45 students · Driver: James", status: "Active" },
      { name: "Route B — East District", detail: "Bus #02 · 38 students · Driver: Maria", status: "Active" },
      { name: "Route C — South District", detail: "Bus #03 · 52 students · Driver: Ahmed", status: "Active" },
      { name: "Route D — West District", detail: "Bus #04 · 41 students · Driver: Chen", status: "Maintenance" },
    ],
  },
  "/library": {
    title: "Library Management",
    icon: Library,
    stats: [
      { label: "Total Books", value: "12,450", icon: BookOpen },
      { label: "Books Issued", value: "340", icon: Library },
      { label: "Overdue", value: "12", icon: Clock },
      { label: "New Arrivals", value: "45", icon: Box },
    ],
    items: [
      { name: "Advanced Mathematics — Vol. 3", detail: "ISBN: 978-0-123456-47-2 · Issued to: Grade 11A", status: "Issued" },
      { name: "Biology for Beginners", detail: "ISBN: 978-0-654321-89-0 · Shelf: S-12", status: "Available" },
      { name: "World History — Modern Era", detail: "ISBN: 978-0-111222-33-4 · Due: Mar 12", status: "Overdue" },
      { name: "English Literature Anthology", detail: "ISBN: 978-0-444555-66-7 · Shelf: S-03", status: "Available" },
    ],
  },
  "/inventory": {
    title: "Inventory & Assets",
    icon: Package,
    stats: [
      { label: "Total Assets", value: "1,840", icon: Package },
      { label: "Categories", value: "15", icon: Box },
      { label: "Low Stock", value: "8", icon: Clock },
      { label: "Total Value", value: "$245K", icon: Box },
    ],
    items: [
      { name: "Lab Equipment — Chemistry", detail: "42 items · Location: Lab C1", status: "Good" },
      { name: "Computer Lab — Room 201", detail: "30 desktops · Last audit: Feb 2026", status: "Good" },
      { name: "Sports Equipment", detail: "120 items · Location: Gym Storage", status: "Low Stock" },
      { name: "Classroom Furniture — Block A", detail: "240 desks · 240 chairs", status: "Good" },
    ],
  },
};

const statusColors: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  Maintenance: "bg-warning/10 text-warning border-warning/20",
  Issued: "bg-primary/10 text-primary border-primary/20",
  Available: "bg-success/10 text-success border-success/20",
  Overdue: "bg-destructive/10 text-destructive border-destructive/20",
  Good: "bg-success/10 text-success border-success/20",
  "Low Stock": "bg-warning/10 text-warning border-warning/20",
};

export default function Operations() {
  const location = useLocation();
  const data = moduleData[location.pathname];

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor {data.title.toLowerCase()}</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add New</Button>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {data.items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <data.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
            <Badge variant="outline" className={`text-[11px] shrink-0 ${statusColors[item.status] || ""}`}>{item.status}</Badge>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
