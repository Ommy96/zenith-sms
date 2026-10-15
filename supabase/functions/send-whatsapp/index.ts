// send-whatsapp — internal WhatsApp primitive (Meta Cloud API).
//
// verify_jwt: false. Requires the internal shared secret.
// Env: MESSAGING_DRY_RUN, ZENITH_INTERNAL_SECRET,
//      META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_NUMBER_ID

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
    const { tenant_id, recipient_phone, body, message_id, media, template } = await req.json();
    messageId = message_id ?? null;
    if (!message_id) return jsonResponse({ error: "message_id required" }, 400);

    const admin = adminClient();
    const { data: msg } = await admin.from("messages").select("*").eq("id", message_id).maybeSingle();
    if (!msg) return jsonResponse({ error: "Message not found" }, 404);
    if (msg.status === "sent" || msg.status === "delivered") return jsonResponse({ ok: true, idempotent: true });

    const tenantId = tenant_id ?? msg.tenant_id;
    const phone = normalizePhone(recipient_phone ?? msg.recipient_phone ?? "").replace("+", "");
    const text = body ?? msg.body;
    if (!phone) { await markFailed(message_id, "No recipient phone"); return jsonResponse({ ok: false, error: "No recipient phone" }, 400); }

    if (await isDryRun(tenantId)) {
      await markDryRun(message_id, "meta");
      console.log(`[send-whatsapp] DRY RUN -> ${phone}: ${text}`);
      return jsonResponse({ ok: true, dry_run: true });
    }

    const token = Deno.env.get("META_WHATSAPP_TOKEN") ?? Deno.env.get("WHATSAPP_API_KEY");
    const phoneNumberId = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID") ?? Deno.env.get("BUSINESS_PHONE_NUMBER_ID");
    if (!token || !phoneNumberId) {
      await markFailed(message_id, "WhatsApp not configured", "meta");
      return jsonResponse({ ok: false, error: "WhatsApp not configured" }, 400);
    }

    await updateMessageStatus(message_id, { status: "sending" });

    // Template messages: { name, language?, params?: string[] } — body params map to {{1}}, {{2}}…
    // Authentication templates also need the code repeated on the copy-code button.
    const tplPayload = template?.name ? {
      messaging_product: "whatsapp", to: phone, type: "template",
      template: {
        name: template.name, language: { code: template.language ?? "en" },
        components: [
          ...(template.params?.length ? [{ type: "body", parameters: template.params.map((t: string) => ({ type: "text", text: String(t) })) }] : []),
          ...(template.button_param ? [{ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: String(template.button_param) }] }] : []),
        ],
      },
    } : null;
    const payload = tplPayload ? tplPayload : media?.link
      ? { messaging_product: "whatsapp", to: phone, type: media.type ?? "document",
          [media.type ?? "document"]: { link: media.link, caption: text } }
      : { messaging_product: "whatsapp", to: phone, type: "text", text: { body: text } };

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await readBody(res);
    if (res.ok) {
      await markSent(message_id, "meta", data?.messages?.[0]?.id ?? null);
      return jsonResponse({ ok: true, provider_message_id: data?.messages?.[0]?.id });
    }
    const err = data?.error?.message || data?.__raw || `HTTP ${res.status}`;
    await markFailed(message_id, String(err), "meta");
    return jsonResponse({ ok: false, error: String(err), code: data?.error?.code ?? null }, 502);
  } catch (e) {
    if (messageId) await markFailed(messageId, (e as Error).message).catch(() => {});
    return authErrorResponse(e, corsHeaders);
  }
});
