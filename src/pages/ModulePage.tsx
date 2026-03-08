import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";

const moduleNames: Record<string, string> = {
  "/students": "Student Information System",
  "/admissions": "Admissions & Enrollment",
  "/academics": "Academic Management",
  "/examinations": "Examinations & Results",
  "/fees": "Fee Management & Payments",
  "/communication": "Communication Hub",
  "/staff": "Staff & HR Management",
  "/transport": "Transport Management",
  "/library": "Library Management",
  "/reports": "Reports & Analytics",
  "/settings": "Settings",
};

export default function ModulePage() {
  const location = useLocation();
  const title = moduleNames[location.pathname] || "Module";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl"
    >
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-8">
        This module is being built. Stay tuned for updates.
      </p>

      <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Construction className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-card-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          The {title} module is under development. This will include full CRUD operations, analytics, and integrations.
        </p>
      </div>
    </motion.div>
  );
}
