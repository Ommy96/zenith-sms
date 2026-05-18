import { supabase } from "@/integrations/supabase/client";

export interface AudienceFilter {
  scope: "all_parents" | "all_students" | "all_staff" | "by_class" | "by_grade" | "defaulters" | "custom";
  class_ids?: string[];
  grade_levels?: string[];
  custom_ids?: string[];
  min_balance?: number;
}

export interface AudienceRecipient {
  student_id: string;
  student_name: string;
  class_name?: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  balance?: number;
}

/**
 * Resolve an audience filter into a list of recipients.
 * Currently parent-centric (most messaging is guardian-bound).
 */
export async function resolveAudience(
  tenantId: string,
  filter: AudienceFilter
): Promise<AudienceRecipient[]> {
  let q = supabase
    .from("students")
    .select("id, first_name, last_name, guardian_name, guardian_phone, guardian_email, grade, current_class_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  if (filter.scope === "by_class" && filter.class_ids?.length) {
    q = q.in("current_class_id", filter.class_ids);
  }
  if (filter.scope === "by_grade" && filter.grade_levels?.length) {
    q = q.in("grade", filter.grade_levels);
  }
  if (filter.scope === "custom" && filter.custom_ids?.length) {
    q = q.in("id", filter.custom_ids);
  }

  const { data: students, error } = await q;
  if (error) throw error;
  let recipients: AudienceRecipient[] = (students || []).map((s: any) => ({
    student_id: s.id,
    student_name: `${s.first_name} ${s.last_name}`.trim(),
    guardian_name: s.guardian_name,
    guardian_phone: s.guardian_phone,
    guardian_email: s.guardian_email,
  }));

  if (filter.scope === "defaulters") {
    // Pull invoice balances and keep students with balance > min_balance
    const ids = recipients.map((r) => r.student_id);
    if (ids.length === 0) return [];
    const { data: inv } = await supabase
      .from("student_invoices")
      .select("student_id, balance")
      .eq("tenant_id", tenantId)
      .in("student_id", ids)
      .gt("balance", filter.min_balance ?? 0);
    const bal = new Map<string, number>();
    (inv || []).forEach((i: any) => {
      bal.set(i.student_id, (bal.get(i.student_id) || 0) + Number(i.balance || 0));
    });
    recipients = recipients
      .filter((r) => (bal.get(r.student_id) || 0) > (filter.min_balance ?? 0))
      .map((r) => ({ ...r, balance: bal.get(r.student_id) || 0 }));
  }
  return recipients;
}

export function renderTemplate(body: string, vars: Record<string, string | number | undefined | null>): string {
  return body.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? `{{${k}}}` : String(v);
  });
}

export function extractVariables(body: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([\w_]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(body)) !== null) set.add(m[1]);
  return Array.from(set);
}