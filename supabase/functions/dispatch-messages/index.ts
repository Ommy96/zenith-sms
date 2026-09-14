// dispatch-messages — drains the queued message outbox. Runs every minute via cron.
//
// verify_jwt: false. Requires the internal shared secret.
// Env: ZENITH_INTERNAL_SECRET

import { adminClient, authErrorResponse, requireInternalSecret } from "../_shared/auth.ts";
import { callInternal, corsHeaders, jsonResponse, readBody } from "../_shared/messaging.ts";

const FN_BY_CHANNEL: Record<string, string> = {
  sms: "send-sms",
  whatsapp: "send-whatsapp",
  email: "send-email",
};
const MAX_RETRIES = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    requireInternalSecret(req);
    const admin = adminClient();
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body?.limit) || 100, 200);
    const nowIso = new Date().toISOString();

    const { data: due, error } = await admin
      .from("messages")
      .select("id, channel, tenant_id, retry_count")
      .eq("status", "queued")
      .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) return jsonResponse({ error: error.message }, 500);
    const rows = due ?? [];
    if (!rows.length) return jsonResponse({ processed: 0, sent: 0 });

    const results = await Promise.allSettled(rows.map(async (m: any) => {
      const fn = FN_BY_CHANNEL[m.channel];
      if (!fn) {
        await admin.from("messages").update({
          status: "failed", failed_at: new Date().toISOString(),
          error: `Unsupported channel ${m.channel}`,
        }).eq("id", m.id);
        return false;
      }
      let ok = false;
      let errText = "Dispatch failed";
      try {
        const res = await callInternal(fn, { message_id: m.id, tenant_id: m.tenant_id });
        const data = await readBody(res);
        ok = res.ok && data?.ok !== false;
        if (!ok) errText = String(data?.error ?? data?.__raw ?? `HTTP ${res.status}`);
      } catch (e) {
        errText = (e as Error).message;
      }
      if (!ok) {
        const retry = (m.retry_count ?? 0) + 1;
        const { data: cur } = await admin.from("messages").select("status").eq("id", m.id).maybeSingle();
        const patch: Record<string, unknown> = { retry_count: retry };
        if (cur?.status !== "sent" && cur?.status !== "dry_run") {
          patch.status = retry >= MAX_RETRIES ? "failed" : "queued";
          patch.failed_at = new Date().toISOString();
          patch.error = errText.slice(0, 500);
        }
        await admin.from("messages").update(patch).eq("id", m.id);
      }
      return ok;
    }));

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
    return jsonResponse({ processed: rows.length, sent });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
