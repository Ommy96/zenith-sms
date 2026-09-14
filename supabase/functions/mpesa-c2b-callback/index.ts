// mpesa-c2b-callback — Safaricom paybill/till confirmation webhook.
//
// verify_jwt: false (Safaricom cannot send a JWT).
// Tenant is resolved from BusinessShortCode. Unknown shortcodes are audited and
// acknowledged. A payment is NEVER auto-created here — a human confirms the
// match in the reconciliation UI.

import { adminClient } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/messaging.ts";

const ack = (desc = "Accepted") =>
  new Response(JSON.stringify({ ResultCode: 0, ResultDesc: desc }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const payload = await req.json().catch(() => ({}));
    const admin = adminClient();

    const shortcode = String(payload?.BusinessShortCode ?? payload?.BusinessShortcode ?? "").trim();
    const transactionId = String(payload?.TransID ?? "").trim();
    if (!transactionId) return ack("No transaction id");

    const { data: cfg } = await admin.from("mpesa_config")
      .select("tenant_id").eq("shortcode", shortcode).eq("is_active", true).maybeSingle();

    if (!cfg) {
      await admin.from("audit_logs").insert({
        tenant_id: null, actor_type: "system", action: "mpesa.c2b.unmatched",
        entity_type: "mpesa_c2b_transaction", entity_id: null,
        after: { reason: "unknown_shortcode", shortcode, payload },
      });
      return ack("Unknown shortcode");
    }

    const { data: existing } = await admin.from("mpesa_c2b_transactions")
      .select("id").eq("transaction_id", transactionId).maybeSingle();
    if (existing) return ack("Duplicate");

    const ts = String(payload?.TransTime ?? "");
    const transTime = /^\d{14}$/.test(ts)
      ? new Date(`${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}T${ts.slice(8,10)}:${ts.slice(10,12)}:${ts.slice(12,14)}+03:00`).toISOString()
      : new Date().toISOString();

    await admin.from("mpesa_c2b_transactions").insert({
      tenant_id: cfg.tenant_id,
      business_shortcode: shortcode,
      transaction_type: payload?.TransactionType ?? "Pay Bill",
      transaction_id: transactionId,
      transaction_time: transTime,
      amount: Number(payload?.TransAmount ?? 0),
      msisdn: String(payload?.MSISDN ?? ""),
      bill_ref_number: payload?.BillRefNumber ?? null,
      first_name: payload?.FirstName ?? null,
      middle_name: payload?.MiddleName ?? null,
      last_name: payload?.LastName ?? null,
      raw_payload: payload,
    });

    return ack();
  } catch (e) {
    console.error("[mpesa-c2b-callback]", (e as Error).message);
    return ack("Accepted");
  }
});
