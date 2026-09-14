// Shared Anthropic helpers for Zenith AI edge functions.
//
// Env vars: ANTHROPIC_API_KEY
// Every call is quota-checked and logged to public.ai_usage_logs.

import { adminClient, EdgeAuthError } from "./auth.ts";

export const DEFAULT_MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

// Monthly AI call allowance per plan. null = unlimited.
const PLAN_QUOTAS: Record<string, number | null> = {
  free: 100,
  starter: 1000,
  standard: 5000,
  pro: null,
  enterprise: null,
};

// Rough USD per million tokens for the default model family.
const INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-zenith-internal-key",
};

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function anthropicKey(): string {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new EdgeAuthError(500, "ANTHROPIC_API_KEY is not configured");
  return key;
}

/** Throws when the tenant has used up its monthly AI allowance. */
export async function assertQuota(tenantId: string | null | undefined) {
  if (!tenantId) return;
  const admin = adminClient();
  const { data: tenant } = await admin.from("tenants").select("*").eq("id", tenantId).maybeSingle();
  const plan = String(
    (tenant as Record<string, unknown> | null)?.plan ??
      (tenant as Record<string, unknown> | null)?.subscription_plan ??
      (tenant as Record<string, unknown> | null)?.tier ??
      "free",
  ).toLowerCase();
  const quota = plan in PLAN_QUOTAS ? PLAN_QUOTAS[plan] : PLAN_QUOTAS.free;
  if (quota === null) return;
  const { data: used } = await admin.rpc("ai_usage_this_month", { p_tenant_id: tenantId });
  if (typeof used === "number" && used >= quota) {
    throw new EdgeAuthError(
      429,
      `Monthly AI allowance reached for the ${plan} plan (${quota} requests). Upgrade the plan to continue.`,
    );
  }
}

export interface AiCallOptions {
  tenantId?: string | null;
  userId?: string | null;
  functionName: string;
  system?: string;
  prompt?: string;
  messages?: unknown[];
  model?: string;
  maxTokens?: number;
  purpose?: string;
  metadata?: Record<string, unknown>;
}

export interface AiCallResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  raw: Record<string, unknown>;
}

export async function logAiUsage(o: {
  tenantId?: string | null;
  userId?: string | null;
  functionName: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  purpose?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await adminClient().from("ai_usage_logs").insert({
      tenant_id: o.tenantId ?? null,
      user_id: o.userId ?? null,
      function_name: o.functionName,
      model: o.model ?? null,
      input_tokens: o.inputTokens ?? null,
      output_tokens: o.outputTokens ?? null,
      cost_usd: o.costUsd ?? null,
      purpose: o.purpose ?? null,
      metadata: o.metadata ?? {},
    });
  } catch (_e) {
    // Usage logging must never break the feature.
  }
}

/** Calls Anthropic, logs usage, and returns the text response. */
export async function callAnthropic(o: AiCallOptions): Promise<AiCallResult> {
  await assertQuota(o.tenantId);
  const model = o.model || DEFAULT_MODEL;
  const messages = o.messages ?? [{ role: "user", content: o.prompt ?? "" }];

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey(),
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: o.maxTokens ?? 1024,
      ...(o.system ? { system: o.system } : {}),
      messages,
    }),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    await logAiUsage({
      ...o,
      model,
      metadata: { ...(o.metadata ?? {}), error: raw?.error?.message ?? `HTTP ${res.status}` },
    });
    throw new EdgeAuthError(
      res.status === 429 ? 429 : 502,
      String(raw?.error?.message ?? `AI request failed (HTTP ${res.status})`),
    );
  }

  const text = Array.isArray(raw?.content)
    ? raw.content.filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n")
    : "";
  const inputTokens = Number(raw?.usage?.input_tokens ?? 0);
  const outputTokens = Number(raw?.usage?.output_tokens ?? 0);
  const costUsd = inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;

  await logAiUsage({
    tenantId: o.tenantId,
    userId: o.userId,
    functionName: o.functionName,
    model,
    inputTokens,
    outputTokens,
    costUsd,
    purpose: o.purpose,
    metadata: o.metadata,
  });

  return { text, model, inputTokens, outputTokens, costUsd, raw };
}

/** Streams an Anthropic response as SSE and logs usage when it completes. */
export async function streamAnthropic(o: AiCallOptions): Promise<Response> {
  await assertQuota(o.tenantId);
  const model = o.model || DEFAULT_MODEL;
  const messages = o.messages ?? [{ role: "user", content: o.prompt ?? "" }];

  const upstream = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey(),
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: o.maxTokens ?? 1024,
      stream: true,
      ...(o.system ? { system: o.system } : {}),
      messages,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const raw = await upstream.json().catch(() => ({}));
    throw new EdgeAuthError(502, String(raw?.error?.message ?? `AI request failed (HTTP ${upstream.status})`));
  }

  let inputTokens = 0;
  let outputTokens = 0;
  const decoder = new TextDecoder();

  const stream = new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      for (const line of text.split("\n")) {
        if (!line.startsWith("data:")) continue;
        try {
          const evt = JSON.parse(line.slice(5).trim());
          if (evt?.message?.usage?.input_tokens) inputTokens = evt.message.usage.input_tokens;
          if (evt?.usage?.output_tokens) outputTokens = evt.usage.output_tokens;
        } catch (_e) { /* partial frame */ }
      }
      controller.enqueue(chunk);
    },
    flush() {
      logAiUsage({
        tenantId: o.tenantId,
        userId: o.userId,
        functionName: o.functionName,
        model,
        inputTokens,
        outputTokens,
        costUsd: inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN,
        purpose: o.purpose,
        metadata: o.metadata,
      });
    },
  });

  return new Response(upstream.body.pipeThrough(stream), {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
