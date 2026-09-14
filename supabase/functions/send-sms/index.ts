// send-sms — internal SMS primitive (Africa's Talking).
//
// verify_jwt: false. Requires the internal shared secret.
// Env: MESSAGING_DRY_RUN, ZENITH_INTERNAL_SECRET,
//      AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME, AFRICASTALKING_SENDER_ID

import { adminClient, authErrorResponse, requireInternalSecret } from "../_shared/auth.ts";
import {
  corsHeaders, jsonResponse, isDryRun, markDryRun, markFailed, markSent,
  normalizePhone, readBody, updateMessageStatus,
} from "../_shared/messaging.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let messageId: string | null = null;
  try {
    requireInternalSecret(req);
    const { tenant_id, recipient_phone, body, message_id } = await req.json();
    messageId = message_id ?? null;
    if (!message_id) return jsonResponse({ error: "message_id required" }, 400);

    const admin = adminClient();
    const { data: msg } = await admin.from("messages").select("*").eq("id", message_id).maybeSingle();
    if (!msg) return jsonResponse({ error: "Message not found" }, 404);
    if (msg.status === "sent" || msg.status === "delivered") {
      return jsonResponse({ ok: true, idempotent: true });
    }

    const tenantId = tenant_id ?? msg.tenant_id;
    const phone = normalizePhone(recipient_phone ?? msg.recipient_phone ?? "");
    const text = body ?? msg.body;
    if (!phone) { await markFailed(message_id, "No recipient phone"); return jsonResponse({ ok: false, error: "No recipient phone" }, 400); }

    if (await isDryRun(tenantId)) {
      await markDryRun(message_id, "africastalking");
      console.log(`[send-sms] DRY RUN -> ${phone}: ${text}`);
      return jsonResponse({ ok: true, dry_run: true });
    }

    const apiKey = Deno.env.get("AFRICASTALKING_API_KEY");
    const username = Deno.env.get("AFRICASTALKING_USERNAME");
    if (!apiKey || !username) {
      await markFailed(message_id, "SMS provider not configured", "africastalking");
      return jsonResponse({ ok: false, error: "SMS provider not configured" }, 400);
    }

    await updateMessageStatus(message_id, { status: "sending" });

    const form = new URLSearchParams({ username, to: phone, message: text });
    const sender = Deno.env.get("AFRICASTALKING_SENDER_ID");
    if (sender) form.set("from", sender);

    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: { apiKey, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: form.toString(),
    });
    const data = await readBody(res);
    const recipient = data?.SMSMessageData?.Recipients?.[0];
    const ok = res.ok && recipient?.statusCode >= 100 && recipient?.statusCode < 200;

    if (ok) {
      const cost = Number(String(recipient.cost || "").split(" ")[1] || 0) || null;
      const currency = String(recipient.cost || "").split(" ")[0] || null;
      await markSent(message_id, "africastalking", recipient.messageId ?? null, cost, currency);
      return jsonResponse({ ok: true, provider_message_id: recipient.messageId });
    }
    const err = recipient?.status || data?.SMSMessageData?.Message || data?.__raw || `HTTP ${res.status}`;
    await markFailed(message_id, String(err), "africastalking");
    return jsonResponse({ ok: false, error: String(err) }, 502);
  } catch (e) {
    if (messageId) await markFailed(messageId, (e as Error).message).catch(() => {});
    return authErrorResponse(e, corsHeaders);
  }
});
