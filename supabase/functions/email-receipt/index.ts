// email-receipt — email a fee receipt PDF to a guardian (or an override address).
//
// Inputs: { receipt_id: uuid, override_email?: string }
// Auth:   tenant member with fees.view (+ fees.email_receipt), OR a guardian of
//         the student on the receipt (parent portal "Email me a copy"), OR an
//         internal service-role caller (auto-email on payment confirmation).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAuth, EdgeAuthError } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jr = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function b64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
    const isInternal = authHeader === `Bearer ${service}`;
    const auth = isInternal ? null : await requireAuth(req);
    const admin = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const receiptId = body?.receipt_id as string | undefined;
    const overrideEmail = (body?.override_email as string | undefined)?.trim() || null;
    if (!receiptId) return jr({ error: "receipt_id required" }, 400);
    if (overrideEmail && !EMAIL_RE.test(overrideEmail)) return jr({ error: "Invalid email address" }, 400);

    const { data: receipt } = await admin
      .from("student_receipts").select("*").eq("id", receiptId).maybeSingle();
    if (!receipt) return jr({ error: "Receipt not found" }, 404);

    const { data: payment } = await admin
      .from("student_payments").select("*").eq("id", receipt.payment_id).maybeSingle();
    if (!payment) return jr({ error: "Payment missing" }, 404);

    const { data: guardianLinks } = await admin
      .from("student_guardians")
      .select("is_primary_contact, guardian:guardian_id(full_name, email, portal_user_id)")
      .eq("student_id", payment.student_id);
    const links = (guardianLinks || []) as any[];
    const primary = links.find((l) => l.is_primary_contact)?.guardian || links[0]?.guardian || null;

    // ---- authorize -------------------------------------------------------
    if (!isInternal) {
      const a = auth!;
      const inTenant = a.isSuperAdmin || a.tenantIds.includes(receipt.tenant_id);
      const isStaff = a.isSuperAdmin
        || a.roles.some((r) => ["school_admin", "principal", "bursar", "finance"].includes(r))
        || (a.permissions.includes("fees.view") && a.permissions.includes("fees.email_receipt"));
      const isGuardian = links.some((l) => l.guardian?.portal_user_id === a.userId);
      if (!(isStaff && inTenant) && !isGuardian) return jr({ error: "Forbidden" }, 403);
      // Guardians may only send to their own address on file.
      if (!isStaff && overrideEmail) return jr({ error: "Forbidden: cannot override recipient" }, 403);
    }

    const to = overrideEmail || primary?.email || null;
    if (!to) return jr({ error: "No email on file for this guardian", code: "no_email" }, 400);

    // ---- ensure the PDF exists ------------------------------------------
    let path: string | null = receipt.pdf_url;
    if (!path) {
      const res = await fetch(`${url}/functions/v1/generate-receipt-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
        body: JSON.stringify({ receipt_id: receipt.id }),
      });
      const j = await res.json().catch(() => ({}));
      path = j?.path || null;
    }
    if (!path) return jr({ error: "Receipt PDF unavailable" }, 500);

    const { data: file, error: dlErr } = await admin.storage.from("receipts").download(path);
    if (dlErr || !file) return jr({ error: "Could not read receipt PDF" }, 500);
    const pdfB64 = b64(new Uint8Array(await (file as Blob).arrayBuffer()));

    const [{ data: tenant }, { data: student }] = await Promise.all([
      admin.from("tenants").select("name, currency_code, locale").eq("id", receipt.tenant_id).maybeSingle(),
      admin.from("students").select("first_name, last_name, admission_number").eq("id", payment.student_id).maybeSingle(),
    ]);
    const studentName = [student?.first_name, student?.last_name].filter(Boolean).join(" ") || "your child";
    const currency = tenant?.currency_code || "KES";
    const amount = `${currency} ${Number(payment.amount || 0).toLocaleString()}`;
    const isSw = (tenant?.locale || "").toLowerCase().startsWith("sw");

    const subject = isSw
      ? `Risiti ya Ada ${receipt.receipt_number} — ${studentName}`
      : `Fee Receipt ${receipt.receipt_number} — ${studentName}`;
    const bodyText = isSw
      ? `Habari ${primary?.full_name || ""},\n\n${tenant?.name || "Shule"} imepokea malipo ya ${amount} kwa ${studentName}.\nNambari ya risiti: ${receipt.receipt_number}\n\nTafadhali pata risiti rasmi iliyoambatishwa.\n\n${tenant?.name || ""}`
      : `Dear ${primary?.full_name || "Parent/Guardian"},\n\n${tenant?.name || "The school"} has received a payment of ${amount} for ${studentName}.\nReceipt number: ${receipt.receipt_number}\n\nPlease find attached your official receipt.\n\n${tenant?.name || ""}`;

    // ---- queue the message row, then hand off to send-email --------------
    const { data: msg, error: mErr } = await admin.from("messages").insert({
      tenant_id: receipt.tenant_id,
      channel: "email",
      direction: "outbound",
      status: "queued",
      recipient_type: "guardian",
      recipient_address: to,
      recipient_name: primary?.full_name || null,
      student_id: payment.student_id,
      receipt_id: receipt.id,
      subject,
      body: bodyText,
      sender_user_id: auth?.userId || null,
      metadata: { receipt_number: receipt.receipt_number, payment_id: payment.id },
    }).select("id").single();
    if (mErr || !msg) return jr({ error: mErr?.message || "Could not queue message" }, 500);

    const sendRes = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: { Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message_id: msg.id,
        attachments: [{ filename: `Receipt_${receipt.receipt_number}.pdf`, content: pdfB64 }],
      }),
    });
    const sendJson = await sendRes.json().catch(() => ({}));
    if (!sendRes.ok || sendJson?.error) {
      return jr({ error: sendJson?.error?.message || sendJson?.error || "Email send failed", message_id: msg.id }, 502);
    }

    return jr({ ok: true, message_id: msg.id, to });
  } catch (e) {
    if (e instanceof EdgeAuthError) return jr({ error: e.message }, e.status);
    console.error("email-receipt error", e);
    return jr({ error: String((e as Error).message || e) }, 500);
  }
});
