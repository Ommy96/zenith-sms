// send-email — internal email primitive (Resend).
//
// verify_jwt: false. Requires the internal shared secret.
// Env: MESSAGING_DRY_RUN, ZENITH_INTERNAL_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL

import { adminClient, authErrorResponse, requireInternalSecret } from "../_shared/auth.ts";
import {
  corsHeaders, jsonResponse, isDryRun, markDryRun, markFailed, markSent,
  readBody, updateMessageStatus,
} from "../_shared/messaging.ts";

/** Fetch an attachment from private Storage and return base64 content. */
async function fetchAttachment(bucket: string, path: string, filename: string) {
  const { data, error } = await adminClient().storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Attachment ${path} unavailable`);
  const bytes = new Uint8Array(await data.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return { filename, content: btoa(binary) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let messageId: string | null = null;
  try {
    requireInternalSecret(req);
    const { tenant_id, recipient_email, subject, body, message_id } = await req.json();
    messageId = message_id ?? null;
    if (!message_id) return jsonResponse({ error: "message_id required" }, 400);

    const admin = adminClient();
    const { data: msg } = await admin.from("messages").select("*").eq("id", message_id).maybeSingle();
    if (!msg) return jsonResponse({ error: "Message not found" }, 404);
    if (msg.status === "sent" || msg.status === "delivered") return jsonResponse({ ok: true, idempotent: true });

    const tenantId = tenant_id ?? msg.tenant_id;
    const to = recipient_email ?? msg.recipient_email;
    const text = body ?? msg.body;
    if (!to) { await markFailed(message_id, "No recipient email"); return jsonResponse({ ok: false, error: "No recipient email" }, 400); }

    if (await isDryRun(tenantId)) {
      await markDryRun(message_id, "resend");
      console.log(`[send-email] DRY RUN -> ${to}: ${text.slice(0, 120)}`);
      return jsonResponse({ ok: true, dry_run: true });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM_EMAIL");
    if (!apiKey || !from) {
      await markFailed(message_id, "Email provider not configured", "resend");
      return jsonResponse({ ok: false, error: "Email provider not configured" }, 400);
    }

    await updateMessageStatus(message_id, { status: "sending" });

    // Attachments are declared on the message: metadata.attachments = [{bucket,path,filename}]
    const declared = (msg.metadata?.attachments ?? []) as any[];
    const attachments = [];
    for (const a of declared) {
      try { attachments.push(await fetchAttachment(a.bucket, a.path, a.filename)); }
      catch (e) { console.warn("[send-email] attachment skipped", (e as Error).message); }
    }

    const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111">${
      String(text).replace(/\n/g, "<br>")}</div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: subject ?? msg.subject ?? "Message from your school",
        html,
        text,
        ...(attachments.length ? { attachments } : {}),
      }),
    });
    const data = await readBody(res);
    if (res.ok) {
      await markSent(message_id, "resend", data?.id ?? null);
      return jsonResponse({ ok: true, provider_message_id: data?.id });
    }
    const err = data?.message || data?.error || data?.__raw || `HTTP ${res.status}`;
    await markFailed(message_id, String(err), "resend");
    return jsonResponse({ ok: false, error: String(err) }, 502);
  } catch (e) {
    if (messageId) await markFailed(messageId, (e as Error).message).catch(() => {});
    return authErrorResponse(e, corsHeaders);
  }
});
