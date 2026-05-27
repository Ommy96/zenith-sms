// Shared AI service module — provider abstraction, caching, quotas, logging, streaming.
// Default provider: Anthropic Claude. Fallback: Lovable AI Gateway (Gemini/GPT-5).

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AiCallOptions {
  tenantId: string;
  userId?: string | null;
  feature: string;            // e.g. "report_comment", "doc_gen", "copilot"
  system?: string;
  messages: ChatMessage[];    // user/assistant turns only
  model?: string;             // provider-prefixed: "anthropic:claude-sonnet-4-5" | "lovable:google/gemini-3-flash-preview"
  temperature?: number;
  maxTokens?: number;
  cache?: boolean;            // default true
  cacheContext?: string;      // extra string mixed into cache key (e.g. student id)
  stream?: boolean;           // when true, returns SSE stream Response directly
  requestMeta?: Record<string, unknown>;
}

export interface AiCallResult {
  text: string;
  provider: "anthropic" | "lovable";
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  cacheHit: boolean;
  latencyMs: number;
}

// ---------- Pricing (USD per 1M tokens) — adjust as needed ----------
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-5": { in: 3.0, out: 15.0 },
  "claude-3-5-sonnet-latest": { in: 3.0, out: 15.0 },
  "claude-3-5-haiku-latest": { in: 0.8, out: 4.0 },
  // Lovable AI gateway models (approximate)
  "google/gemini-3-flash-preview": { in: 0.075, out: 0.3 },
  "google/gemini-2.5-flash": { in: 0.075, out: 0.3 },
  "openai/gpt-5-mini": { in: 0.25, out: 2.0 },
};

function estimateCost(model: string, inT: number, outT: number) {
  const p = PRICING[model] ?? { in: 1, out: 3 };
  return +((inT * p.in + outT * p.out) / 1_000_000).toFixed(6);
}

// ---------- SHA-256 cache key ----------
async function sha256(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Supabase service client ----------
function svc(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

// ---------- Provider dispatch ----------
function resolveProvider(model?: string): { provider: "anthropic" | "lovable"; model: string } {
  // Explicit override
  if (model?.startsWith("anthropic:")) return { provider: "anthropic", model: model.slice(10) };
  if (model?.startsWith("lovable:"))   return { provider: "lovable",   model: model.slice(8) };

  // Default: Anthropic if key is set, otherwise Lovable.
  const hasAnthropic = !!Deno.env.get("ANTHROPIC_API_KEY");
  if (hasAnthropic) return { provider: "anthropic", model: model ?? "claude-sonnet-4-5" };
  return { provider: "lovable", model: model ?? "google/gemini-3-flash-preview" };
}

// ---------- Anthropic call (non-streaming) ----------
async function callAnthropic(opts: {
  model: string; system?: string; messages: ChatMessage[]; temperature?: number; maxTokens?: number;
}): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages: opts.messages.filter((m) => m.role !== "system"),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = (data.content ?? []).map((c: any) => c.text ?? "").join("");
  return {
    text,
    promptTokens: data.usage?.input_tokens ?? 0,
    completionTokens: data.usage?.output_tokens ?? 0,
  };
}

// ---------- Lovable AI call (non-streaming, OpenAI-compatible) ----------
async function callLovable(opts: {
  model: string; system?: string; messages: ChatMessage[]; temperature?: number; maxTokens?: number;
}): Promise<{ text: string; promptTokens: number; completionTokens: number }> {
  const msgs: ChatMessage[] = opts.system
    ? [{ role: "system", content: opts.system }, ...opts.messages]
    : opts.messages;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: msgs,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Lovable AI ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };
}

// ---------- Quota check ----------
export async function checkQuota(tenantId: string): Promise<{ state: "ok" | "soft_alert" | "hard_stop"; info: any }> {
  const s = svc();
  const { data, error } = await s.rpc("ai_check_quota", { _tenant: tenantId });
  if (error) throw error;
  return { state: data.state, info: data };
}

