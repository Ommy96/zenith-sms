// Fee-default risk predictor.
// Computes a heuristic risk score per student (current balance, % overdue, payment history,
// attendance proxy), then optionally asks Claude/Lovable AI to narrate the top-N at-risk.
import { createClient } from "npm:@supabase/supabase-js@2";
import { aiCall, checkQuota, authedUser, userIsTenantMember } from "../_shared/ai-service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { tenantId, narrate = true, topN = 20 } = await req.json();
    if (!tenantId) return json({ error: "tenantId required" }, 400);

    const auth = await authedUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    if (!(await userIsTenantMember(auth.userId, tenantId))) return json({ error: "Forbidden" }, 403);

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Pull active students + their invoices + payments
    const { data: students } = await svc.from("students")
      .select("id, first_name, last_name, admission_number, current_class_id, classes:current_class_id(name)")
      .eq("tenant_id", tenantId).eq("status", "active").limit(2000);
    const studentIds = (students || []).map((s: any) => s.id);
    if (!studentIds.length) return json({ ok: true, students: [] });

    const today = new Date();
    const oneYearAgo = new Date(today); oneYearAgo.setFullYear(today.getFullYear() - 1);

    const [invRes, payRes] = await Promise.all([
      svc.from("student_invoices")
        .select("student_id, total, balance, status, due_date, issued_at")
        .eq("tenant_id", tenantId).in("student_id", studentIds),
      svc.from("student_payments")
        .select("student_id, amount, paid_at")
        .eq("tenant_id", tenantId).in("student_id", studentIds)
        .gte("paid_at", oneYearAgo.toISOString()),
    ]);

    type Bucket = {
      balance: number; total: number; overdue_balance: number; overdue_invoices: number;
      invoice_count: number; payment_count: number; total_paid: number;
      avg_days_late: number; last_payment: string | null;
    };
    const buckets = new Map<string, Bucket>();
    const ensure = (id: string) => {
      let b = buckets.get(id);
      if (!b) {
        b = { balance: 0, total: 0, overdue_balance: 0, overdue_invoices: 0,
              invoice_count: 0, payment_count: 0, total_paid: 0,
              avg_days_late: 0, last_payment: null };
        buckets.set(id, b);
      }
      return b;
    };

    const lateDaysAccum = new Map<string, { n: number; sum: number }>();
    for (const inv of invRes.data || []) {
      const b = ensure(inv.student_id);
      b.invoice_count++;
      b.balance += Number(inv.balance || 0);
      b.total += Number(inv.total || 0);
      if (inv.due_date && new Date(inv.due_date) < today && Number(inv.balance) > 0) {
        b.overdue_invoices++;
        b.overdue_balance += Number(inv.balance || 0);
        const ld = Math.floor((+today - +new Date(inv.due_date)) / 86400000);
        const acc = lateDaysAccum.get(inv.student_id) || { n: 0, sum: 0 };
        acc.n++; acc.sum += ld;
        lateDaysAccum.set(inv.student_id, acc);
      }
    }
    for (const p of payRes.data || []) {
      const b = ensure(p.student_id);
      b.payment_count++;
      b.total_paid += Number(p.amount || 0);
      if (!b.last_payment || p.paid_at > b.last_payment) b.last_payment = p.paid_at;
    }
    for (const [id, acc] of lateDaysAccum.entries()) {
      const b = buckets.get(id)!;
      b.avg_days_late = Math.round(acc.sum / acc.n);
    }

    // Score: weighted blend
    const scored = (students || []).map((s: any) => {
      const b = buckets.get(s.id) || ensure(s.id);
      const paidRatio = b.total > 0 ? Math.min(b.total_paid / b.total, 1) : 0;
      const overdueRatio = b.total > 0 ? b.overdue_balance / b.total : 0;
      const lateScore = Math.min(b.avg_days_late / 60, 1);    // cap at 60 days
      const noRecentPay = b.last_payment
        ? Math.min((+today - +new Date(b.last_payment)) / (180 * 86400000), 1)
        : 1;
      const riskRaw = (
        0.40 * overdueRatio +
        0.20 * lateScore +
        0.20 * (1 - paidRatio) +
        0.20 * noRecentPay
      );
      const score = Math.round(riskRaw * 100);
      const band = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
      return {
        student_id: s.id,
        name: `${s.first_name} ${s.last_name}`.trim(),
        admission_number: s.admission_number,
        class_name: s.classes?.name || null,
        balance: b.balance, overdue_balance: b.overdue_balance,
        overdue_invoices: b.overdue_invoices, avg_days_late: b.avg_days_late,
        last_payment: b.last_payment, total_paid: b.total_paid, total_billed: b.total,
        risk_score: score, risk_band: band,
      };
    })
      .filter((s) => s.total_billed > 0)
      .sort((a, b) => b.risk_score - a.risk_score);

    let narrative: string | null = null;
    if (narrate && scored.length) {
      const q = await checkQuota(tenantId);
      if (q.state !== "hard_stop") {
        const top = scored.slice(0, Math.min(topN, 20));
        const sample = top.map((s) => ({
          name: s.name, class: s.class_name, balance: s.balance,
          overdue: s.overdue_balance, days_late: s.avg_days_late,
          score: s.risk_score, band: s.risk_band,
        }));
        try {
          const r = await aiCall({
            tenantId, userId: auth.userId, feature: "fee_predictor",
            system: "You are a school finance analyst. Be concise, factual, and actionable. Output markdown.",
            messages: [{
              role: "user",
              content: `Summarize fee-default risk for these top ${sample.length} students and propose 3 concrete next steps (e.g. payment plans, parent calls, M-Pesa reminders). Data:\n\n${JSON.stringify(sample, null, 2)}`,
            }],
            temperature: 0.3, maxTokens: 800,
            cacheContext: scored.slice(0, 10).map((s) => `${s.student_id}:${s.risk_score}`).join(","),
          });
          narrative = r.text;
        } catch (_) { /* narration optional */ }
      }
    }

    return json({ ok: true, students: scored, narrative, generated_at: new Date().toISOString() });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}