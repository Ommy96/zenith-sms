import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const baseUrl = (env: string) =>
  env === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

function ts() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function normalizePhone(phone: string) {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("7") || p.startsWith("1")) p = "254" + p;
  return p;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { phone, amount, account_reference, invoice_id, student_id } = await req.json();
    if (!phone || !amount) {
      return new Response(JSON.stringify({ error: "phone and amount required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", claimsData.claims.sub).maybeSingle();
    const schoolId = profile?.tenant_id;
    if (!schoolId) return new Response(JSON.stringify({ error: "No school" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: cfg } = await supabase.from("mpesa_config").select("*").eq("tenant_id", schoolId).maybeSingle();
    if (!cfg?.shortcode || !cfg?.passkey || !cfg?.consumer_key || !cfg?.consumer_secret) {
      return new Response(JSON.stringify({ error: "M-Pesa not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get OAuth token
    const tokenRes = await fetch(`${baseUrl(cfg.environment)}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${btoa(`${cfg.consumer_key}:${cfg.consumer_secret}`)}` },
    });
    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
      return new Response(JSON.stringify({ error: "Failed to get token", details: tokenJson }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const timestamp = ts();
    const password = btoa(`${cfg.shortcode}${cfg.passkey}${timestamp}`);
    const callbackBase = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${callbackBase}/functions/v1/mpesa-stk-callback?school=${schoolId}`;
    const normalized = normalizePhone(String(phone));

    const stkRes = await fetch(`${baseUrl(cfg.environment)}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenJson.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: cfg.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: cfg.shortcode_type === "till" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
        Amount: Math.round(Number(amount)),
        PartyA: normalized,
        PartyB: cfg.shortcode,
        PhoneNumber: normalized,
        CallBackURL: callbackUrl,
        AccountReference: account_reference ?? "Fees",
        TransactionDesc: "School fees",
      }),
    });
    const stkJson = await stkRes.json();

    // Service-role insert to bypass RLS for the log row
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("mpesa_stk_requests").insert({
      tenant_id: schoolId,
      invoice_id: invoice_id ?? null,
      student_id: student_id ?? null,
      phone: normalized,
      amount: Number(amount),
      account_reference: account_reference ?? null,
      merchant_request_id: stkJson.MerchantRequestID ?? null,
      checkout_request_id: stkJson.CheckoutRequestID ?? null,
      status: stkJson.ResponseCode === "0" ? "pending" : "failed",
      result_code: stkJson.ResponseCode ?? null,
      result_desc: stkJson.ResponseDescription ?? stkJson.errorMessage ?? null,
    });

    return new Response(JSON.stringify({ ok: stkJson.ResponseCode === "0", response: stkJson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});