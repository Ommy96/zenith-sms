// Generic model proxy used as the copilot's fallback path. Admin only.
import { authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { prompt, model, max_tokens, system, tenant_id } = await req.json();
    if (!prompt) return jsonResponse({ error: "prompt required" }, 400);
    const tenantId = tenant_id ?? user.tenantIds[0];
    if (!user.isSuperAdmin) requirePermission(user, tenantId, "ai.admin");

    const result = await callAnthropic({
      tenantId,
      userId: user.userId,
      functionName: "ai-invoke",
      purpose: "generic_proxy",
      system,
      prompt,
      model,
      maxTokens: Math.min(Number(max_tokens) || 1024, 4096),
    });

    return jsonResponse({
      ok: true,
      text: result.text,
      model: result.model,
      usage: { input_tokens: result.inputTokens, output_tokens: result.outputTokens },
    });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
