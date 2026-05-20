import { useEffect, useState } from "react";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalAcademics() {
  const { activeChild } = usePortal();
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeChild) return;
    (async () => {
      setLoading(true);
      const [{ data: r }, { data: a }] = await Promise.all([
        supabase.from("student_exam_results")
          .select("id, raw_marks, max_marks, grade, position_in_class, created_at")
          .eq("student_id", activeChild.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("attendance")
          .select("date, status")
          .eq("student_id", activeChild.id)
          .order("date", { ascending: false })
          .limit(30),
      ]);
      setResults(r || []);
      setAttendance(a || []);
      setLoading(false);
    })();
  }, [activeChild?.id]);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <Tabs defaultValue="results">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="results">Exam results</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
      </TabsList>
      <TabsContent value="results" className="space-y-2 mt-3">
        {results.length === 0 && <p className="text-sm text-muted-foreground">No results published yet.</p>}
        {results.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{Number(r.raw_marks)}/{Number(r.max_marks)}</div>
                <div className="text-xs text-muted-foreground">
                  {r.position_in_class ? `Position ${r.position_in_class}` : "—"} · {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              {r.grade && <Badge>{r.grade}</Badge>}
            </CardContent>
          </Card>
        ))}
      </TabsContent>
      <TabsContent value="attendance" className="space-y-2 mt-3">
        {attendance.length === 0 && <p className="text-sm text-muted-foreground">No attendance records yet.</p>}
        {attendance.map((a, i) => (
          <Card key={i}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="text-sm font-medium">{new Date(a.date).toLocaleDateString()}</div>
              <Badge
                variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "secondary"}
              >
                {a.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}