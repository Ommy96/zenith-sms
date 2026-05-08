import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const schoolHint = url.searchParams.get("school");
    const payload = await req.json().catch(() => ({}));

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Safaricom C2B Confirmation payload uses these fields
    const receipt = payload.TransID ?? payload.MpesaReceiptNumber ?? crypto.randomUUID();
    const amount = Number(payload.TransAmount ?? payload.Amount ?? 0);
    const phone = String(payload.MSISDN ?? payload.PhoneNumber ?? "");
    const accountRef = String(payload.BillRefNumber ?? payload.AccountReference ?? "").trim();
    const shortcode = String(payload.BusinessShortCode ?? "");

    let schoolId = schoolHint;
    if (!schoolId && shortcode) {
      const { data } = await admin.from("mpesa_config").select("school_id").eq("shortcode", shortcode).maybeSingle();
      schoolId = data?.school_id ?? null;
    }
    if (!schoolId) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted (no school)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try match by admission_number = accountRef
    let matchedStudentId: string | null = null;
    let matchedInvoiceId: string | null = null;
    let status = "unmatched";
    if (accountRef) {
      const { data: student } = await admin.from("students").select("id").eq("school_id", schoolId).eq("admission_number", accountRef).maybeSingle();
      if (student) {
        matchedStudentId = student.id;
        const { data: inv } = await admin.from("invoices").select("id, amount, paid_amount, status")
          .eq("school_id", schoolId).eq("student_id", student.id)
          .neq("status", "paid").order("due_date", { ascending: true }).limit(1).maybeSingle();
        if (inv) {
          matchedInvoiceId = inv.id;
          const newPaid = Number(inv.paid_amount ?? 0) + amount;
          const newStatus = newPaid >= Number(inv.amount) ? "paid" : "partial";
          await admin.from("invoices").update({ paid_amount: newPaid, status: newStatus }).eq("id", inv.id);
        }
        status = "matched";
      }
    }

    await admin.from("mpesa_transactions").upsert({
      school_id: schoolId,
      mpesa_receipt: receipt,
      transaction_type: payload.TransactionType ?? "Pay Bill",
      transaction_time: new Date().toISOString(),
      amount,
      phone,
      account_reference: accountRef,
      bill_ref_number: payload.BillRefNumber ?? null,
      org_account_balance: payload.OrgAccountBalance ? Number(payload.OrgAccountBalance) : null,
      first_name: payload.FirstName ?? null,
      middle_name: payload.MiddleName ?? null,
      last_name: payload.LastName ?? null,
      matched_student_id: matchedStudentId,
      matched_invoice_id: matchedInvoiceId,
      status,
      raw_payload: payload,
    }, { onConflict: "school_id,mpesa_receipt" });

    // SMS receipt: TODO — hook into SMS provider when configured
    console.log(`[mpesa-c2b] receipt=${receipt} amount=${amount} ref=${accountRef} status=${status}`);

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mpesa-c2b error", e);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted with error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});