import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";
import { CountryAwareFields } from "@/components/sis/CountryAwareFields";
import { getStudentGovIdFields } from "@/lib/sis/countryFields";

const STEPS = [
  "Personal", "Government IDs", "Academic History", "Guardians",
  "Medical & SEN", "Class Assignment", "Documents", "Review",
];

interface Guardian {
  full_name: string;
  relationship: string;
  phone_primary: string;
  whatsapp_number: string;
  email: string;
  national_id_number: string;
  occupation: string;
  is_primary_contact: boolean;
  has_pickup_authorization: boolean;
  has_financial_responsibility: boolean;
}

const emptyGuardian: Guardian = {
  full_name: "", relationship: "mother", phone_primary: "", whatsapp_number: "",
  email: "", national_id_number: "", occupation: "",
  is_primary_contact: false, has_pickup_authorization: true, has_financial_responsibility: false,
};

export default function AdmissionWizard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { tenant } = useTenant();
  const tenantId = profile?.tenant_id;
  const country = tenant?.country_code ?? "KE";
  const govFields = getStudentGovIdFields(country);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; grade_level: string | null }>>([]);

  const [personal, setPersonal] = useState({
    first_name: "", middle_name: "", last_name: "", preferred_name: "",
    gender: "male", date_of_birth: "", nationality: country, photo_url: "",
  });
  const [govIds, setGovIds] = useState<Record<string, string>>({});
  const [academic, setAcademic] = useState({
    previous_school: "", admission_grade: "", expected_graduation_year: "",
    learner_category: "day_scholar", house: "", stream: "",
  });
  const [guardians, setGuardians] = useState<Guardian[]>([{ ...emptyGuardian, is_primary_contact: true }]);
  const [medical, setMedical] = useState({
    blood_group: "unknown", allergies: "", chronic_conditions: "", medications: "",
    has_special_needs: false, special_needs_details: "", iep_on_file: false, accommodations: "",
  });
  const [contact, setContact] = useState({
    residential_address: "", city: "", county_or_region: "", postal_code: "",
    emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relation: "",
  });
  const [assignment, setAssignment] = useState({
    current_class_id: "", admission_date: new Date().toISOString().slice(0, 10),
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    supabase.from("classes").select("id, name, grade_level").eq("tenant_id", tenantId).order("name")
      .then(({ data }) => setClasses(data ?? []));
  }, [tenantId]);

  const addGuardian = () => setGuardians([...guardians, { ...emptyGuardian }]);
  const removeGuardian = (i: number) => setGuardians(guardians.filter((_, idx) => idx !== i));
  const updateGuardian = (i: number, patch: Partial<Guardian>) => {
    setGuardians(guardians.map((g, idx) => {
      if (idx !== i) {
        // If toggling primary on another, unset primary elsewhere
        if (patch.is_primary_contact === true) return { ...g, is_primary_contact: false };
        return g;
      }
      return { ...g, ...patch };
    }));
  };

  const canNext = () => {
    if (step === 0) return personal.first_name.trim() && personal.last_name.trim() && personal.date_of_birth;
    if (step === 3) return guardians.length > 0 && guardians.every(g => g.full_name && g.phone_primary) && guardians.some(g => g.is_primary_contact);
    if (step === 5) return assignment.admission_date;
    return true;
  };

  const handleSubmit = async () => {
    if (!tenantId || !user) return;
    setSubmitting(true);
    try {
      // 1. Generate admission number
      const { data: admNoData, error: admNoErr } = await supabase.rpc("generate_admission_number", { _tenant: tenantId });
      if (admNoErr) throw admNoErr;
      const admission_number = admNoData as unknown as string;

      // 2. Insert student
      const studentPayload: any = {
        tenant_id: tenantId,
        admission_number,
        ...personal,
        ...govIds,
        ...academic,
        ...medical,
        ...contact,
        ...assignment,
        country,
        enrollment_status: "active",
        status: "active",
        grade: classes.find(c => c.id === assignment.current_class_id)?.grade_level || academic.admission_grade,
        expected_graduation_year: academic.expected_graduation_year ? Number(academic.expected_graduation_year) : null,
        current_class_id: assignment.current_class_id || null,
      };
      const { data: student, error: studentErr } = await supabase
        .from("students").insert(studentPayload).select().single();
      if (studentErr) throw studentErr;

      // 3. Insert guardians + junction
      for (const g of guardians) {
        const { data: guardian, error: gErr } = await supabase
          .from("guardians").insert({
            tenant_id: tenantId,
            full_name: g.full_name,
            phone_primary: g.phone_primary,
            whatsapp_number: g.whatsapp_number || null,
            email: g.email || null,
            national_id_number: g.national_id_number || null,
            occupation: g.occupation || null,
          }).select().single();
        if (gErr) throw gErr;
        await supabase.from("student_guardians").insert({
          tenant_id: tenantId,
          student_id: student.id,
          guardian_id: guardian.id,
          relationship: g.relationship as any,
          is_primary_contact: g.is_primary_contact,
          has_pickup_authorization: g.has_pickup_authorization,
          has_financial_responsibility: g.has_financial_responsibility,
        });
      }

      // 4. Upload documents
      for (const f of files) {
        const path = `${tenantId}/student/${student.id}/${Date.now()}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, f);
        if (upErr) { console.error(upErr); continue; }
        await supabase.from("documents").insert({
          tenant_id: tenantId, owner_type: "student", owner_id: student.id,
          doc_type: "admission_document", file_url: path, file_name: f.name,
          mime_type: f.type, size_bytes: f.size, uploaded_by: user.id,
        });
      }

      // 5. Activity log
      await supabase.from("student_activity").insert({
        tenant_id: tenantId, student_id: student.id, event_type: "admitted",
        title: "Student admitted", description: `Admission #${admission_number}`,
        actor_user_id: user.id,
      });

      toast({ title: "Student admitted!", description: `Admission # ${admission_number}` });
      navigate(`/students/${student.id}`);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Admission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Admission</h1>
        <p className="text-sm text-muted-foreground mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
      </div>

      {/* Stepper */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 min-w-[60px]">
            <div className={`h-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
            <p className={`text-[10px] mt-1.5 ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</p>
          </div>
        ))}
      </div>

      <Card className="p-6">
        <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>First name *</Label><Input value={personal.first_name} onChange={e => setPersonal({ ...personal, first_name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Middle name</Label><Input value={personal.middle_name} onChange={e => setPersonal({ ...personal, middle_name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Last name *</Label><Input value={personal.last_name} onChange={e => setPersonal({ ...personal, last_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Preferred name</Label><Input value={personal.preferred_name} onChange={e => setPersonal({ ...personal, preferred_name: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={personal.gender} onValueChange={v => setPersonal({ ...personal, gender: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Date of birth *</Label><Input type="date" value={personal.date_of_birth} onChange={e => setPersonal({ ...personal, date_of_birth: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Nationality</Label><Input value={personal.nationality} onChange={e => setPersonal({ ...personal, nationality: e.target.value })} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Showing fields for <Badge variant="outline">{country}</Badge></p>
              <CountryAwareFields fields={govFields} values={govIds} onChange={(k, v) => setGovIds({ ...govIds, [k]: v })} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Previous school</Label><Input value={academic.previous_school} onChange={e => setAcademic({ ...academic, previous_school: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Admission grade</Label><Input value={academic.admission_grade} onChange={e => setAcademic({ ...academic, admission_grade: e.target.value })} placeholder="e.g. Grade 4" /></div>
                <div className="space-y-1.5"><Label>Expected graduation year</Label><Input type="number" value={academic.expected_graduation_year} onChange={e => setAcademic({ ...academic, expected_graduation_year: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label>Learner category</Label>
                  <Select value={academic.learner_category} onValueChange={v => setAcademic({ ...academic, learner_category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day_scholar">Day scholar</SelectItem>
                      <SelectItem value="boarder">Boarder</SelectItem>
                      <SelectItem value="weekly_boarder">Weekly boarder</SelectItem>
                      <SelectItem value="special_needs">Special needs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>House (boarding)</Label><Input value={academic.house} onChange={e => setAcademic({ ...academic, house: e.target.value })} placeholder="e.g. Kenyatta" /></div>
                <div className="space-y-1.5"><Label>Stream</Label><Input value={academic.stream} onChange={e => setAcademic({ ...academic, stream: e.target.value })} placeholder="e.g. East" /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {guardians.map((g, i) => (
                <Card key={i} className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Guardian {i + 1} {g.is_primary_contact && <Badge className="ml-2 text-[10px]">Primary</Badge>}</h3>
                    {guardians.length > 1 && <Button size="icon" variant="ghost" onClick={() => removeGuardian(i)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Full name *</Label><Input value={g.full_name} onChange={e => updateGuardian(i, { full_name: e.target.value })} /></div>
                    <div className="space-y-1.5">
                      <Label>Relationship</Label>
                      <Select value={g.relationship} onValueChange={v => updateGuardian(i, { relationship: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["father","mother","guardian","grandparent","uncle","aunt","sibling","other"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Phone *</Label><Input value={g.phone_primary} onChange={e => updateGuardian(i, { phone_primary: e.target.value })} placeholder="+254712345678" /></div>
                    <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={g.whatsapp_number} onChange={e => updateGuardian(i, { whatsapp_number: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Email</Label><Input value={g.email} onChange={e => updateGuardian(i, { email: e.target.value })} type="email" /></div>
                    <div className="space-y-1.5"><Label>National ID</Label><Input value={g.national_id_number} onChange={e => updateGuardian(i, { national_id_number: e.target.value })} /></div>
                    <div className="space-y-1.5 md:col-span-2"><Label>Occupation</Label><Input value={g.occupation} onChange={e => updateGuardian(i, { occupation: e.target.value })} /></div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t">
                    <label className="flex items-center gap-2 text-xs"><Switch checked={g.is_primary_contact} onCheckedChange={v => updateGuardian(i, { is_primary_contact: v })} /> Primary contact</label>
                    <label className="flex items-center gap-2 text-xs"><Switch checked={g.has_pickup_authorization} onCheckedChange={v => updateGuardian(i, { has_pickup_authorization: v })} /> Pickup authorized</label>
                    <label className="flex items-center gap-2 text-xs"><Switch checked={g.has_financial_responsibility} onCheckedChange={v => updateGuardian(i, { has_financial_responsibility: v })} /> Pays fees</label>
                  </div>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addGuardian} className="gap-2"><Plus className="h-4 w-4" /> Add guardian</Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Blood group</Label>
                  <Select value={medical.blood_group} onValueChange={v => setMedical({ ...medical, blood_group: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["A+","A-","B+","B-","O+","O-","AB+","AB-","unknown"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Allergies</Label><Input value={medical.allergies} onChange={e => setMedical({ ...medical, allergies: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Chronic conditions</Label><Textarea value={medical.chronic_conditions} onChange={e => setMedical({ ...medical, chronic_conditions: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Current medications</Label><Textarea value={medical.medications} onChange={e => setMedical({ ...medical, medications: e.target.value })} /></div>
              <div className="pt-4 border-t space-y-3">
                <label className="flex items-center gap-2 text-sm"><Switch checked={medical.has_special_needs} onCheckedChange={v => setMedical({ ...medical, has_special_needs: v })} /> Has special educational needs</label>
                {medical.has_special_needs && (
                  <>
                    <Textarea placeholder="Special needs details" value={medical.special_needs_details} onChange={e => setMedical({ ...medical, special_needs_details: e.target.value })} />
                    <label className="flex items-center gap-2 text-sm"><Switch checked={medical.iep_on_file} onCheckedChange={v => setMedical({ ...medical, iep_on_file: v })} /> IEP on file</label>
                    <Textarea placeholder="Accommodations" value={medical.accommodations} onChange={e => setMedical({ ...medical, accommodations: e.target.value })} />
                  </>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Class</Label>
                  <Select value={assignment.current_class_id} onValueChange={v => setAssignment({ ...assignment, current_class_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 && <SelectItem value="none" disabled>No classes — create one first</SelectItem>}
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.grade_level ? ` (${c.grade_level})` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Admission date *</Label><Input type="date" value={assignment.admission_date} onChange={e => setAssignment({ ...assignment, admission_date: e.target.value })} /></div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Contact details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2"><Label>Residential address</Label><Input value={contact.residential_address} onChange={e => setContact({ ...contact, residential_address: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>City</Label><Input value={contact.city} onChange={e => setContact({ ...contact, city: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>County / Region</Label><Input value={contact.county_or_region} onChange={e => setContact({ ...contact, county_or_region: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Emergency contact name</Label><Input value={contact.emergency_contact_name} onChange={e => setContact({ ...contact, emergency_contact_name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Emergency contact phone</Label><Input value={contact.emergency_contact_phone} onChange={e => setContact({ ...contact, emergency_contact_phone: e.target.value })} /></div>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-muted/30">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload birth certificate, ID copy, transfer letter, etc.</p>
                <input type="file" multiple className="hidden" onChange={e => setFiles([...files, ...Array.from(e.target.files ?? [])])} />
              </label>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <span className="truncate">{f.name}</span>
                      <Button size="icon" variant="ghost" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3 text-sm">
              <h3 className="font-semibold">Review</h3>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted/30 rounded">
                <span className="text-muted-foreground">Name</span><span>{personal.first_name} {personal.middle_name} {personal.last_name}</span>
                <span className="text-muted-foreground">DOB</span><span>{personal.date_of_birth}</span>
                <span className="text-muted-foreground">Gender</span><span className="capitalize">{personal.gender}</span>
                <span className="text-muted-foreground">Class</span><span>{classes.find(c => c.id === assignment.current_class_id)?.name ?? "—"}</span>
                <span className="text-muted-foreground">Admission date</span><span>{assignment.admission_date}</span>
                <span className="text-muted-foreground">Guardians</span><span>{guardians.length}</span>
                <span className="text-muted-foreground">Documents</span><span>{files.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                On submit, an admission number will be auto-generated using the tenant's format.
              </p>
            </div>
          )}
        </motion.div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => step === 0 ? navigate(-1) : setStep(step - 1)} disabled={submitting}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Admit student
          </Button>
        )}
      </div>
    </div>
  );
}