// Generic AI invoke endpoint. Accepts a structured request and dispatches via the shared AI service.
// Used by client features when a feature doesn't have its own dedicated endpoint.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  aiCall, aiStream, authedUser, userIsTenantMember, loadTemplate, renderTemplate,
  type ChatMessage,
} from "../_shared/ai-service.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await authedUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const {
      tenantId, feature, system, messages, model, temperature, maxTokens,
      stream = false, cache, cacheContext,
      templateSlug, templateVars, prompt,
    } = body ?? {};

    if (!tenantId || !feature) return json({ error: "tenantId and feature required" }, 400);
    const ok = await userIsTenantMember(user.userId, tenantId);
    if (!ok) return json({ error: "Forbidden" }, 403);

    // Build messages from template OR explicit messages OR plain prompt
    let sysPrompt = system as string | undefined;
    let chatMessages: ChatMessage[] = [];

    if (templateSlug) {
      const { version } = await loadTemplate(templateSlug, tenantId);
      sysPrompt = version.system_prompt ? renderTemplate(version.system_prompt, templateVars ?? {}) : sysPrompt;
      const rendered = renderTemplate(version.user_prompt, templateVars ?? {});
      chatMessages = [{ role: "user", content: rendered }];
    } else if (Array.isArray(messages) && messages.length) {
      chatMessages = messages;
    } else if (typeof prompt === "string") {
      chatMessages = [{ role: "user", content: prompt }];
    } else {
      return json({ error: "Provide templateSlug, messages, or prompt" }, 400);
    }

    const opts = {
      tenantId, userId: user.userId, feature,
      system: sysPrompt, messages: chatMessages,
      model, temperature, maxTokens, cache, cacheContext,
      requestMeta: { templateSlug, hasVars: !!templateVars },
    };

    if (stream) {
      return await aiStream(opts, corsHeaders);
    }
    const result = await aiCall(opts);
    return json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = msg === "AI_QUOTA_EXCEEDED" ? 429 : 500;
    return json({ error: msg }, code);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}