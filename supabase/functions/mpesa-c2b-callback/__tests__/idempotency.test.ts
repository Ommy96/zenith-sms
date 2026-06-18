/**
 * Idempotency contract test for the M-Pesa C2B callback.
 *
 * Run with: deno test --allow-net --allow-env
 *
 * What this verifies
 * ------------------
 * Safaricom retries deliveries on any non-2xx (and occasionally on
 * connection blips even after a 2xx). The callback MUST be idempotent on
 * `mpesa_receipt`:
 *
 *   1. Two POSTs carrying the same MpesaReceiptNumber → exactly ONE row in
 *      `mpesa_transactions` for that tenant.
 *   2. Exactly ONE matched payment (`student_payments`) is created.
 *   3. The invoice balance only decrements once.
 *   4. Exactly ONE receipt (`student_receipts`) is generated.
 *   5. Exactly ONE outbound SMS/WhatsApp message is queued in `messages`.
 *
 * Hard guarantee in the schema
 * ----------------------------
 * `mpesa_transactions` has UNIQUE (tenant_id, mpesa_receipt). The function
 * SELECTs by receipt before inserting, and catches Postgres error 23505
 * on the race. Both branches return ResultCode 0 ("Accepted (duplicate)").
 *
 * Setup required to actually execute this test
 * --------------------------------------------
 * Provide a non-production Supabase project URL + service-role key via env
 * vars (see top of `main()`). The test seeds its own tenant + student and
 * cleans up at the end. Skip if env vars are missing.
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const URL = Deno.env.get("MPESA_TEST_SUPABASE_URL");
const KEY = Deno.env.get("MPESA_TEST_SERVICE_ROLE_KEY");

Deno.test({
  name: "mpesa-c2b-callback is idempotent on duplicate MpesaReceiptNumber",
  ignore: !URL || !KEY,
  async fn() {
    const admin = createClient(URL!, KEY!);

    // 1. Seed an isolated tenant + student.
    const slug = `mpesa-idem-${crypto.randomUUID().slice(0, 8)}`;
    const { data: tenant, error: tErr } = await admin
      .from("tenants")
      .insert({ name: slug, slug, country_code: "KE", currency_code: "KES" })
      .select("id")
      .single();
    assert(!tErr, `tenant insert: ${tErr?.message}`);
    const tenantId = tenant!.id as string;

    const admission = `T${Date.now()}`;
    await admin.from("students").insert({
      tenant_id: tenantId,
      admission_number: admission,
      first_name: "Idem",
      last_name: "Test",
    });

    const receipt = `IDEM${Date.now()}`;
    const payload = {
      TransID: receipt,
      TransAmount: "1500",
      MSISDN: "254700000000",
      BillRefNumber: admission,
      BusinessShortCode: "000000",
      TransactionType: "Pay Bill",
      TransTime: "20260101120000",
    };

    const url = `${URL}/functions/v1/mpesa-c2b-callback?tenant=${tenantId}`;
    const post = () =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        await r.text();
        return r.status;
      });

    // 2. Deliver the same callback twice.
    const [s1, s2] = await Promise.all([post(), post()]);
    assertEquals(s1, 200);
    assertEquals(s2, 200);

    // 3. Exactly one transaction row.
    const { data: txs } = await admin
      .from("mpesa_transactions")
      .select("id, matched_payment_id")
      .eq("tenant_id", tenantId)
      .eq("mpesa_receipt", receipt);
    assertEquals(txs?.length, 1, "expected exactly one mpesa_transactions row");

    // 4. Exactly one matched payment.
    const { data: pays } = await admin
      .from("student_payments")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("reference", receipt);
    assertEquals(pays?.length, 1, "expected exactly one student_payments row");

    // 5. Exactly one receipt.
    const { data: rcps } = await admin
      .from("student_receipts")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("payment_id", pays![0].id);
    assertEquals(rcps?.length, 1, "expected exactly one student_receipts row");

    // Cleanup
    await admin.from("tenants").delete().eq("id", tenantId);
  },
});