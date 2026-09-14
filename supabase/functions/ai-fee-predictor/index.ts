// Flags students at risk of fee default from their payment history.
import { adminClient, authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { student_id, tenant_id } = await req.json().catch(() => ({}));
    const tenantId = tenant_id ?? user.tenantIds[0];
    if (!user.isSuperAdmin) requirePermission(user, tenantId, "invoices.view");

    const admin = adminClient();
    let q = admin.from("invoices")
      .select("id, student_id, invoice_number, total, amount_paid, balance, due_date, status")
      .eq("tenant_id", tenantId)
      .order("due_date", { ascending: false })
      .limit(500);
    if (student_id) q = q.eq("student_id", student_id);
    const { data: invoices } = await q;

    if (!invoices?.length) {
      return jsonResponse({ ok: true, analysis: "No invoices on file yet, so there is nothing to analyse." });
    }

    const result = await callAnthropic({
      tenantId,
      userId: user.userId,
      functionName: "ai-fee-predictor",
      purpose: "fee_default_risk",
      system:
        "You are a school finance analyst. From invoice and payment history, identify which students are at " +
        "risk of defaulting on fees. Return a short list: student_id, risk level (low/medium/high) and the reason.",
      prompt: `Invoice history (JSON):\n${JSON.stringify(invoices)}`,
      maxTokens: 2000,
    });

    return jsonResponse({ ok: true, analysis: result.text, invoices_analysed: invoices.length });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
