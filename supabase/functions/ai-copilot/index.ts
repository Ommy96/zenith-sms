// Natural-language Q&A about school data. Skeleton: no tool use yet.
import { authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { query, context, tenant_id } = await req.json();
    if (!query) return jsonResponse({ error: "query required" }, 400);
    const tenantId = tenant_id ?? user.tenantIds[0];
    if (!user.isSuperAdmin) requirePermission(user, tenantId, "ai.use");

    const result = await callAnthropic({
      tenantId,
      userId: user.userId,
      functionName: "ai-copilot",
      purpose: "copilot_query",
      system:
        "You are Zenith Copilot, an assistant for school administrators. Answer concisely. " +
        "If a question needs live school data you were not given, say what report or page would show it.",
      prompt: context ? `${query}\n\nContext:\n${JSON.stringify(context)}` : query,
      maxTokens: 1500,
    });

    return jsonResponse({ ok: true, answer: result.text, model: result.model });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
