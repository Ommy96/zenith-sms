import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceRegister from "@/components/attendance/AttendanceRegister";
import AttendanceReports from "@/components/attendance/AttendanceReports";

export default function Attendance() {
  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daily and per-period registers. Guardians are notified automatically when a child is marked absent.
        </p>
      </motion.div>

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="mt-5">
          <AttendanceRegister />
        </TabsContent>
        <TabsContent value="reports" className="mt-5">
          <AttendanceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}