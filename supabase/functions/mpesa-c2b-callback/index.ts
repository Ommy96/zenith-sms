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
    const url = new URL(req.url);
    // Accepts ?tenant=<uuid|slug> (preferred) or legacy ?school=<uuid>
    const tenantHint = url.searchParams.get("tenant") ?? url.searchParams.get("school");
    const payload = await req.json().catch(() => ({}));

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const receipt = payload.TransID ?? payload.MpesaReceiptNumber ?? crypto.randomUUID();
    const amount = Number(payload.TransAmount ?? payload.Amount ?? 0);
    const phone = String(payload.MSISDN ?? payload.PhoneNumber ?? "");
    const accountRef = String(payload.BillRefNumber ?? payload.AccountReference ?? "").trim();
    const shortcode = String(payload.BusinessShortCode ?? "");

    // Resolve tenant: hint param > shortcode lookup > tenant.slug lookup
    let tenantId: string | null = null;
    if (tenantHint) {
      // Accept either uuid or slug
      if (/^[0-9a-f-]{36}$/i.test(tenantHint)) {
        tenantId = tenantHint;
      } else {
        const { data: t } = await admin.from("tenants").select("id").eq("slug", tenantHint).maybeSingle();
        tenantId = t?.id ?? null;
      }
    }
    if (!tenantId && shortcode) {
      const { data } = await admin.from("mpesa_config")
        .select("tenant_id").eq("shortcode", shortcode).not("tenant_id", "is", null).maybeSingle();
      tenantId = data?.tenant_id ?? null;
    }
    if (!tenantId) {
      log.warn("no_tenant_resolved", { tenantHint, shortcode });
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted (no school)" }), {
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