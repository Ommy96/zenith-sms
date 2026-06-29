import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const payload = await req.json().catch(() => ({}));
    const stk = payload?.Body?.stkCallback;
    if (!stk) return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "no-op" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const checkoutId = stk.CheckoutRequestID;
    const resultCode = String(stk.ResultCode);
    const resultDesc = stk.ResultDesc;
    let receipt: string | null = null;
    if (Array.isArray(stk?.CallbackMetadata?.Item)) {
      for (const it of stk.CallbackMetadata.Item) {
        if (it.Name === "MpesaReceiptNumber") receipt = String(it.Value);
      }
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("mpesa_stk_requests").update({
      status: resultCode === "0" ? "success" : (resultCode === "1032" ? "cancelled" : "failed"),
      result_code: resultCode,
      result_desc: resultDesc,
      mpesa_receipt: receipt,
    }).eq("checkout_request_id", checkoutId);

    // Fire-and-forget receipt PDF generation on success. The C2B/transaction
    // trigger creates the student_receipts row; we just kick off rendering.
    if (resultCode === "0" && receipt) {
      try {
        const { data: txn } = await admin
          .from("mpesa_transactions").select("matched_payment_id").eq("mpesa_receipt", receipt).maybeSingle();
        const paymentId = txn?.matched_payment_id;
        const { data: rcp } = paymentId
          ? await admin.from("student_receipts").select("id").eq("payment_id", paymentId).maybeSingle()
          : { data: null };
        if (rcp?.id) {
          fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-receipt-pdf`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ receipt_id: rcp.id }),
          }).catch(() => {});
        }
      } catch { /* non-blocking */ }
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mpesa-stk-callback error", e);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "err" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});