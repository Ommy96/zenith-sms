import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CalendarDays, CheckCircle2, Circle, GraduationCap, Layers, Loader2, School, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { recomputeSetupProgress } from "@/hooks/useSetupProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useZodForm, ZodForm, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/forms/Form";

const STEPS = [
  { id: 1, label: "School details", icon: School },
  { id: 2, label: "Academic year", icon: CalendarDays },
  { id: 3, label: "Terms", icon: Layers },
  { id: 4, label: "Grade levels", icon: GraduationCap },
];

const YEAR = new Date().getFullYear();

const CBC_GRADES = [
  { code: "PP1", name: "PP1", stage: "pre_primary", sort_order: 10 },
  { code: "PP2", name: "PP2", stage: "pre_primary", sort_order: 20 },
  { code: "G1", name: "Grade 1", stage: "lower_primary", sort_order: 30 },
  { code: "G2", name: "Grade 2", stage: "lower_primary", sort_order: 40 },
  { code: "G3", name: "Grade 3", stage: "lower_primary", sort_order: 50 },
  { code: "G4", name: "Grade 4", stage: "upper_primary", sort_order: 60 },
  { code: "G5", name: "Grade 5", stage: "upper_primary", sort_order: 70 },
  { code: "G6", name: "Grade 6", stage: "upper_primary", sort_order: 80 },
  { code: "G7", name: "Grade 7", stage: "junior_secondary", sort_order: 90 },
  { code: "G8", name: "Grade 8", stage: "junior_secondary", sort_order: 100 },
  { code: "G9", name: "Grade 9", stage: "junior_secondary", sort_order: 110 },
];

const DEFAULT_TERMS = [
  { term_number: 1, name: "Term 1", start_date: `${YEAR}-01-06`, end_date: `${YEAR}-04-04` },
  { term_number: 2, name: "Term 2", start_date: `${YEAR}-05-05`, end_date: `${YEAR}-08-08` },
  { term_number: 3, name: "Term 3", start_date: `${YEAR}-09-01`, end_date: `${YEAR}-11-30` },
];

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">{children}</p>;
}

