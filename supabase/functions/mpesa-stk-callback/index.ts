// mpesa-stk-callback — Safaricom result for a payment prompt we initiated.
//
// verify_jwt: false. Because we initiated the prompt against a known invoice,
// a successful result auto-creates the payment, allocation and receipt.

import { adminClient } from "../_shared/auth.ts";
import { callInternal, corsHeaders } from "../_shared/messaging.ts";

const ack = (desc = "Accepted") =>
  new Response(JSON.stringify({ ResultCode: 0, ResultDesc: desc }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const payload = await req.json().catch(() => ({}));
    const stk = payload?.Body?.stkCallback;
    if (!stk) return ack("No callback body");

    const admin = adminClient();
    const checkoutId = stk.CheckoutRequestID;
    const resultCode = Number(stk.ResultCode);
    const items: any[] = stk?.CallbackMetadata?.Item ?? [];
    const meta: Record<string, any> = {};
    for (const it of items) meta[it.Name] = it.Value;

    const { data: reqRow } = await admin.from("mpesa_stk_requests").select("*")
      .eq("checkout_request_id", checkoutId).maybeSingle();
    if (!reqRow) return ack("Unknown checkout request");

    const status = resultCode === 0 ? "success" : (resultCode === 1032 ? "cancelled" : "failed");
    await admin.from("mpesa_stk_requests").update({
      status,
      result_code: resultCode,
      result_desc: stk.ResultDesc,
      mpesa_receipt_number: meta.MpesaReceiptNumber ?? null,
      completed_at: new Date().toISOString(),
      raw_response: payload,
    }).eq("id", reqRow.id);

    if (resultCode !== 0 || reqRow.payment_id) return ack();

    const receiptNo = String(meta.MpesaReceiptNumber ?? checkoutId);
    const amount = Number(meta.Amount ?? reqRow.amount);

    const { data: payment, error: payErr } = await admin.from("payments").insert({
      tenant_id: reqRow.tenant_id,
      student_id: reqRow.student_id,
      amount,
      method: "mpesa",
      reference: receiptNo,
      payer_phone: String(meta.PhoneNumber ?? reqRow.msisdn),
      status: "confirmed",
      paid_at: new Date().toISOString(),
      idempotency_key: `stk:${checkoutId}`,
      metadata: { source: "stk_push", checkout_request_id: checkoutId },
    }).select("id").single();

    if (payErr) {
      console.error("[mpesa-stk-callback] payment insert failed", payErr.message);
      return ack();
    }

    if (reqRow.invoice_id) {
      await admin.from("payment_allocations").insert({
        tenant_id: reqRow.tenant_id,
        payment_id: payment.id,
        invoice_id: reqRow.invoice_id,
        amount,
      });
    }

    const { data: receipt } = await admin.from("student_receipts").insert({
      tenant_id: reqRow.tenant_id,
      payment_id: payment.id,
      student_id: reqRow.student_id,
      amount,
    }).select("id").single();

    await admin.from("mpesa_stk_requests").update({ payment_id: payment.id }).eq("id", reqRow.id);

    if (receipt?.id) callInternal("generate-receipt-pdf", { receipt_id: receipt.id }).catch(() => {});

    return ack();
  } catch (e) {
    console.error("[mpesa-stk-callback]", (e as Error).message);
    return ack();
  }
});