// ---------- Main entry: non-streaming ----------
export async function aiCall(opts: AiCallOptions): Promise<AiCallResult> {
  const start = Date.now();
  const s = svc();

  // 1. Quota
  const quota = await checkQuota(opts.tenantId);
  if (quota.state === "hard_stop") {
    await s.from("ai_usage_logs").insert({
      tenant_id: opts.tenantId, user_id: opts.userId ?? null, feature: opts.feature,
      provider: "system", model: "n/a", status: "quota_blocked",
      error_message: "Monthly quota or cost cap reached",
      request_meta: opts.requestMeta ?? null,
    });
    throw new Error("AI_QUOTA_EXCEEDED");
  }

  const { provider, model } = resolveProvider(opts.model);

  // 2. Cache lookup
  const useCache = opts.cache !== false;
  let cacheKey = "";
  if (useCache) {
    cacheKey = await sha256([
      opts.feature, provider, model,
      opts.system ?? "",
      JSON.stringify(opts.messages),
      opts.cacheContext ?? "",
    ].join("|"));
    const { data: hit } = await s
      .from("ai_cache")
      .select("response_text, prompt_tokens, completion_tokens, provider, model, expires_at, id")
      .eq("tenant_id", opts.tenantId).eq("feature", opts.feature).eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString()).maybeSingle();
    if (hit) {
      await s.from("ai_cache").update({ hit_count: (hit as any).hit_count != null ? undefined : undefined }).eq("id", (hit as any).id);
      // increment via rpc-less update:
      await s.rpc("ai_check_quota", { _tenant: opts.tenantId }); // no-op; we'll just log
      await s.from("ai_usage_logs").insert({
        tenant_id: opts.tenantId, user_id: opts.userId ?? null, feature: opts.feature,
        provider, model, cache_hit: true, status: "success",
        prompt_tokens: hit.prompt_tokens, completion_tokens: hit.completion_tokens, cost_usd: 0,
        latency_ms: Date.now() - start, request_meta: opts.requestMeta ?? null,
      });
      return {
        text: hit.response_text ?? "", provider, model,
        promptTokens: hit.prompt_tokens, completionTokens: hit.completion_tokens,
        costUsd: 0, cacheHit: true, latencyMs: Date.now() - start,
      };
    }
  }

  // 3. Provider call with fallback
  let result: { text: string; promptTokens: number; completionTokens: number };
  let usedProvider: "anthropic" | "lovable" = provider;
  let usedModel = model;
  try {
    if (provider === "anthropic") {
      result = await callAnthropic({ ...opts, model });
    } else {
      result = await callLovable({ ...opts, model });
    }
  } catch (err) {
    // Fallback to Lovable if Anthropic failed and fallback is available
    if (provider === "anthropic" && Deno.env.get("LOVABLE_API_KEY")) {
      console.warn("Anthropic failed, falling back to Lovable AI:", err);
      usedProvider = "lovable";
      usedModel = "google/gemini-3-flash-preview";
      result = await callLovable({ ...opts, model: usedModel });
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      await s.from("ai_usage_logs").insert({
        tenant_id: opts.tenantId, user_id: opts.userId ?? null, feature: opts.feature,
        provider, model, status: "error", error_message: msg,
        latency_ms: Date.now() - start, request_meta: opts.requestMeta ?? null,
      });
      throw err;
    }
  }

  const cost = estimateCost(usedModel, result.promptTokens, result.completionTokens);

  // 4. Cache write
  if (useCache && cacheKey) {
    await s.from("ai_cache").upsert({
      tenant_id: opts.tenantId, feature: opts.feature, cache_key: cacheKey,
      provider: usedProvider, model: usedModel,
      response_text: result.text,
      prompt_tokens: result.promptTokens, completion_tokens: result.completionTokens,
    }, { onConflict: "tenant_id,feature,cache_key" });
  }

  // 5. Log usage
  await s.from("ai_usage_logs").insert({
    tenant_id: opts.tenantId, user_id: opts.userId ?? null, feature: opts.feature,
    provider: usedProvider, model: usedModel,
    prompt_tokens: result.promptTokens, completion_tokens: result.completionTokens,
    cost_usd: cost, latency_ms: Date.now() - start, status: "success", cache_hit: false,
    request_meta: opts.requestMeta ?? null,
  });

  return {
    text: result.text, provider: usedProvider, model: usedModel,
    promptTokens: result.promptTokens, completionTokens: result.completionTokens,
    costUsd: cost, cacheHit: false, latencyMs: Date.now() - start,
  };
}

