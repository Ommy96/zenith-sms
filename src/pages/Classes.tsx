import { ClassesTab } from "@/components/academics/ClassesTab";

export default function Classes() {
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Classes</h1><p className="text-sm text-muted-foreground mt-1">Manage teaching groups, rooms, capacity, and class teachers.</p></div><ClassesTab /></div>;
}