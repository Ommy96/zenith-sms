import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTenant } from "@/contexts/TenantContext";
import { CalendarTab } from "@/components/academics/CalendarTab";
import { GradeLevelsTab } from "@/components/academics/GradeLevelsTab";
import { ClassesTab } from "@/components/academics/ClassesTab";
import { SubjectsTab } from "@/components/academics/SubjectsTab";
import { RoomsTab } from "@/components/academics/RoomsTab";
import { CbcCurriculumTab } from "@/components/academics/CbcCurriculumTab";

export default function Academics() {
  const { tenant } = useTenant();
  const isCbc = tenant?.curriculum === "cbc";
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Academics</h1>
          <p className="text-sm text-muted-foreground">Calendar, structure, subjects and curriculum.</p>
        </div>
      </div>
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="grades">Grade Levels</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          {isCbc && <TabsTrigger value="cbc">CBC Curriculum</TabsTrigger>}
        </TabsList>
        <TabsContent value="calendar"><CalendarTab /></TabsContent>
        <TabsContent value="grades"><GradeLevelsTab /></TabsContent>
        <TabsContent value="classes"><ClassesTab /></TabsContent>
        <TabsContent value="subjects"><SubjectsTab /></TabsContent>
        <TabsContent value="rooms"><RoomsTab /></TabsContent>
        {isCbc && <TabsContent value="cbc"><CbcCurriculumTab /></TabsContent>}
      </Tabs>
    </motion.div>
  );
}
