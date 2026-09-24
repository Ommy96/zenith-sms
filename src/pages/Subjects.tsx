import { SubjectsTab } from "@/components/academics/SubjectsTab";

export default function Subjects() {
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Subjects</h1><p className="text-sm text-muted-foreground mt-1">Manage learning areas and grade coverage.</p></div><SubjectsTab /></div>;
}