// mpesa-stk-push — asks a parent's phone to approve a fee payment.
//
// verify_jwt: true. Staff need payments.record; portal parents may only push
// for their own child's invoice.

import { adminClient, authErrorResponse, authedUser, EdgeAuthError } from "../_shared/auth.ts";
import { requireOwnsResource } from "../_shared/ownership.ts";
import { corsHeaders, jsonResponse, normalizePhone, readBody } from "../_shared/messaging.ts";

const BASE = (env: string) =>
  env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { invoice_id, amount, phone, account_reference } = await req.json();
    if (!invoice_id || !amount || !phone) {
      return jsonResponse({ error: "invoice_id, amount and phone are required" }, 400);
    }
    if (!(Number(amount) > 0)) return jsonResponse({ error: "amount must be positive" }, 400);

    const { tenantId, studentId } = await requireOwnsResource({
      user, resourceType: "invoice", resourceId: invoice_id, functionName: "mpesa-stk-push", req,
    });
    if (!user.isSuperAdmin && user.tenantIds.includes(tenantId) &&
        !user.permissions.includes("payments.record")) {
      throw new EdgeAuthError(403, "Forbidden: missing permission payments.record");
    }

    const admin = adminClient();
    const { data: cfg } = await admin.from("mpesa_config").select("*")
      .eq("tenant_id", tenantId).eq("is_active", true).maybeSingle();
    if (!cfg) return jsonResponse({ error: "M-Pesa is not set up for this school" }, 400);

    const key = cfg.consumer_key_encrypted;
    const secret = cfg.consumer_secret_encrypted;
    const passkey = cfg.passkey_encrypted;
    if (!key || !secret || !passkey) return jsonResponse({ error: "M-Pesa credentials incomplete" }, 400);

    const base = BASE(cfg.environment);
    const tokenRes = await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${btoa(`${key}:${secret}`)}` },
    });
    const tokenData = await readBody(tokenRes);
    if (!tokenRes.ok || !tokenData?.access_token) {
      return jsonResponse({ error: "Could not reach M-Pesa (check credentials)" }, 502);
    }

    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = btoa(`${cfg.shortcode}${passkey}${stamp}`);
    const msisdn = normalizePhone(String(phone)).replace("+", "");

    const res = await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: cfg.shortcode,
        Password: password,
        Timestamp: stamp,
        TransactionType: cfg.shortcode_type === "till" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
        Amount: Math.round(Number(amount)),
        PartyA: msisdn,
        PartyB: cfg.shortcode,
        PhoneNumber: msisdn,
        CallBackURL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-stk-callback`,
        AccountReference: String(account_reference ?? invoice_id).slice(0, 12),
        TransactionDesc: "School fees",
      }),
    });
    const data = await readBody(res);
    const ok = res.ok && data?.ResponseCode === "0";

    await admin.from("mpesa_stk_requests").insert({
      tenant_id: tenantId,
      student_id: studentId,
      invoice_id,
      amount: Number(amount),
      msisdn,
      account_reference: account_reference ?? null,
      transaction_desc: "School fees",
      checkout_request_id: data?.CheckoutRequestID ?? null,
      merchant_request_id: data?.MerchantRequestID ?? null,
      status: ok ? "pending" : "failed",
      result_desc: ok ? null : String(data?.errorMessage ?? data?.ResponseDescription ?? "Request failed"),
      initiated_by: user.userId,
      raw_response: data,
    });

    return ok
      ? jsonResponse({ ok: true, checkout_request_id: data.CheckoutRequestID })
      : jsonResponse({ ok: false, error: data?.errorMessage ?? "M-Pesa rejected the request" }, 502);
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
