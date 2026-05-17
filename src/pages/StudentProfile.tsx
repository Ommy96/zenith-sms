import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, Loader2, Mail, Phone, Calendar, MapPin, Shield, FileText, Activity, Heart, GraduationCap, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";
import { Money } from "@/components/Money";
import { DateTime } from "@/components/DateTime";
import { getStudentGovIdFields } from "@/lib/sis/countryFields";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { tenant, can } = useTenant();
  const [student, setStudent] = useState<any>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [classRow, setClassRow] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewMedical = can("students.view_medical");

  useEffect(() => {
    (async () => {
      if (!id || !profile?.tenant_id) return;
      setLoading(true);
      const { data: s, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
      if (error || !s) { toast({ title: "Student not found", variant: "destructive" }); navigate("/students"); return; }
      setStudent(s);

      const [{ data: sg }, { data: cls }, { data: inv }, { data: act }, { data: dd }] = await Promise.all([
        supabase.from("student_guardians").select("*, guardians(*)").eq("student_id", id),
        s.current_class_id ? supabase.from("classes").select("*").eq("id", s.current_class_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("invoices").select("*").eq("student_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("student_activity").select("*").eq("student_id", id).order("occurred_at", { ascending: false }).limit(50),
        supabase.from("documents").select("*").eq("owner_type", "student").eq("owner_id", id).order("created_at", { ascending: false }),
      ]);
      setGuardians(sg ?? []);
      setClassRow(cls);
      setInvoices(inv ?? []);
      setActivity(act ?? []);
      setDocs(dd ?? []);
      setLoading(false);
    })();
  }, [id, profile?.tenant_id, navigate]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!student) return null;

  const initials = `${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`.toUpperCase();
  const govFields = getStudentGovIdFields(tenant?.country_code);
  const populatedGovFields = govFields.filter(f => student[f.key]);
  const age = student.date_of_birth ? Math.floor((Date.now() - new Date(student.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const balance = invoices.reduce((acc, i) => acc + Number(i.amount || 0) - Number(i.paid_amount || 0), 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/students")} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back to students</Button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
              {student.photo_url ? <img src={student.photo_url} alt="" className="h-full w-full object-cover rounded-2xl" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{student.first_name} {student.middle_name} {student.last_name}</h1>
                <Badge variant="outline" className="capitalize">{student.enrollment_status || student.status}</Badge>
                {student.learner_category && <Badge variant="secondary" className="capitalize">{student.learner_category.replace("_", " ")}</Badge>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {student.admission_number && <span>#{student.admission_number}</span>}
                {classRow && <span>{classRow.name}</span>}
                {student.stream && <span>Stream: {student.stream}</span>}
                {age != null && <span>{age} years</span>}
                <span className="capitalize">{student.gender}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5"><Edit className="h-3.5 w-3.5" /> Edit</Button>
              <Button size="sm" variant="outline" className="gap-1.5"><Mail className="h-3.5 w-3.5" /> Message</Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="academics">Academics</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
              {canViewMedical && <TabsTrigger value="health">Health</TabsTrigger>}
              <TabsTrigger value="documents">Docs</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card className="p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Identity</h3>
                <Row label="Preferred name" value={student.preferred_name} />
                <Row label="Date of birth" value={student.date_of_birth} />
                <Row label="Nationality" value={student.nationality} />
                <Row label="House" value={student.house} />
              </Card>
              {populatedGovFields.length > 0 && (
                <Card className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold">Government IDs ({tenant?.country_code})</h3>
                  {populatedGovFields.map(f => <Row key={f.key} label={f.label} value={student[f.key]} />)}
                </Card>
              )}
              <Card className="p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Contact</h3>
                <Row label="Address" value={student.residential_address} />
                <Row label="City" value={student.city} />
                <Row label="Emergency contact" value={student.emergency_contact_name && `${student.emergency_contact_name} — ${student.emergency_contact_phone || ""}`} />
              </Card>
            </TabsContent>

            <TabsContent value="academics" className="space-y-4 mt-4">
              <Card className="p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Academic record</h3>
                <Row label="Current class" value={classRow?.name} />
                <Row label="Admission grade" value={student.admission_grade} />
                <Row label="Previous school" value={student.previous_school} />
                <Row label="Expected graduation" value={student.expected_graduation_year} />
                <Row label="Admission date" value={student.admission_date} />
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card className="p-5"><p className="text-sm text-muted-foreground">Attendance records will appear here.</p></Card>
            </TabsContent>

            <TabsContent value="fees" className="mt-4 space-y-3">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Outstanding balance</h3>
                  <span className={`text-lg font-semibold ${balance > 0 ? "text-destructive" : "text-success"}`}><Money amount={balance} /></span>
                </div>
                <div className="space-y-2">
                  {invoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices.</p> :
                    invoices.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{inv.description || inv.invoice_number || "Invoice"}</p>
                          <p className="text-xs text-muted-foreground">{inv.term} {inv.academic_year}</p>
                        </div>
                        <div className="text-right">
                          <p><Money amount={Number(inv.amount)} /></p>
                          <Badge variant="outline" className="text-[10px] capitalize">{inv.status}</Badge>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </Card>
            </TabsContent>

            {canViewMedical && (
              <TabsContent value="health" className="mt-4 space-y-3">
                <Card className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Heart className="h-4 w-4" /> Medical</h3>
                  <Row label="Blood group" value={student.blood_group !== "unknown" ? student.blood_group : null} />
                  <Row label="Allergies" value={student.allergies} />
                  <Row label="Chronic conditions" value={student.chronic_conditions} />
                  <Row label="Medications" value={student.medications} />
                  <Row label="Doctor" value={student.doctor_name && `${student.doctor_name} — ${student.doctor_phone || ""}`} />
                  <Row label="Insurance" value={student.insurance_provider} />
                  <Row label="NHIF/SHIF" value={student.nhif_or_shif_number} />
                </Card>
                {student.has_special_needs && (
                  <Card className="p-5 space-y-3 border-warning/30">
                    <h3 className="text-sm font-semibold">Special needs</h3>
                    <p className="text-sm">{student.special_needs_details}</p>
                    <Row label="IEP on file" value={student.iep_on_file ? "Yes" : "No"} />
                    <Row label="Accommodations" value={student.accommodations} />
                  </Card>
                )}
              </TabsContent>
            )}

            <TabsContent value="documents" className="mt-4">
              <Card className="p-5">
                {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents uploaded.</p> :
                  <div className="space-y-2">
                    {docs.map(d => (
                      <div key={d.id} className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{d.file_name}</span>
                        <Badge variant="outline" className="text-[10px]">{d.doc_type}</Badge>
                      </div>
                    ))}
                  </div>
                }
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card className="p-5">
                {activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> :
                  <div className="space-y-3">
                    {activity.map(a => (
                      <div key={a.id} className="flex gap-3 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium">{a.title}</p>
                          {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                          <p className="text-[10px] text-muted-foreground mt-0.5"><DateTime value={a.occurred_at} mode="datetime" /></p>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">Guardians</h3>
            {guardians.length === 0 ? <p className="text-xs text-muted-foreground">No guardians linked.</p> :
              <div className="space-y-3">
                {guardians.map((sg: any) => (
                  <div key={sg.id} className="text-sm border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{sg.guardians?.full_name}</p>
                      {sg.is_primary_contact && <Badge className="text-[10px]">Primary</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{sg.relationship}</p>
                    {sg.guardians?.phone_primary && <p className="text-xs flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> {sg.guardians.phone_primary}</p>}
                    {sg.guardians?.email && <p className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> {sg.guardians.email}</p>}
                  </div>
                ))}
              </div>
            }
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3">Key dates</h3>
            <div className="space-y-2 text-sm">
              <Row label="Admitted" value={student.admission_date} />
              <Row label="DOB" value={student.date_of_birth} />
              <Row label="Last checkup" value={student.last_medical_checkup} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}