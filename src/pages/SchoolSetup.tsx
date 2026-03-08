import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ChevronRight, ChevronLeft, BookOpen, GraduationCap,
  DollarSign, Calendar, CheckCircle, Loader2, School, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const countries = [
  "Afghanistan","Albania","Algeria","Angola","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Benin","Bhutan","Bolivia",
  "Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon",
  "Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros",
  "Congo (Brazzaville)","Congo (DRC)","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Djibouti","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea",
  "Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia",
  "Georgia","Germany","Ghana","Greece","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya",
  "Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya",
  "Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Mauritania","Mauritius","Mexico","Moldova","Mongolia","Morocco","Mozambique","Myanmar",
  "Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea",
  "North Macedonia","Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea",
  "Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Rwanda","Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka",
  "Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania",
  "Thailand","Timor-Leste","Togo","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

interface EducationData {
  country: string;
  academic_calendar: {
    school_year_start: string;
    school_year_end: string;
    terms: { name: string; start_month: string; end_month: string }[];
    major_holidays: string[];
  };
  school_levels: { name: string; grades: string; age_range: string; duration_years: number }[];
  grading_system: {
    type: string;
    scale: { grade: string; min_score: number; max_score: number; description: string }[];
    pass_mark: number;
    gpa_scale: string;
  };
  common_subjects: { core: string[]; elective: string[] };
  payment_methods: {
    common: string[];
    digital_platforms: string[];
    currency: string;
    currency_symbol: string;
    fee_structure: string;
  };
  regulatory_body: string;
  language_of_instruction: string;
}

export default function SchoolSetup() {
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [eduData, setEduData] = useState<EducationData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchEducationData = async () => {
    if (!country) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-education-system", {
        body: { country },
      });
      if (error) throw error;
      if (data?.success && data?.data) {
        setEduData(data.data);
        setStep(2);
      } else {
        throw new Error(data?.error || "Failed to fetch education data");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to fetch education system data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!eduData) return;
    setLoading(true);
    try {
      // Create school record
      const { data: school, error: schoolErr } = await supabase.from("schools").insert({
        name: schoolName,
        email: schoolEmail || null,
        phone: schoolPhone || null,
        country: eduData.country,
        language_of_instruction: eduData.language_of_instruction,
        regulatory_body: eduData.regulatory_body,
        academic_year_start: eduData.academic_calendar.school_year_start,
        academic_year_end: eduData.academic_calendar.school_year_end,
        grading_system: eduData.grading_system,
        academic_calendar: eduData.academic_calendar,
        payment_config: eduData.payment_methods,
        subjects: eduData.common_subjects,
        school_levels: eduData.school_levels,
      }).select().single();

      if (schoolErr) throw schoolErr;

      // Link user profile to this school
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ school_id: school.id })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      if (profileErr) throw profileErr;

      toast({ title: "School Setup Complete", description: `${schoolName} has been configured with ${country}'s education system.` });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save school", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: "School Info", icon: School },
    { label: "Country", icon: Globe },
    { label: "Calendar", icon: Calendar },
    { label: "Levels & Grading", icon: GraduationCap },
    { label: "Subjects", icon: BookOpen },
    { label: "Payments", icon: DollarSign },
    { label: "Review", icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">School Setup Wizard</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your school with country-specific education settings</p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === step ? "bg-primary text-primary-foreground" :
              i < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <s.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: School Info */}
        {step === 0 && (
          <motion.div key="school" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <h2 className="text-lg font-semibold text-card-foreground">School Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>School Name *</Label>
                <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Green Valley Academy" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} placeholder="admin@school.edu" type="email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)} placeholder="+1 555-0100" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!schoolName.trim()} className="gap-1.5">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Country Selection */}
        {step === 1 && (
          <motion.div key="country" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Select Your Country</h2>
              <p className="text-sm text-muted-foreground mt-1">We'll automatically configure the education system, academic calendar, grading, and payment methods for your country.</p>
            </div>
            <div className="space-y-2 max-w-sm">
              <Label>Country *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Select a country..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)} className="gap-1.5">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={fetchEducationData} disabled={!country || loading} className="gap-1.5">
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Fetching Education System...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Fetch Education System</>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Academic Calendar */}
        {step === 2 && eduData && (
          <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-card-foreground">Academic Calendar</h2>
              <Badge variant="secondary" className="text-[11px]">{eduData.country}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School Year Starts</Label>
                <Input defaultValue={eduData.academic_calendar.school_year_start} />
              </div>
              <div className="space-y-2">
                <Label>School Year Ends</Label>
                <Input defaultValue={eduData.academic_calendar.school_year_end} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Terms / Semesters</Label>
              <div className="space-y-2">
                {eduData.academic_calendar.terms.map((term, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 text-sm">
                    <span className="font-medium text-card-foreground min-w-[120px]">{term.name}</span>
                    <span className="text-muted-foreground">{term.start_month} → {term.end_month}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Major Holidays</Label>
              <div className="flex flex-wrap gap-2">
                {eduData.academic_calendar.major_holidays.map((h, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(3)} className="gap-1.5">Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: School Levels & Grading */}
        {step === 3 && eduData && (
          <motion.div key="levels" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <h2 className="text-lg font-semibold text-card-foreground">School Levels & Grading System</h2>

            <div>
              <Label className="mb-2 block">School Levels</Label>
              <div className="space-y-2">
                {eduData.school_levels.map((level, i) => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-card-foreground">{level.name}</p>
                      <Badge variant="secondary" className="text-[11px]">{level.duration_years} years</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{level.grades} · Ages {level.age_range}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Grading System</Label>
                <Badge className="text-[11px]">{eduData.grading_system.type}</Badge>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-4 bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  <span>Grade</span><span>Min</span><span>Max</span><span>Description</span>
                </div>
                {eduData.grading_system.scale.map((s, i) => (
                  <div key={i} className="grid grid-cols-4 px-4 py-2 text-sm border-t border-border">
                    <span className="font-medium">{s.grade}</span>
                    <span className="text-muted-foreground">{s.min_score}%</span>
                    <span className="text-muted-foreground">{s.max_score}%</span>
                    <span className="text-muted-foreground">{s.description}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="text-muted-foreground">Pass Mark: <strong className="text-card-foreground">{eduData.grading_system.pass_mark}%</strong></span>
                <span className="text-muted-foreground">GPA Scale: <strong className="text-card-foreground">{eduData.grading_system.gpa_scale}</strong></span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Language of Instruction:</span> {eduData.language_of_instruction} · <span className="font-medium">Regulatory Body:</span> {eduData.regulatory_body}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(4)} className="gap-1.5">Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Subjects */}
        {step === 4 && eduData && (
          <motion.div key="subjects" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <h2 className="text-lg font-semibold text-card-foreground">Subjects</h2>

            <div>
              <Label className="mb-2 block">Core Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {eduData.common_subjects.core.map((s, i) => (
                  <Badge key={i} className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Elective Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {eduData.common_subjects.elective.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(5)} className="gap-1.5">Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Payment Methods */}
        {step === 5 && eduData && (
          <motion.div key="payments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <h2 className="text-lg font-semibold text-card-foreground">Fee & Payment Configuration</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input defaultValue={`${eduData.payment_methods.currency} (${eduData.payment_methods.currency_symbol})`} />
              </div>
              <div className="space-y-2">
                <Label>Fee Structure</Label>
                <Input defaultValue={eduData.payment_methods.fee_structure} className="capitalize" />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Common Payment Methods</Label>
              <div className="space-y-2">
                {eduData.payment_methods.common.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <DollarSign className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {eduData.payment_methods.digital_platforms.length > 0 && (
              <div>
                <Label className="mb-2 block">Digital Payment Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {eduData.payment_methods.digital_platforms.map((p, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(4)} className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(6)} className="gap-1.5">Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        )}

        {/* Step 6: Review */}
        {step === 6 && eduData && (
          <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Review & Confirm</h2>
                <p className="text-sm text-muted-foreground">Everything is set up for {schoolName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "School", value: schoolName },
                { label: "Country", value: eduData.country },
                { label: "Calendar", value: `${eduData.academic_calendar.school_year_start} – ${eduData.academic_calendar.school_year_end}` },
                { label: "Terms", value: `${eduData.academic_calendar.terms.length} terms` },
                { label: "School Levels", value: `${eduData.school_levels.length} levels` },
                { label: "Grading", value: `${eduData.grading_system.type} (pass: ${eduData.grading_system.pass_mark}%)` },
                { label: "Core Subjects", value: `${eduData.common_subjects.core.length} subjects` },
                { label: "Currency", value: `${eduData.payment_methods.currency_symbol} ${eduData.payment_methods.currency}` },
                { label: "Fee Structure", value: eduData.payment_methods.fee_structure },
                { label: "Language", value: eduData.language_of_instruction },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-card-foreground">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(5)} className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={handleComplete} className="gap-1.5">
                <CheckCircle className="h-4 w-4" /> Complete Setup
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
