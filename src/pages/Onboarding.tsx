import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Loader2, Rocket,
  School, Calendar, BookOpen, Users, GraduationCap, DollarSign, MessageSquare,
  Upload, ArrowRight, SkipForward,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { useSetupChecklist } from "@/hooks/useSetupChecklist";

const STEPS = [
  { id: 1, key: "identity", label: "School identity", icon: School },
  { id: 2, key: "academic", label: "Academic year", icon: Calendar },
  { id: 3, key: "classes", label: "Classes & subjects", icon: BookOpen },
  { id: 4, key: "staff", label: "Staff", icon: Users },
  { id: 5, key: "students", label: "Students", icon: GraduationCap },
  { id: 6, key: "fees", label: "Fees", icon: DollarSign },
  { id: 7, key: "comms", label: "Communications", icon: MessageSquare },
];

export default function Onboarding() {
  const { tenant, refresh } = useTenant();
  const { tasks, refresh: refreshChecklist } = useSetupChecklist();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const initial = parseInt(params.get("step") || "1", 10);
  const [step, setStep] = useState(Math.min(Math.max(initial, 1), 7));
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [identity, setIdentity] = useState({
    name: tenant?.name ?? "", motto: "", address: "",
    country: tenant?.country_code ?? "KE",
    curriculum: tenant?.curriculum ?? "cbc",
    school_type: tenant?.school_type ?? "primary",
  });
  useEffect(() => {
    if (tenant) setIdentity((s) => ({
      ...s, name: tenant.name, country: tenant.country_code, curriculum: tenant.curriculum || s.curriculum,
      school_type: tenant.school_type || s.school_type,
    }));
  }, [tenant]);

  const goto = (n: number) => {
    const clamped = Math.min(Math.max(n, 1), 7);
    setStep(clamped);
    setParams({ step: String(clamped) });
  };

  const saveIdentity = async () => {
    if (!tenant?.id) return;
    setSaving(true);
    const { error } = await supabase.from("tenants").update({
      name: identity.name,
      country_code: identity.country,
      curriculum: identity.curriculum as any,
      school_type: identity.school_type as any,
    }).eq("id", tenant.id);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    await refresh();
    await refreshChecklist();
    toast({ title: "School identity saved" });
    goto(2);
  };

  const finish = async () => {
    toast({ title: "Setup complete!", description: "Welcome to Zenith." });
    navigate("/");
  };

  const taskDone = (key: string) => tasks.find((t) => t.id === key)?.done ?? false;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h1 className="font-semibold">Setup wizard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Exit</Button>
        </div>
        <div className="max-w-4xl mx-auto px-6 pb-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Step {step} of 7 — {STEPS[step - 1].label}</span>
            <span>{Math.round((step / 7) * 100)}%</span>
          </div>
          <Progress value={(step / 7) * 100} className="h-1.5" />
          <div className="hidden md:flex items-center justify-between mt-4">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const done = taskDone(s.key);
              const current = s.id === step;
              return (
                <button
                  key={s.id}
                  onClick={() => goto(s.id)}
                  className={`flex flex-col items-center gap-1 text-[10px] ${current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${current ? "bg-primary text-primary-foreground" : done ? "bg-primary/15 text-primary" : "bg-secondary"}`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-8">
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold">School identity</h2>
                    <p className="text-sm text-muted-foreground mt-1">The basics. Logo can be uploaded later in Settings.</p>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name">School name</Label>
                      <Input id="name" value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="motto">Motto (optional)</Label>
                      <Input id="motto" value={identity.motto} onChange={(e) => setIdentity({ ...identity, motto: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" value={identity.country} onChange={(e) => setIdentity({ ...identity, country: e.target.value.toUpperCase() })} maxLength={2} />
                      </div>
                      <div>
                        <Label htmlFor="curriculum">Curriculum</Label>
                        <Input id="curriculum" value={identity.curriculum} onChange={(e) => setIdentity({ ...identity, curriculum: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="type">School type</Label>
                      <Input id="type" value={identity.school_type} onChange={(e) => setIdentity({ ...identity, school_type: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => navigate("/setup")}>
                      Use AI auto-setup
                    </Button>
                    <Button onClick={saveIdentity} disabled={saving || !identity.name}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save & continue
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <StepPlaceholder
                  title="Academic structure"
                  desc="Confirm your current academic year, term and grade levels. We'll preload defaults from your country's school calendar."
                  primaryCta="Go to Academics"
                  primaryRoute="/academics"
                  done={taskDone("academic")}
                />
              )}

              {step === 3 && (
                <StepPlaceholder
                  title="Classes & subjects"
                  desc="Add classes (e.g. Grade 5A) or import them from a CSV. Subjects per grade level are preset for your curriculum and editable."
                  primaryCta="Manage classes"
                  primaryRoute="/academics"
                  done={taskDone("classes")}
                />
              )}

              {step === 4 && (
                <StepPlaceholder
                  title="Add staff"
                  desc="Add at least one teacher and assign them as a class teacher. Bulk import via Excel with AI column mapping is supported."
                  primaryCta="Add staff"
                  primaryRoute="/staff"
                  done={taskDone("staff")}
                />
              )}

              {step === 5 && (
                <StepPlaceholder
                  title="Add students"
                  desc="Import students from Excel with AI column mapping, add them one-by-one, or skip — demo data stays visible until you do."
                  primaryCta="Import students"
                  primaryRoute="/students/import"
                  secondaryCta="Add manually"
                  secondaryRoute="/admissions/new"
                  done={taskDone("students")}
                />
              )}

              {step === 6 && (
                <StepPlaceholder
                  title="Fees"
                  desc="Set up at least one fee structure. Optionally connect M-Pesa Paybill for automated collections."
                  primaryCta="Set up fees"
                  primaryRoute="/fees"
                  secondaryCta="Connect M-Pesa"
                  secondaryRoute="/finance/mobile-money"
                  done={taskDone("fees")}
                />
              )}

              {step === 7 && (
                <StepPlaceholder
                  title="Communications"
                  desc="Connect an SMS provider (Africa's Talking) or WhatsApp Business. Send a test message to confirm it works."
                  primaryCta="WhatsApp setup"
                  primaryRoute="/communication/whatsapp"
                  secondaryCta="Messaging settings"
                  secondaryRoute="/messaging"
                  done={taskDone("comms")}
                />
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer nav */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={() => goto(step - 1)} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button variant="ghost" onClick={() => (step < 7 ? goto(step + 1) : finish())} className="gap-1">
            {step < 7 ? <>Skip <SkipForward className="h-4 w-4" /></> : <>Finish <CheckCircle2 className="h-4 w-4" /></>}
          </Button>
          {step < 7 ? (
            <Button onClick={() => goto(step + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button onClick={finish}>Go to dashboard <ArrowRight className="h-4 w-4 ml-1" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepPlaceholder({
  title, desc, primaryCta, primaryRoute, secondaryCta, secondaryRoute, done,
}: {
  title: string; desc: string;
  primaryCta: string; primaryRoute: string;
  secondaryCta?: string; secondaryRoute?: string;
  done: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{desc}</p>
        </div>
        {done && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate(primaryRoute)} className="gap-1.5">
          <Upload className="h-4 w-4" /> {primaryCta}
        </Button>
        {secondaryCta && secondaryRoute && (
          <Button variant="outline" onClick={() => navigate(secondaryRoute)}>{secondaryCta}</Button>
        )}
      </div>
    </div>
  );
}