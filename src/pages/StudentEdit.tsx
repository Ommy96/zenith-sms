import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save, Trash2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { getStudentGovIdFields } from "@/lib/sis/countryFields";
import {
  identitySectionSchema, academicSectionSchema, contactSectionSchema,
  medicalSectionSchema, specialNeedsSectionSchema, governmentIdsSectionSchema,
  guardianLinkSchema,
} from "@/lib/schemas/student";
import type { z } from "zod";

/* ------------------------------ Helpers ------------------------------ */

type AnyObj = Record<string, any>;
type SectionKey =
  | "identity" | "gov" | "academic" | "contact"
  | "medical" | "sne" | "guardians" | "documents";

function pickDefined(obj: AnyObj) {
  const out: AnyObj = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = v === "" ? null : v;
  }
  return out;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-danger-foreground flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" /> {msg}
    </p>
  );
}

function Field({
  label, hint, error, children,
}: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {hint && <span className="text-muted-foreground ml-1 font-normal">({hint})</span>}
      </Label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

/* --------------------------- Page component --------------------------- */

export default function StudentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { tenant, can } = useTenant();
  const country = tenant?.country_code ?? "KE";
  const govFields = useMemo(() => getStudentGovIdFields(country), [country]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<AnyObj | null>(null);
  const [tab, setTab] = useState<SectionKey>("identity");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sectioned form state
  const [identity, setIdentity] = useState<AnyObj>({});
  const [gov, setGov] = useState<AnyObj>({});
  const [academic, setAcademic] = useState<AnyObj>({});
  const [contact, setContact] = useState<AnyObj>({});
  const [medical, setMedical] = useState<AnyObj>({});
  const [sne, setSne] = useState<AnyObj>({});

  // Guardians (junction rows hydrated with guardian record)
  const [guardians, setGuardians] = useState<AnyObj[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; grade_level: string | null }>>([]);

  const canEdit = can("students.edit");

  useEffect(() => {
    if (!canEdit) return;
    let active = true;
    (async () => {
      if (!id || !profile?.tenant_id) return;
      setLoading(true);
      const [{ data: s }, { data: g }, { data: cls }] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("student_guardians")
          .select("*, guardians(*)")
          .eq("student_id", id),
        supabase
          .from("classes")
          .select("id, name, grade_level")
          .eq("tenant_id", profile.tenant_id)
          .order("name"),
      ]);
      if (!active) return;
      if (!s) {
        toast.error("Student not found");
        navigate("/students");
        return;
      }
      setStudent(s);
      hydrate(s);
      setGuardians(
        (g ?? []).map((sg: AnyObj) => ({
          link_id: sg.id,
          guardian_id: sg.guardian_id,
          relationship: sg.relationship,
          is_primary_contact: sg.is_primary_contact,
          has_pickup_authorization: sg.has_pickup_authorization,
          has_financial_responsibility: sg.has_financial_responsibility,
          receives_communications: sg.receives_communications ?? true,
          full_name: sg.guardians?.full_name ?? "",
          phone_primary: sg.guardians?.phone_primary ?? "",
          whatsapp_number: sg.guardians?.whatsapp_number ?? "",
          email: sg.guardians?.email ?? "",
          national_id_number: sg.guardians?.national_id_number ?? "",
          occupation: sg.guardians?.occupation ?? "",
          _dirty: false,
        })),
      );
      setClasses(cls ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id, profile?.tenant_id, canEdit, navigate]);

  function hydrate(s: AnyObj) {
    setIdentity({
      first_name: s.first_name ?? "",
      middle_name: s.middle_name ?? "",
      last_name: s.last_name ?? "",
      preferred_name: s.preferred_name ?? "",
      gender: s.gender ?? undefined,
      date_of_birth: s.date_of_birth ?? "",
      nationality: s.nationality ?? "",
      photo_url: s.photo_url ?? "",
    });
    setAcademic({
      admission_number: s.admission_number ?? "",
      admission_date: s.admission_date ?? "",
      admission_grade: s.admission_grade ?? "",
      expected_graduation_year: s.expected_graduation_year ?? "",
      current_class_id: s.current_class_id ?? "",
      stream: s.stream ?? "",
      house: s.house ?? "",
      learner_category: s.learner_category ?? undefined,
      previous_school: s.previous_school ?? "",
      is_repeater: !!s.is_repeater,
      enrollment_status: s.enrollment_status ?? "active",
    });
    setContact({
      email: s.email ?? "",
      phone: s.phone ?? "",
      residential_address: s.residential_address ?? "",
      city: s.city ?? "",
      county_or_region: s.county_or_region ?? "",
      postal_code: s.postal_code ?? "",
      emergency_contact_name: s.emergency_contact_name ?? "",
      emergency_contact_phone: s.emergency_contact_phone ?? "",
      emergency_contact_relation: s.emergency_contact_relation ?? "",
    });
    setMedical({
      blood_group: s.blood_group ?? "unknown",
      allergies: s.allergies ?? "",
      chronic_conditions: s.chronic_conditions ?? "",
      medications: s.medications ?? "",
      doctor_name: s.doctor_name ?? "",
      doctor_phone: s.doctor_phone ?? "",
      insurance_provider: s.insurance_provider ?? "",
      insurance_policy_number: s.insurance_policy_number ?? "",
      nhif_or_shif_number: s.nhif_or_shif_number ?? "",
      last_medical_checkup: s.last_medical_checkup ?? "",
    });
    setSne({
      has_special_needs: !!s.has_special_needs,
      sne_category: s.sne_category ?? "",
      special_needs_details: s.special_needs_details ?? "",
      iep_on_file: !!s.iep_on_file,
      accommodations: s.accommodations ?? "",
    });
    const govInit: AnyObj = {};
    for (const f of getStudentGovIdFields(country)) govInit[f.key] = s[f.key] ?? "";
    setGov(govInit);
  }

  function applyZod(
    schema: z.ZodTypeAny, value: AnyObj, prefix = "",
  ): { ok: boolean; data?: AnyObj; nextErrors: Record<string, string> } {
    const r = schema.safeParse(value);
    const ne: Record<string, string> = {};
    if (!r.success) {
      for (const issue of r.error.issues) {
        const k = (prefix ? prefix + "." : "") + issue.path.join(".");
        if (!ne[k]) ne[k] = issue.message;
      }
      return { ok: false, nextErrors: ne };
    }
    return { ok: true, data: r.data as AnyObj, nextErrors: ne };
  }

  async function saveAll() {
    if (!student) return;
    setSaving(true);
    setErrors({});
    const all: Record<string, string> = {};

    const merged: AnyObj = {};
    for (const [sch, val, prefix] of [
      [identitySectionSchema, identity, "identity"],
      [academicSectionSchema, academic, "academic"],
      [contactSectionSchema, contact, "contact"],
      [medicalSectionSchema, medical, "medical"],
      [specialNeedsSectionSchema, sne, "sne"],
      [governmentIdsSectionSchema, gov, "gov"],
    ] as const) {
      const r = applyZod(sch, val, prefix);
      if (!r.ok) Object.assign(all, r.nextErrors);
      else Object.assign(merged, r.data);
    }

    // Guardians: validate each
    const guardianClean: AnyObj[] = [];
    let primaryCount = 0;
    guardians.forEach((g, i) => {
      const r = guardianLinkSchema.safeParse(g);
      if (!r.success) {
        for (const issue of r.error.issues) {
          all[`guardians.${i}.${issue.path.join(".")}`] = issue.message;
        }
      } else {
        guardianClean.push({ ...g, ...r.data });
        if (r.data.is_primary_contact) primaryCount++;
      }
    });
    if (guardians.length > 0 && primaryCount === 0) {
      all["guardians.primary"] = "At least one guardian must be primary contact";
    }

    if (Object.keys(all).length > 0) {
      setErrors(all);
      setSaving(false);
      toast.error("Please fix the highlighted fields", {
        description: `${Object.keys(all).length} validation issue(s)`,
      });
      // jump to first failing tab
      const firstKey = Object.keys(all)[0];
      const map: Record<string, SectionKey> = {
        identity: "identity", academic: "academic", contact: "contact",
        medical: "medical", sne: "sne", gov: "gov", guardians: "guardians",
      };
      const section = firstKey.split(".")[0];
      if (map[section]) setTab(map[section]);
      return;
    }

    // Persist student row
    const payload = pickDefined(merged);
    // current_class_id requires explicit null when cleared
    if (academic.current_class_id === "") payload.current_class_id = null;
    const { error: upErr } = await supabase
      .from("students").update(payload).eq("id", student.id);
    if (upErr) {
      setSaving(false);
      toast.error("Save failed", { description: upErr.message });
      return;
    }

    // Persist guardian changes (only dirty rows)
    for (const g of guardianClean) {
      if (!g._dirty && g.link_id) continue;
      let guardianId = g.guardian_id;
      const guardianPayload = pickDefined({
        full_name: g.full_name,
        phone_primary: g.phone_primary,
        whatsapp_number: g.whatsapp_number,
        email: g.email,
        national_id_number: g.national_id_number,
        occupation: g.occupation,
      });
      if (guardianId) {
        await supabase.from("guardians").update(guardianPayload).eq("id", guardianId);
      } else {
        const { data: ng, error: gErr } = await supabase
          .from("guardians")
          .insert({
            tenant_id: student.tenant_id as string,
            full_name: g.full_name as string,
            ...guardianPayload,
          } as any)
          .select().single();
        if (gErr) { toast.error("Guardian add failed", { description: gErr.message }); continue; }
        guardianId = ng.id;
      }
      const linkPayload = {
        relationship: g.relationship,
        is_primary_contact: g.is_primary_contact,
        has_pickup_authorization: g.has_pickup_authorization,
        has_financial_responsibility: g.has_financial_responsibility,
        receives_communications: g.receives_communications,
      };
      if (g.link_id) {
        await supabase.from("student_guardians").update(linkPayload).eq("id", g.link_id);
      } else {
        await supabase.from("student_guardians").insert({
          tenant_id: student.tenant_id,
          student_id: student.id,
          guardian_id: guardianId,
          ...linkPayload,
        });
      }
    }

    setSaving(false);
    toast.success("Student updated");
    navigate(`/students/${student.id}`);
  }

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-lg font-semibold">You don't have permission to edit students.</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/students/${id}`)}>
          Back to profile
        </Button>
      </div>
    );
  }

  if (loading || !student) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const err = (k: string) => errors[k];

  /* --------------------------- Guardian helpers --------------------------- */

  const updateGuardian = (idx: number, patch: AnyObj) => {
    setGuardians((prev) =>
      prev.map((g, i) => {
        // primary contact is exclusive
        if (patch.is_primary_contact === true && i !== idx) {
          return { ...g, is_primary_contact: false, _dirty: true };
        }
        if (i !== idx) return g;
        return { ...g, ...patch, _dirty: true };
      }),
    );
  };
  const addGuardian = () => setGuardians((p) => [
    ...p,
    {
      full_name: "", relationship: "guardian", phone_primary: "", whatsapp_number: "",
      email: "", national_id_number: "", occupation: "",
      is_primary_contact: p.length === 0, has_pickup_authorization: true,
      has_financial_responsibility: false, receives_communications: true, _dirty: true,
    },
  ]);
  const removeGuardian = async (idx: number) => {
    const g = guardians[idx];
    if (g.link_id) {
      const { error } = await supabase
        .from("student_guardians").delete().eq("id", g.link_id);
      if (error) { toast.error("Could not unlink", { description: error.message }); return; }
      toast.success("Guardian unlinked");
    }
    setGuardians((p) => p.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate(`/students/${student.id}`)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
      </button>

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit {student.first_name} {student.last_name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Admission #{student.admission_number} · {country} fields shown
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as SectionKey)}>
        <div className="border-b border-border">
          <TabsList className="bg-transparent h-auto p-0 gap-1 flex-wrap">
            {[
              ["identity", "Identity"],
              ["gov", "Government IDs"],
              ["academic", "Academic"],
              ["contact", "Contact"],
              ["medical", "Medical"],
              ["sne", "Special needs"],
              ["guardians", `Guardians (${guardians.length})`],
              ["documents", "Documents"],
            ].map(([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground px-4 py-3 text-sm font-medium"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* IDENTITY */}
        <TabsContent value="identity" className="mt-6">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="First name *" error={err("identity.first_name")}>
                <Input value={identity.first_name} onChange={(e) => setIdentity({ ...identity, first_name: e.target.value })} />
              </Field>
              <Field label="Middle name" error={err("identity.middle_name")}>
                <Input value={identity.middle_name} onChange={(e) => setIdentity({ ...identity, middle_name: e.target.value })} />
              </Field>
              <Field label="Last name *" error={err("identity.last_name")}>
                <Input value={identity.last_name} onChange={(e) => setIdentity({ ...identity, last_name: e.target.value })} />
              </Field>
              <Field label="Preferred name">
                <Input value={identity.preferred_name} onChange={(e) => setIdentity({ ...identity, preferred_name: e.target.value })} />
              </Field>
              <Field label="Gender">
                <Select value={identity.gender ?? ""} onValueChange={(v) => setIdentity({ ...identity, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of birth" error={err("identity.date_of_birth")}>
                <Input type="date" value={identity.date_of_birth} onChange={(e) => setIdentity({ ...identity, date_of_birth: e.target.value })} />
              </Field>
              <Field label="Nationality">
                <Input value={identity.nationality} onChange={(e) => setIdentity({ ...identity, nationality: e.target.value })} />
              </Field>
              <Field label="Photo URL" hint="< 2MB if uploading">
                <Input value={identity.photo_url} onChange={(e) => setIdentity({ ...identity, photo_url: e.target.value })} placeholder="https://…" />
              </Field>
            </div>
          </Card>
        </TabsContent>

        {/* GOVERNMENT IDs */}
        <TabsContent value="gov" className="mt-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{country}</Badge>
              <p className="text-xs text-muted-foreground">
                Fields for tenant country. Change country in school settings to see other regions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {govFields.map((f) => (
                <Field key={f.key} label={f.label} hint={f.hint} error={err(`gov.${f.key}`)}>
                  <Input
                    value={gov[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setGov({ ...gov, [f.key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ACADEMIC */}
        <TabsContent value="academic" className="mt-6">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Admission number *" error={err("academic.admission_number")}>
                <Input value={academic.admission_number} onChange={(e) => setAcademic({ ...academic, admission_number: e.target.value })} className="tabular-nums" />
              </Field>
              <Field label="Admission date">
                <Input type="date" value={academic.admission_date} onChange={(e) => setAcademic({ ...academic, admission_date: e.target.value })} />
              </Field>
              <Field label="Admission grade">
                <Input value={academic.admission_grade} onChange={(e) => setAcademic({ ...academic, admission_grade: e.target.value })} placeholder="e.g. Grade 4" />
              </Field>
              <Field label="Expected graduation year" error={err("academic.expected_graduation_year")}>
                <Input type="number" value={academic.expected_graduation_year} onChange={(e) => setAcademic({ ...academic, expected_graduation_year: e.target.value })} />
              </Field>
              <Field label="Current class">
                <Select value={academic.current_class_id || "_none"} onValueChange={(v) => setAcademic({ ...academic, current_class_id: v === "_none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Unassigned</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}{c.grade_level ? ` (${c.grade_level})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Stream">
                <Input value={academic.stream} onChange={(e) => setAcademic({ ...academic, stream: e.target.value })} />
              </Field>
              <Field label="House">
                <Input value={academic.house} onChange={(e) => setAcademic({ ...academic, house: e.target.value })} />
              </Field>
              <Field label="Learner category">
                <Select value={academic.learner_category ?? ""} onValueChange={(v) => setAcademic({ ...academic, learner_category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day_scholar">Day scholar</SelectItem>
                    <SelectItem value="boarder">Boarder</SelectItem>
                    <SelectItem value="weekly_boarder">Weekly boarder</SelectItem>
                    <SelectItem value="special_needs">Special needs</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Previous school">
                <Input value={academic.previous_school} onChange={(e) => setAcademic({ ...academic, previous_school: e.target.value })} />
              </Field>
              <Field label="Enrollment status">
                <Select value={academic.enrollment_status} onValueChange={(v) => setAcademic({ ...academic, enrollment_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="expelled">Expelled</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm pt-2 border-t border-border">
              <Switch checked={!!academic.is_repeater} onCheckedChange={(v) => setAcademic({ ...academic, is_repeater: v })} />
              Repeating current grade
            </label>
          </Card>
        </TabsContent>

        {/* CONTACT */}
        <TabsContent value="contact" className="mt-6">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Email" error={err("contact.email")}>
                <Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              </Field>
              <Field label="Phone" error={err("contact.phone")}>
                <Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+254712345678" />
              </Field>
              <Field label="Residential address">
                <Textarea rows={2} value={contact.residential_address} onChange={(e) => setContact({ ...contact, residential_address: e.target.value })} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="City">
                  <Input value={contact.city} onChange={(e) => setContact({ ...contact, city: e.target.value })} />
                </Field>
                <Field label="County / Region">
                  <Input value={contact.county_or_region} onChange={(e) => setContact({ ...contact, county_or_region: e.target.value })} />
                </Field>
                <Field label="Postal code">
                  <Input value={contact.postal_code} onChange={(e) => setContact({ ...contact, postal_code: e.target.value })} />
                </Field>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Emergency contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Name">
                  <Input value={contact.emergency_contact_name} onChange={(e) => setContact({ ...contact, emergency_contact_name: e.target.value })} />
                </Field>
                <Field label="Phone" error={err("contact.emergency_contact_phone")}>
                  <Input value={contact.emergency_contact_phone} onChange={(e) => setContact({ ...contact, emergency_contact_phone: e.target.value })} placeholder="+254…" />
                </Field>
                <Field label="Relation">
                  <Input value={contact.emergency_contact_relation} onChange={(e) => setContact({ ...contact, emergency_contact_relation: e.target.value })} />
                </Field>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* MEDICAL */}
        <TabsContent value="medical" className="mt-6">
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Blood group">
                <Select value={medical.blood_group ?? "unknown"} onValueChange={(v) => setMedical({ ...medical, blood_group: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["A+","A-","B+","B-","O+","O-","AB+","AB-","unknown"].map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Allergies">
                <Input value={medical.allergies} onChange={(e) => setMedical({ ...medical, allergies: e.target.value })} placeholder="comma-separated" />
              </Field>
              <Field label="Chronic conditions">
                <Textarea rows={2} value={medical.chronic_conditions} onChange={(e) => setMedical({ ...medical, chronic_conditions: e.target.value })} />
              </Field>
              <Field label="Current medications">
                <Textarea rows={2} value={medical.medications} onChange={(e) => setMedical({ ...medical, medications: e.target.value })} />
              </Field>
              <Field label="Doctor name">
                <Input value={medical.doctor_name} onChange={(e) => setMedical({ ...medical, doctor_name: e.target.value })} />
              </Field>
              <Field label="Doctor phone" error={err("medical.doctor_phone")}>
                <Input value={medical.doctor_phone} onChange={(e) => setMedical({ ...medical, doctor_phone: e.target.value })} />
              </Field>
              <Field label="Insurance provider">
                <Input value={medical.insurance_provider} onChange={(e) => setMedical({ ...medical, insurance_provider: e.target.value })} />
              </Field>
              <Field label="Insurance policy #">
                <Input value={medical.insurance_policy_number} onChange={(e) => setMedical({ ...medical, insurance_policy_number: e.target.value })} />
              </Field>
              <Field label="NHIF / SHIF number">
                <Input value={medical.nhif_or_shif_number} onChange={(e) => setMedical({ ...medical, nhif_or_shif_number: e.target.value })} />
              </Field>
              <Field label="Last medical checkup">
                <Input type="date" value={medical.last_medical_checkup} onChange={(e) => setMedical({ ...medical, last_medical_checkup: e.target.value })} />
              </Field>
            </div>
          </Card>
        </TabsContent>

        {/* SPECIAL NEEDS */}
        <TabsContent value="sne" className="mt-6">
          <Card className="p-6 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!sne.has_special_needs} onCheckedChange={(v) => setSne({ ...sne, has_special_needs: v })} />
              Has special educational needs
            </label>
            {sne.has_special_needs && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="SEN category">
                  <Input value={sne.sne_category} onChange={(e) => setSne({ ...sne, sne_category: e.target.value })} />
                </Field>
                <label className="flex items-end gap-2 text-sm">
                  <Switch checked={!!sne.iep_on_file} onCheckedChange={(v) => setSne({ ...sne, iep_on_file: v })} />
                  IEP on file
                </label>
                <Field label="Details">
                  <Textarea rows={3} value={sne.special_needs_details} onChange={(e) => setSne({ ...sne, special_needs_details: e.target.value })} />
                </Field>
                <Field label="Accommodations">
                  <Textarea rows={3} value={sne.accommodations} onChange={(e) => setSne({ ...sne, accommodations: e.target.value })} />
                </Field>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* GUARDIANS */}
        <TabsContent value="guardians" className="mt-6 space-y-4">
          {errors["guardians.primary"] && (
            <p className="text-xs text-danger-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors["guardians.primary"]}
            </p>
          )}
          {guardians.length === 0 && (
            <Card className="p-8 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No guardians linked yet.</p>
              <Button variant="outline" onClick={addGuardian} className="gap-1.5"><Plus className="h-4 w-4" /> Add guardian</Button>
            </Card>
          )}
          {guardians.map((g, i) => (
            <Card key={g.link_id ?? `new-${i}`} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">Guardian {i + 1}</h3>
                  {g.is_primary_contact && <Badge>Primary</Badge>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeGuardian(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full name *" error={err(`guardians.${i}.full_name`)}>
                  <Input value={g.full_name} onChange={(e) => updateGuardian(i, { full_name: e.target.value })} />
                </Field>
                <Field label="Relationship">
                  <Select value={g.relationship} onValueChange={(v) => updateGuardian(i, { relationship: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["father","mother","guardian","grandparent","uncle","aunt","sibling","other"].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Phone" error={err(`guardians.${i}.phone_primary`)}>
                  <Input value={g.phone_primary} onChange={(e) => updateGuardian(i, { phone_primary: e.target.value })} placeholder="+254712345678" />
                </Field>
                <Field label="WhatsApp" error={err(`guardians.${i}.whatsapp_number`)}>
                  <Input value={g.whatsapp_number} onChange={(e) => updateGuardian(i, { whatsapp_number: e.target.value })} />
                </Field>
                <Field label="Email" error={err(`guardians.${i}.email`)}>
                  <Input type="email" value={g.email} onChange={(e) => updateGuardian(i, { email: e.target.value })} />
                </Field>
                <Field label="National ID">
                  <Input value={g.national_id_number} onChange={(e) => updateGuardian(i, { national_id_number: e.target.value })} />
                </Field>
                <Field label="Occupation">
                  <Input value={g.occupation} onChange={(e) => updateGuardian(i, { occupation: e.target.value })} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
                <label className="flex items-center gap-2 text-xs"><Switch checked={!!g.is_primary_contact} onCheckedChange={(v) => updateGuardian(i, { is_primary_contact: v })} /> Primary contact</label>
                <label className="flex items-center gap-2 text-xs"><Switch checked={!!g.has_pickup_authorization} onCheckedChange={(v) => updateGuardian(i, { has_pickup_authorization: v })} /> Pickup authorized</label>
                <label className="flex items-center gap-2 text-xs"><Switch checked={!!g.has_financial_responsibility} onCheckedChange={(v) => updateGuardian(i, { has_financial_responsibility: v })} /> Pays fees</label>
                <label className="flex items-center gap-2 text-xs"><Switch checked={!!g.receives_communications} onCheckedChange={(v) => updateGuardian(i, { receives_communications: v })} /> Receives messages</label>
              </div>
            </Card>
          ))}
          {guardians.length > 0 && (
            <Button variant="outline" onClick={addGuardian} className="gap-1.5"><Plus className="h-4 w-4" /> Add guardian</Button>
          )}
        </TabsContent>

        {/* DOCUMENTS — pointer to dedicated tab on profile */}
        <TabsContent value="documents" className="mt-6">
          <Card className="p-6 space-y-3">
            <p className="text-sm">
              Document uploads are managed on the profile's <strong>Docs</strong> tab.
            </p>
            <Button variant="outline" onClick={() => navigate(`/students/${student.id}?tab=documents`)}>
              Open Docs tab
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-end gap-2 z-30">
        <Button variant="ghost" onClick={() => navigate(`/students/${student.id}`)} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={saveAll} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}