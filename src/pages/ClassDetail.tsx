import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";
import { ClassSubjectsTab } from "@/components/academics/ClassSubjectsTab";

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (!tenant?.id || !id) return;
    setLoading(true);
    const [c, e] = await Promise.all([
      supabase.from("classes").select("*, grade_levels(name,code), academic_years(name), rooms(name), staff!classes_class_teacher_fkey(first_name,last_name)").eq("tenant_id", tenant.id).eq("id", id).maybeSingle(),
      supabase.from("student_enrollments").select("id,students(id,first_name,last_name,admission_number)").eq("tenant_id", tenant.id).eq("class_id", id).eq("status", "active"),
    ]);
    if (c.error || !c.data) toast({ title: "Class not found", variant: "destructive" });
    setData(c.data); setStudents(e.data ?? []); setLoading(false);
  };
  useEffect(() => { void load(); }, [tenant?.id, id]);
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data) return <Button variant="ghost" onClick={() => navigate("/academics/classes")}>Back to classes</Button>;
  return <div className="space-y-6">
    <Button variant="ghost" size="sm" onClick={() => navigate("/academics/classes")}><ArrowLeft className="h-4 w-4 mr-2" />Back to classes</Button>
    <div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">{data.name}</h1><Badge variant={data.is_active ? "secondary" : "outline"}>{data.is_active ? "Active" : "Inactive"}</Badge></div><p className="text-sm text-muted-foreground mt-1">{data.grade_levels?.name ?? "No grade"} · {data.academic_years?.name ?? "No academic year"} · Capacity {data.capacity}</p></div>
    <Tabs defaultValue="students"><TabsList><TabsTrigger value="students">Students</TabsTrigger><TabsTrigger value="subjects">Subjects</TabsTrigger><TabsTrigger value="timetable">Timetable</TabsTrigger></TabsList>
      <TabsContent value="students"><Card><CardHeader><CardTitle>Enrolled students ({students.length})</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Admission</TableHead><TableHead>Name</TableHead></TableRow></TableHeader><TableBody>{students.map((row) => <TableRow key={row.id}><TableCell>{row.students?.admission_number}</TableCell><TableCell>{row.students?.first_name} {row.students?.last_name}</TableCell></TableRow>)}{!students.length && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No active enrollments.</TableCell></TableRow>}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="subjects"><ClassSubjectsTab classId={data.id} className={data.name} /></TabsContent>
      <TabsContent value="timetable"><Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Timetable setup is available in the Timetable module.</CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}