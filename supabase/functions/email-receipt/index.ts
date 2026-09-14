// email-receipt — queues a fee receipt email with the PDF attached.
//
// verify_jwt: true. Staff or the linked parent may send it; the PDF is
// generated first if it does not exist yet.

import { adminClient, authErrorResponse, authedUser } from "../_shared/auth.ts";
import { requireOwnsResource } from "../_shared/ownership.ts";
import { callInternal, corsHeaders, jsonResponse, logQueuedMessage, readBody, renderTemplate } from "../_shared/messaging.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { receipt_id, email } = await req.json();
    if (!receipt_id) return jsonResponse({ error: "receipt_id required" }, 400);

    const { tenantId, studentId } = await requireOwnsResource({
      user, resourceType: "receipt", resourceId: receipt_id, functionName: "email-receipt", req,
    });

    const admin = adminClient();
    const { data: receipt } = await admin.from("student_receipts")
      .select("*, students:student_id(first_name, last_name, email)").eq("id", receipt_id).maybeSingle();
    if (!receipt) return jsonResponse({ error: "Receipt not found" }, 404);

    // Make sure a PDF exists in storage.
    let storagePath = (receipt.metadata as any)?.storage_path as string | undefined;
    if (!storagePath) {
      const res = await callInternal("generate-receipt-pdf", { receipt_id });
      const data = await readBody(res);
      if (!res.ok || !data?.path) return jsonResponse({ error: "Could not prepare the receipt PDF" }, 502);
      storagePath = data.path;
    }

    // Recipient: explicit address, else primary guardian, else student.
    let to = email as string | undefined;
    let recipientName: string | null = null;
    let recipientId: string | null = null;
    if (!to) {
      const { data: link } = await admin.from("student_guardians")
        .select("guardian_id, is_primary_contact, guardians:guardian_id(full_name, email)")
        .eq("student_id", studentId).order("is_primary_contact", { ascending: false }).limit(1).maybeSingle();
      const g = (link as any)?.guardians;
      if (g?.email) { to = g.email; recipientName = g.full_name; recipientId = (link as any).guardian_id; }
    }
    if (!to) {
      const s = receipt.students as any;
      if (s?.email) { to = s.email; recipientName = `${s.first_name} ${s.last_name}`; recipientId = studentId; }
    }
    if (!to) return jsonResponse({ error: "No email address on file for this student" }, 400);

    const { data: tpl } = await admin.from("message_templates")
      .select("subject, body_template").eq("key", "payment_received").eq("language", "en")
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`).order("tenant_id", { nullsFirst: false })
      .limit(1).maybeSingle();

    const vars = {
      name: recipientName ?? "",
      receipt_number: receipt.receipt_number ?? "",
      amount: `${receipt.currency ?? "KES"} ${Number(receipt.amount).toLocaleString("en-KE")}`,
    };
    const body = renderTemplate(
      tpl?.body_template ?? "Dear {{name}}, we have received your payment of {{amount}}. Receipt {{receipt_number}} is attached.",
      vars,
    );

    const messageId = await logQueuedMessage({
      tenantId, channel: "email", body,
      subject: renderTemplate(tpl?.subject ?? "Fee receipt {{receipt_number}}", vars),
      recipientEmail: to, recipientName, recipientId,
      recipientType: recipientId === studentId ? "student" : "guardian",
      studentId, templateKey: "payment_received",
      relatedEntityType: "student_receipt", relatedEntityId: receipt_id,
      receiptId: receipt_id, senderUserId: user.userId,
      metadata: {
        attachments: [{
          bucket: "receipts", path: storagePath,
          filename: `${receipt.receipt_number ?? "receipt"}.pdf`.replace(/[^\w.-]/g, "-"),
        }],
      },
    });

    callInternal("send-email", { message_id: messageId, tenant_id: tenantId }).catch(() => {});
    return jsonResponse({ ok: true, message_id: messageId, recipient: to });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
