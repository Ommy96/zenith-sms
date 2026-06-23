import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export interface SetupTask {
  id: string;
  label: string;
  description: string;
  route: string;
  done: boolean;
  step: number;
}

export function useSetupChecklist() {
  const { tenant } = useTenant();
  const [tasks, setTasks] = useState<SetupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [weightedPercent, setWeightedPercent] = useState(0);

  const load = useCallback(async () => {
    if (!tenant?.id) { setLoading(false); return; }
    setLoading(true);
    const tid = tenant.id;

    const [years, terms, classes, subjects, staff, students, fees, sms, gradeLevels, rooms, learningAreas] = await Promise.all([
      supabase.from("academic_years").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("terms").select("id", { count: "exact", head: true }).eq("tenant_id", tid).eq("is_current", true),
      supabase.from("classes").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("subjects").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("staff").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("students").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("fee_structures").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("tenant_settings").select("value").eq("tenant_id", tid).eq("key", "messaging.provider_configured").maybeSingle(),
      supabase.from("grade_levels").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("rooms").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("learning_areas").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
    ] as any) as any;

    const dismissedRes = await supabase.from("tenant_settings").select("value").eq("tenant_id", tid).eq("key", "dismissed_hints").maybeSingle();
    const dismissedList = (dismissedRes.data as any)?.value?.list ?? [];
    setDismissed(dismissedList);

    const hasIdentity = !!tenant.name && !!tenant.country_code && !!tenant.curriculum;

    const list: SetupTask[] = [
      { id: "identity", step: 1, label: "School identity", description: "Logo, name, country, curriculum", route: "/onboarding?step=1", done: hasIdentity },
      { id: "academic", step: 2, label: "Academic structure", description: "Current year, term, grade levels", route: "/onboarding?step=2", done: (terms?.count ?? 0) > 0 },
      { id: "classes", step: 3, label: "Classes & subjects", description: "Create classes and subject lists", route: "/onboarding?step=3", done: (classes?.count ?? 0) > 0 && (subjects?.count ?? 0) > 0 },
      { id: "staff", step: 4, label: "Add staff", description: "At least one teacher with a class assigned", route: "/onboarding?step=4", done: (staff?.count ?? 0) > 0 },
      { id: "students", step: 5, label: "Add students", description: "Import via Excel or add manually", route: "/onboarding?step=5", done: (students?.count ?? 0) > 0 },
      { id: "fees", step: 6, label: "Fee structure", description: "Set up at least one fee structure", route: "/onboarding?step=6", done: (fees?.count ?? 0) > 0 },
      { id: "comms", step: 7, label: "Communications", description: "Connect SMS or WhatsApp provider", route: "/onboarding?step=7", done: !!sms?.data },
    ];
    setTasks(list);

    // Weighted progress calc
    const isCbc = tenant.curriculum === "cbc";
    const weights: { weight: number; done: boolean }[] = [
      { weight: 10, done: (years?.count ?? 0) > 0 },
      { weight: 10, done: (terms?.count ?? 0) > 0 },
      { weight: 15, done: (gradeLevels?.count ?? 0) > 0 },
      { weight: 15, done: (classes?.count ?? 0) > 0 },
      { weight: 15, done: (subjects?.count ?? 0) > 0 },
      { weight: 5,  done: (rooms?.count ?? 0) > 0 },
      ...(isCbc ? [{ weight: 15, done: (learningAreas?.count ?? 0) > 0 }] : []),
      { weight: 15, done: (students?.count ?? 0) > 0 },
    ];
    const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
    const earnedWeight = weights.reduce((s, w) => s + (w.done ? w.weight : 0), 0);
    setWeightedPercent(Math.round((earnedWeight / totalWeight) * 100));
    setLoading(false);
  }, [tenant?.id, tenant?.name, tenant?.country_code, tenant?.curriculum]);

  useEffect(() => { load(); }, [load]);

  const dismissHint = useCallback(async (id: string) => {
    if (!tenant?.id) return;
    const next = Array.from(new Set([...dismissed, id]));
    setDismissed(next);
    await supabase.from("tenant_settings").upsert({
      tenant_id: tenant.id, key: "dismissed_hints", value: { list: next } as any,
    } as any, { onConflict: "tenant_id,key" } as any);
  }, [tenant?.id, dismissed]);

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length || 7;
  const percent = weightedPercent;

  return { tasks, loading, percent, done, total, dismissed, dismissHint, refresh: load };
}