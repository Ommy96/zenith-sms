import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createLogger } from "../_shared/log.ts";
import { captureEdgeException } from "../_shared/sentry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const log = createLogger({ fn: "mpesa-c2b-callback", requestId });
  try {
    const payload = await req.json().catch(() => ({}));

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const receipt = payload.TransID ?? payload.MpesaReceiptNumber ?? crypto.randomUUID();
    const amount = Number(payload.TransAmount ?? payload.Amount ?? 0);
    const phone = String(payload.MSISDN ?? payload.PhoneNumber ?? "");
    const accountRef = String(payload.BillRefNumber ?? payload.AccountReference ?? "").trim();
    const shortcode = String(payload.BusinessShortCode ?? "");

    // SECURITY: tenant is resolved EXCLUSIVELY from the BusinessShortCode in
    // Safaricom's payload. We no longer accept tenant hints via query string —
    // exposing tenant UUIDs on a public URL was an information-disclosure risk
    // and an integrity risk (any caller could spoof the routing target).
    let tenantId: string | null = null;
    if (shortcode) {
      const { data } = await admin
        .from("mpesa_config")
        .select("tenant_id")
        .eq("shortcode", shortcode)
        .eq("is_active", true)
        .not("tenant_id", "is", null)
        .limit(1)
        .maybeSingle();
      tenantId = data?.tenant_id ?? null;
    }
    if (!tenantId) {
      log.warn("unknown_shortcode", { shortcode });
      // Best-effort audit trail so ops can investigate misrouted payments.
      await admin.from("audit_logs").insert({
        tenant_id: null,
        entity_type: "mpesa_transactions",
        action: "unknown_shortcode",
        after: { shortcode, receipt, amount, accountRef, raw_payload: payload },
      }).then(() => {}, () => {});
      // Always 200 OK so Safaricom doesn't retry-flood us.
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted (unknown shortcode)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: if we've already stored this receipt for this tenant, skip.
    const { data: existing } = await admin
      .from("mpesa_transactions")
      .select("id, status, matched_payment_id")
      .eq("tenant_id", tenantId)
      .eq("mpesa_receipt", receipt)
      .maybeSingle();

    if (existing) {
      log.info("duplicate_receipt_ignored", { receipt, tenantId });
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted (duplicate)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert — the DB trigger `_tg_mpesa_auto_match` will attempt to
    // resolve the student by normalized admission_number and (if found)
    // create a payment + allocation + receipt atomically.
    const { error: insertErr } = await admin.from("mpesa_transactions").insert({
      tenant_id: tenantId,
      mpesa_receipt: receipt,
      transaction_type: payload.TransactionType ?? "Pay Bill",
      transaction_time: payload.TransTime
        ? parseSafaricomDate(String(payload.TransTime)).toISOString()
        : new Date().toISOString(),
      amount,
      phone,
      account_reference: accountRef,
      account_reference_raw: accountRef,
      bill_ref_number: payload.BillRefNumber ?? null,
      org_account_balance: payload.OrgAccountBalance ? Number(payload.OrgAccountBalance) : null,
      first_name: payload.FirstName ?? null,
      middle_name: payload.MiddleName ?? null,
      last_name: payload.LastName ?? null,
      raw_payload: payload,
    });

    if (insertErr) {
      // Race condition fallback (unique violation on receipt) — treat as duplicate
      if (insertErr.code === "23505") {
        return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted (duplicate)" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      log.error("insert_error", { code: insertErr.code, message: insertErr.message, tenantId });
    }

    log.info("receipt_accepted", { receipt, amount, accountRef, tenantId });

    // Best-effort: kick off receipt PDF generation if the auto-match trigger
    // produced a student_receipts row. Failure here MUST NOT block the
    // payment confirmation — the PDF is a derived artifact.
    try {
      const { data: txn } = await admin
        .from("mpesa_transactions")
        .select("matched_payment_id")
        .eq("tenant_id", tenantId)
        .eq("mpesa_receipt", receipt)
        .maybeSingle();
      if (txn?.matched_payment_id) {
        const { data: rcp } = await admin
          .from("student_receipts")
          .select("id")
          .eq("payment_id", txn.matched_payment_id)
          .maybeSingle();
        if (rcp?.id) {
          const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-receipt-pdf`;
          fetch(fnUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ receipt_id: rcp.id }),
          }).catch(() => {});
        }
      }
    } catch (pdfErr) {
      await admin.from("audit_logs").insert({
        tenant_id: tenantId,
        entity_type: "student_receipts",
        action: "receipt_pdf_failed",
        after: { reason: String((pdfErr as Error).message || pdfErr), mpesa_receipt: receipt },
      }).then(() => {}, () => {});
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("unhandled_error", { err: e instanceof Error ? e.message : String(e) });
    await captureEdgeException(e, { fn: "mpesa-c2b-callback", requestId });
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted with error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Safaricom TransTime is "YYYYMMDDHHMMSS"
function parseSafaricomDate(s: string): Date {
  if (!/^\d{14}$/.test(s)) return new Date();
  const y = +s.slice(0, 4), mo = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
  const h = +s.slice(8, 10), mi = +s.slice(10, 12), se = +s.slice(12, 14);
  return new Date(Date.UTC(y, mo, d, h, mi, se));
}