// ---------- Streaming (SSE) ----------
// Returns a Response with text/event-stream. Each event is `data: <token>\n\n`.
// Terminated by `data: [DONE]\n\n`. Caller is responsible for tenant auth.
export async function aiStream(opts: AiCallOptions, corsHeaders: Record<string, string>): Promise<Response> {
  const s = svc();
  const quota = await checkQuota(opts.tenantId);
  if (quota.state === "hard_stop") {
    return new Response(JSON.stringify({ error: "AI_QUOTA_EXCEEDED", quota: quota.info }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { provider, model } = resolveProvider(opts.model);
  const start = Date.now();
  let upstream: Response;

  if (provider === "anthropic") {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model, max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.7,
        system: opts.system, stream: true,
        messages: opts.messages.filter((m) => m.role !== "system"),
      }),
    });
  } else {
    const msgs: ChatMessage[] = opts.system
      ? [{ role: "system", content: opts.system }, ...opts.messages]
      : opts.messages;
    upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`,
      },
      body: JSON.stringify({
        model, messages: msgs, stream: true,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1024,
      }),
    });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text();
    return new Response(JSON.stringify({ error: errText }), {
      status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Normalise both providers into plain `data: <delta>` SSE events for the client.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let collected = "";
  let promptTokens = 0;
  let completionTokens = 0;

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
        controller.close();
        // Log usage async (fire-and-forget)
        const cost = estimateCost(model, promptTokens, completionTokens);
        s.from("ai_usage_logs").insert({
          tenant_id: opts.tenantId, user_id: opts.userId ?? null, feature: opts.feature,
          provider, model,
          prompt_tokens: promptTokens, completion_tokens: completionTokens,
          cost_usd: cost, latency_ms: Date.now() - start, status: "success",
          request_meta: opts.requestMeta ?? null,
        }).then(() => {});
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          let delta = "";
          if (provider === "anthropic") {
            if (evt.type === "content_block_delta") delta = evt.delta?.text ?? "";
            if (evt.type === "message_start") promptTokens = evt.message?.usage?.input_tokens ?? 0;
            if (evt.type === "message_delta") completionTokens = evt.usage?.output_tokens ?? completionTokens;
          } else {
            delta = evt.choices?.[0]?.delta?.content ?? "";
            if (evt.usage) {
              promptTokens = evt.usage.prompt_tokens ?? promptTokens;
              completionTokens = evt.usage.completion_tokens ?? completionTokens;
            }
          }
          if (delta) {
            collected += delta;
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }
        } catch { /* skip malformed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// ---------- Auth helper: validate JWT and resolve user + tenant ----------
export async function authedUser(req: Request): Promise<{ userId: string; jwt: string } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const jwt = auth.slice(7);
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return { userId: data.user.id, jwt };
}

// Verify the authenticated user is a member of the tenant (via SECURITY DEFINER RPC).
export async function userIsTenantMember(userId: string, tenantId: string): Promise<boolean> {
  const s = svc();
  const { data, error } = await s.rpc("is_tenant_member", { _tenant: tenantId, _user: userId });
  if (error) return false;
  return !!data;
}

// Render {{var}} placeholders.
export function renderTemplate(tpl: string, vars: Record<string, string | number | undefined | null>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

// Load a prompt template's active version (tenant override or system fallback).
export async function loadTemplate(slug: string, tenantId?: string) {
  const s = svc();
  let tplRow: any = null;
  if (tenantId) {
    const { data } = await s.from("ai_prompt_templates").select("*").eq("slug", slug).eq("tenant_id", tenantId).maybeSingle();
    if (data) tplRow = data;
  }
  if (!tplRow) {
    const { data } = await s.from("ai_prompt_templates").select("*").eq("slug", slug).is("tenant_id", null).maybeSingle();
    tplRow = data;
  }
  if (!tplRow) throw new Error(`Prompt template not found: ${slug}`);
  const { data: ver } = await s.from("ai_prompt_template_versions")
    .select("*").eq("template_id", tplRow.id).eq("version", tplRow.active_version).maybeSingle();
  if (!ver) throw new Error(`Template version not found for ${slug}`);
  return { template: tplRow, version: ver };
}