export default function SetupWizard() {
  const { tenant, refresh } = useTenant();
  const tenantId = tenant?.id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const stepKey = `zenith.setup_step.${tenantId ?? "none"}`;
  const [step, setStep] = useState(1);

  useEffect(() => {
    const saved = Number(localStorage.getItem(stepKey));
    if (saved >= 1 && saved <= 4) setStep(saved);
  }, [stepKey]);

  const goto = (n: number) => {
    const clamped = Math.min(Math.max(n, 1), 4);
    setStep(clamped);
    localStorage.setItem(stepKey, String(clamped));
  };

  const years = useQuery({
    queryKey: [tenantId, "academic_years"],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years").select("*").eq("tenant_id", tenantId).order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const currentYear = years.data?.find((y) => y.is_current) ?? years.data?.[0] ?? null;

  const terms = useQuery({
    queryKey: [tenantId, "terms", currentYear?.id],
    enabled: !!tenantId && !!currentYear?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("terms").select("*").eq("tenant_id", tenantId).eq("academic_year_id", currentYear.id)
        .order("term_number", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const grades = useQuery({
    queryKey: [tenantId, "grade_levels"],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grade_levels").select("*").eq("tenant_id", tenantId).order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const completed: Record<number, boolean> = {
    1: !!tenant?.name,
    2: (years.data?.length ?? 0) > 0,
    3: (terms.data?.length ?? 0) > 0,
    4: (grades.data?.length ?? 0) > 0,
  };

  /* ---------- Step 1 ---------- */
  const detailsSchema = z.object({
    name: z.string().trim().min(2, "Enter the school name").max(120),
    address: z.string().trim().max(255).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  });
  const detailsForm = useZodForm(detailsSchema, {
    defaultValues: { name: "", address: "", phone: "", email: "" },
  });
  useEffect(() => {
    if (tenant) {
      detailsForm.reset({
        name: tenant.name ?? "", address: tenant.address ?? "", phone: tenant.phone ?? "", email: tenant.email ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id]);

  const saveDetails = useMutation({
    mutationFn: async (values: z.infer<typeof detailsSchema>) => {
      const { error } = await supabase.from("tenants").update({
        name: values.name.trim(),
        address: values.address?.trim() || null,
        phone: values.phone?.trim() || null,
        email: values.email?.trim() || null,
      }).eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      toast.success("School details saved", { duration: 3000 });
      goto(2);
    },
    onError: (e: any) => toast.error("Couldn't save", { description: e.message }),
  });

  /** Setup progress is recomputed by database triggers — just refresh the cached copy. */
  const refreshProgress = () => qc.invalidateQueries({ queryKey: [tenantId, "setup_progress"] });

  /* ---------- Step 2 ---------- */
  const yearSchema = z.object({
    name: z.string().trim().min(2, "Give the year a name").max(40),
    start_date: z.string().min(1, "Pick a start date"),
    end_date: z.string().min(1, "Pick an end date"),
    is_current: z.boolean(),
  }).refine((v) => v.end_date > v.start_date, { message: "End date must be after the start date", path: ["end_date"] });

  const yearForm = useZodForm(yearSchema, {
    defaultValues: { name: String(YEAR), start_date: `${YEAR}-01-06`, end_date: `${YEAR}-11-30`, is_current: true },
  });

  const saveYear = useMutation({
    mutationFn: async (values: z.infer<typeof yearSchema>) => {
      const { error } = await supabase.from("academic_years").insert({
        tenant_id: tenantId,
        name: values.name.trim(),
        start_date: values.start_date,
        end_date: values.end_date,
        is_current: values.is_current,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [tenantId, "academic_years"] });
      toast.success("Academic year created", { duration: 3000 });
      goto(3);
    },
    onError: (e: any) => toast.error("Couldn't create the academic year", { description: e.message }),
  });

  /* ---------- Step 3 ---------- */
  const [selectedTerms, setSelectedTerms] = useState<number[]>([1, 2, 3]);
  const [currentTermNo, setCurrentTermNo] = useState(1);

  const saveTerms = useMutation({
    mutationFn: async () => {
      if (!currentYear?.id) throw new Error("Create an academic year first");
      const existing = new Set((terms.data ?? []).map((t) => t.term_number));
      const rows = DEFAULT_TERMS
        .filter((t) => selectedTerms.includes(t.term_number) && !existing.has(t.term_number))
        .map((t) => ({
          tenant_id: tenantId,
          academic_year_id: currentYear.id,
          name: t.name,
          term_number: t.term_number,
          start_date: t.start_date,
          end_date: t.end_date,
          is_current: t.term_number === currentTermNo,
        }));
      if (!rows.length) throw new Error("Those terms already exist");
      const { error } = await supabase.from("terms").insert(rows);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [tenantId, "terms"] });
      toast.success("Terms created", { duration: 3000 });
      goto(4);
    },
    onError: (e: any) => toast.error("Couldn't create the terms", { description: e.message }),
  });

  /* ---------- Step 4 ---------- */
  const seedGrades = useMutation({
    mutationFn: async () => {
      const existing = new Set((grades.data ?? []).map((g) => g.code));
      const rows = CBC_GRADES.filter((g) => !existing.has(g.code)).map((g) => ({ ...g, tenant_id: tenantId, is_active: true }));
      if (!rows.length) throw new Error("These grade levels already exist");
      const { error } = await supabase.from("grade_levels").insert(rows);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [tenantId, "grade_levels"] });
      toast.success("CBC grade levels added", { duration: 3000 });
    },
    onError: (e: any) => toast.error("Couldn't add the grade levels", { description: e.message }),
  });

  const deleteGrade = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grade_levels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [tenantId, "grade_levels"] }),
    onError: (e: any) => toast.error("Couldn't remove that grade level", { description: e.message }),
  });

  const customSchema = z.object({
    code: z.string().trim().min(1, "Add a short code").max(12),
    name: z.string().trim().min(1, "Add a name").max(60),
    sort_order: z.coerce.number().int().min(0).max(999),
  });
  const customForm = useZodForm(customSchema, { defaultValues: { code: "", name: "", sort_order: 120 } });

  const addCustomGrade = useMutation({
    mutationFn: async (values: z.infer<typeof customSchema>) => {
      const { error } = await supabase.from("grade_levels").insert({
        tenant_id: tenantId,
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        sort_order: values.sort_order,
        stage: "other",
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      customForm.reset({ code: "", name: "", sort_order: 120 });
      await qc.invalidateQueries({ queryKey: [tenantId, "grade_levels"] });
      toast.success("Grade level added", { duration: 3000 });
    },
    onError: (e: any) => toast.error("Couldn't add that grade level", { description: e.message }),
  });

  const finish = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("No school selected");
      await recomputeSetupProgress(tenantId);
    },
    onSuccess: async () => {
      localStorage.removeItem(stepKey);
      await qc.invalidateQueries({ queryKey: [tenantId, "setup_progress"] });
      toast.success("Setup complete — you can now add classes, subjects, and students", { duration: 3000 });
      navigate("/app", { replace: true });
    },
    onError: (e: any) => toast.error("Couldn't finish setup", { description: e.message }),
  });

  if (!tenant) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">School setup</h1>
        <p className="text-sm text-muted-foreground">Four quick steps to get {tenant.name} ready for students.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = s.id === step;
            return (
              <button
                key={s.id}
                onClick={() => goto(s.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {completed[s.id]
                  ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  : <Circle className="h-4 w-4 shrink-0" />}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
          <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => navigate("/app")}>
            Save &amp; continue later
          </Button>
        </nav>

        <div>
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm your school details</CardTitle>
                <CardDescription>
                  These details appear on invoices, receipts and report cards, so they need to be right.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3 text-sm">
                  <div><span className="text-muted-foreground">Web address</span><p className="font-medium">{tenant.slug}</p></div>
                  <div><span className="text-muted-foreground">Curriculum</span><p className="font-medium uppercase">{tenant.curriculum ?? "—"}</p></div>
                  <div><span className="text-muted-foreground">Country</span><p className="font-medium">{tenant.country_code}</p></div>
                </div>
                <ZodForm form={detailsForm} onSubmit={(v) => saveDetails.mutate(v)} className="space-y-4">
                  <FormField control={detailsForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>School name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={detailsForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="P.O. Box 123, Nairobi" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={detailsForm.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="0712 345 678" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={detailsForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="info@school.ac.ke" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit" disabled={saveDetails.isPending}>
                    {saveDetails.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save &amp; continue
                  </Button>
                </ZodForm>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Academic year</CardTitle>
                <CardDescription>
                  Without an academic year you can't enrol students, run terms, or issue invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {years.isLoading ? <Skeleton className="h-16 w-full" /> : years.isError ? (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">We couldn't load your academic years.</p>
                    <Button size="sm" variant="outline" onClick={() => years.refetch()}>Retry</Button>
                  </div>
                ) : years.data?.length ? (
                  <ul className="space-y-2">
                    {years.data.map((y) => (
                      <li key={y.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                        <span className="font-medium">{y.name}</span>
                        <span className="text-muted-foreground">{y.start_date} → {y.end_date}{y.is_current ? " · current" : ""}</span>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyNote>No academic year yet. Create one below to unlock terms, classes and enrolment.</EmptyNote>}

                <ZodForm form={yearForm} onSubmit={(v) => saveYear.mutate(v)} className="space-y-4">
                  <FormField control={yearForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={yearForm.control} name="start_date" render={({ field }) => (
                      <FormItem><FormLabel>Start date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={yearForm.control} name="end_date" render={({ field }) => (
                      <FormItem><FormLabel>End date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={yearForm.control} name="is_current" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(!!c)} />
                      </FormControl>
                      <FormLabel className="font-normal">Set as the current academic year</FormLabel>
                    </FormItem>
                  )} />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saveYear.isPending}>
                      {saveYear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create year
                    </Button>
                    {!!years.data?.length && <Button type="button" variant="outline" onClick={() => goto(3)}>Continue</Button>}
                  </div>
                </ZodForm>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Terms</CardTitle>
                <CardDescription>
                  Terms drive attendance registers, exams and fee invoices. Kenyan defaults are filled in for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {!currentYear ? (
                  <EmptyNote>Create an academic year first — terms belong to a year. <button className="text-primary underline" onClick={() => goto(2)}>Go back</button></EmptyNote>
                ) : terms.isLoading ? <Skeleton className="h-16 w-full" /> : terms.data?.length ? (
                  <ul className="space-y-2">
                    {terms.data.map((t) => (
                      <li key={t.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-muted-foreground">{t.start_date} → {t.end_date}{t.is_current ? " · current" : ""}</span>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyNote>No terms yet for {currentYear.name}.</EmptyNote>}

                {currentYear && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Terms to create</Label>
                      {DEFAULT_TERMS.map((t) => {
                        const exists = (terms.data ?? []).some((x) => x.term_number === t.term_number);
                        return (
                          <label key={t.term_number} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                            <Checkbox
                              disabled={exists}
                              checked={exists || selectedTerms.includes(t.term_number)}
                              onCheckedChange={(c) =>
                                setSelectedTerms((prev) => (c ? [...new Set([...prev, t.term_number])] : prev.filter((n) => n !== t.term_number)))
                              }
                            />
                            <span className="font-medium">{t.name}</span>
                            <span className="text-muted-foreground">{t.start_date} → {t.end_date}</span>
                            {exists && <span className="ml-auto text-xs text-muted-foreground">already created</span>}
                          </label>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      <Label>Current term</Label>
                      <div className="flex gap-2">
                        {DEFAULT_TERMS.map((t) => (
                          <Button key={t.term_number} type="button" size="sm"
                            variant={currentTermNo === t.term_number ? "default" : "outline"}
                            onClick={() => setCurrentTermNo(t.term_number)}>
                            {t.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveTerms.mutate()} disabled={saveTerms.isPending}>
                        {saveTerms.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create terms
                      </Button>
                      {!!terms.data?.length && <Button variant="outline" onClick={() => goto(4)}>Continue</Button>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Grade levels</CardTitle>
                <CardDescription>
                  Grade levels are what classes and students are grouped by — nothing can be enrolled without them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {grades.isLoading ? <Skeleton className="h-24 w-full" /> : grades.data?.length ? (
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {grades.data.map((g) => (
                      <li key={g.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span><span className="font-medium">{g.name}</span> <span className="text-muted-foreground">({g.code})</span></span>
                        <Button variant="ghost" size="icon" onClick={() => deleteGrade.mutate(g.id)} aria-label={`Remove ${g.name}`}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : <EmptyNote>No grade levels yet. Seed the standard Kenyan CBC set, then remove any that don't apply.</EmptyNote>}

                <Button variant="outline" onClick={() => seedGrades.mutate()} disabled={seedGrades.isPending}>
                  {seedGrades.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Seed CBC grade levels
                </Button>

                <ZodForm form={customForm} onSubmit={(v) => addCustomGrade.mutate(v)} className="grid gap-3 sm:grid-cols-[120px_1fr_110px_auto] sm:items-end">
                  <FormField control={customForm.control} name="code" render={({ field }) => (
                    <FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="G10" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={customForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Grade 10" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={customForm.control} name="sort_order" render={({ field }) => (
                    <FormItem><FormLabel>Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" variant="secondary" disabled={addCustomGrade.isPending}>Add</Button>
                </ZodForm>

                <div className="border-t border-border pt-4">
                  <Button onClick={() => finish.mutate()} disabled={finish.isPending || !grades.data?.length}>
                    {finish.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Finish setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
