import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, UserPlus, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function FaceAttendance() {
  const { tenant } = useTenant();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [enrollStudent, setEnrollStudent] = useState<string>("");
  const [enrollFile, setEnrollFile] = useState<File | null>(null);
  const [classFile, setClassFile] = useState<File | null>(null);
  const [markAttendance, setMarkAttendance] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    if (!tenant) return;
    (async () => {
      const { data: cls } = await supabase.from("classes")
        .select("id, name").eq("tenant_id", tenant.id).order("name");
      setClasses(cls || []);
      const { data: enr } = await supabase.from("face_enrollments")
        .select("id, student_id, image_path, created_at, students:student_id(first_name,last_name,admission_number)")
        .eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(50);
      setEnrollments(enr || []);
      const { data: ses } = await supabase.from("face_attendance_sessions")
        .select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(10);
      setSessions(ses || []);
    })();
  }, [tenant?.id]);

  useEffect(() => {
    if (!tenant || !classId) { setStudents([]); return; }
    (async () => {
      const { data } = await supabase.from("students")
        .select("id, first_name, last_name, admission_number")
        .eq("tenant_id", tenant.id).eq("current_class_id", classId).eq("status", "active")
        .order("first_name");
      setStudents(data || []);
    })();
  }, [tenant?.id, classId]);

  const enroll = async () => {
    if (!tenant || !enrollStudent || !enrollFile) return;
    setBusy(true);
    try {
      const ext = enrollFile.name.split(".").pop() || "jpg";
      const path = `${tenant.id}/${enrollStudent}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("face-enrollments").upload(path, enrollFile, { contentType: enrollFile.type });
      if (up.error) throw up.error;
      const { error } = await supabase.from("face_enrollments").insert({
        tenant_id: tenant.id, student_id: enrollStudent, image_path: path,
      });
      if (error) throw error;
      toast.success("Student face enrolled");
      setEnrollFile(null);
      const { data: enr } = await supabase.from("face_enrollments")
        .select("id, student_id, image_path, created_at, students:student_id(first_name,last_name,admission_number)")
        .eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(50);
      setEnrollments(enr || []);
    } catch (e: any) { toast.error(e.message || "Enroll failed"); }
    finally { setBusy(false); }
  };

  const scan = async () => {
    if (!tenant || !classFile || !classId) { toast.error("Select a class and photo"); return; }
    setBusy(true); setResult(null);
    try {
      const ext = classFile.name.split(".").pop() || "jpg";
      const path = `${tenant.id}/${classId}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("classroom-photos").upload(path, classFile, { contentType: classFile.type });
      if (up.error) throw up.error;
      const { data, error } = await supabase.functions.invoke("ai-face-attendance", {
        body: { tenantId: tenant.id, classId, photoPath: path, markAttendance },
      });
      if (error) throw error;
      if ((data as any).error) throw new Error((data as any).error);
      setResult(data);
      toast.success(`Identified ${(data as any).matches?.length || 0} student(s)`);
      const { data: ses } = await supabase.from("face_attendance_sessions")
        .select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(10);
      setSessions(ses || []);
      setClassFile(null);
    } catch (e: any) { toast.error(e.message || "Scan failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" /> AI Face Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enrol students with a reference photo, then snap a classroom photo to mark attendance automatically.
        </p>
      </motion.div>

      <Tabs defaultValue="scan">
        <TabsList>
          <TabsTrigger value="scan"><Camera className="h-3.5 w-3.5 mr-1.5" />Scan classroom</TabsTrigger>
          <TabsTrigger value="enroll"><UserPlus className="h-3.5 w-3.5 mr-1.5" />Enrol faces</TabsTrigger>
          <TabsTrigger value="enrolled"><Users className="h-3.5 w-3.5 mr-1.5" />Enrolled ({enrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan classroom photo</CardTitle>
              <CardDescription>AI matches faces against enrolled students.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Class</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
                    <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Classroom photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setClassFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={markAttendance} onCheckedChange={setMarkAttendance} id="mark" />
                <Label htmlFor="mark" className="cursor-pointer">Mark matched students present</Label>
              </div>
              <Button onClick={scan} disabled={busy || !classFile || !classId}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                Identify faces
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> Identification result
                </CardTitle>
                <CardDescription>
                  {result.matches?.length || 0} matched · {result.unmatched_faces || 0} unmatched faces
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result.notes && <p className="text-sm text-muted-foreground mb-3">{result.notes}</p>}
                <div className="space-y-1">
                  {(result.matches || []).map((m: any) => (
                    <div key={m.student_id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <div className="text-sm font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">Adm# {m.admission_number}</div>
                      </div>
                      <Badge variant="secondary">{Math.round(m.confidence * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Recent sessions</CardTitle></CardHeader>
            <CardContent>
              {sessions.length === 0 ? <p className="text-sm text-muted-foreground">No sessions yet.</p> : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded border text-sm">
                      <div>{new Date(s.created_at).toLocaleString()} · {s.capture_date}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{s.status}</Badge>
                        <span>{(s.matched_students || []).length} matched</span>
                        {s.marked_attendance && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">attendance saved</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enroll" className="mt-5">
          <Card>
            <CardHeader>
              <CardTitle>Enrol a student face</CardTitle>
              <CardDescription>Upload a clear forward-facing photo of one student.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Student</Label>
                <Select value={enrollStudent} onValueChange={setEnrollStudent}>
                  <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name} · {s.admission_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference photo</Label>
                <Input type="file" accept="image/*" onChange={(e) => setEnrollFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={enroll} disabled={busy || !enrollStudent || !enrollFile}>
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Enrol face
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrolled" className="mt-5">
          <Card>
            <CardHeader><CardTitle>Enrolled students</CardTitle></CardHeader>
            <CardContent>
              {enrollments.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {enrollments.map((e: any) => (
                    <div key={e.id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{e.students?.first_name} {e.students?.last_name}</div>
                        <div className="text-xs text-muted-foreground">Adm# {e.students?.admission_number}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}