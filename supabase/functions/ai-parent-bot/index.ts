// Parent Q&A. Dual caller: signed-in staff preview, or the WhatsApp webhook
// using the internal shared secret.
import { adminClient, authedUser, requireInternalSecret, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { message, guardian_phone, tenant_id } = body ?? {};
    if (!message) return jsonResponse({ error: "message required" }, 400);

    let tenantId = tenant_id ?? null;
    let userId: string | null = null;
    let internal = false;
    try {
      requireInternalSecret(req);
      internal = true;
    } catch (_e) {
      const user = await authedUser(req);
      userId = user.userId;
      tenantId = tenantId ?? user.tenantIds[0];
    }
    if (internal && !tenantId) return jsonResponse({ error: "tenant_id required" }, 400);

    const admin = adminClient();
    const { data: tenant } = await admin.from("tenants").select("name, default_language, currency_code")
      .eq("id", tenantId).maybeSingle();

    const result = await callAnthropic({
      tenantId,
      userId,
      functionName: "ai-parent-bot",
      purpose: "parent_question",
      system:
        `You are a helpful school assistant for ${tenant?.name ?? "the school"}. ` +
        `Reply in ${tenant?.default_language ?? "English"}, in a warm and brief tone suitable for WhatsApp. ` +
        "Never invent fees, marks or dates: if you do not have the figure, tell the parent the school office will confirm.",
      prompt: `Answer this parent question: ${message}`,
      maxTokens: 600,
      metadata: { guardian_phone: guardian_phone ?? null, channel: internal ? "whatsapp" : "preview" },
    });

    return jsonResponse({ ok: true, reply: result.text });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
