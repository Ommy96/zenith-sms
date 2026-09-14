// Messaging helpers shared by the send-* and dispatch functions.
//
// Env vars:
//   MESSAGING_DRY_RUN — 'true' (default) means never call external providers.

import { adminClient } from "./auth.ts";

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

/** Substitute {{variable}} placeholders. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key) => vars[key] ?? "");
}

/** Normalise a phone number to E.164 (Kenya default). */
export function normalizePhone(input: string): string {
  const x = (input || "").replace(/[^\d+]/g, "");
  if (x.startsWith("+")) return x;
  if (x.startsWith("0")) return "+254" + x.slice(1);
  if (x.startsWith("254")) return "+" + x;
  if (x.length === 9) return "+254" + x;
  return "+" + x;
}

/** Global or per-tenant dry-run flag. Defaults to true (safe). */
export async function isDryRun(tenantId: string | null): Promise<boolean> {
  const global = (Deno.env.get("MESSAGING_DRY_RUN") ?? "true").toLowerCase();
  if (global !== "false") return true;
  if (!tenantId) return false;
  const { data } = await adminClient()
    .from("tenant_settings").select("value").eq("tenant_id", tenantId)
    .eq("key", "messaging.dry_run").maybeSingle();
  const v = (data?.value as any);
  return v === true || v === "true" || v?.enabled === true;
}

export async function logQueuedMessage(params: {
  tenantId: string;
  channel: string;
  body: string;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  recipientType?: string | null;
  recipientId?: string | null;
  studentId?: string | null;
  subject?: string | null;
  templateKey?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  receiptId?: string | null;
  senderUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await adminClient().from("messages").insert({
    tenant_id: params.tenantId,
    channel: params.channel,
    direction: "outbound",
    status: "queued",
    body: params.body,
    recipient_phone: params.recipientPhone ?? null,
    recipient_email: params.recipientEmail ?? null,
    recipient_name: params.recipientName ?? null,
    recipient_type: params.recipientType ?? null,
    recipient_id: params.recipientId ?? null,
    student_id: params.studentId ?? null,
    subject: params.subject ?? null,
    template_key: params.templateKey ?? null,
    related_entity_type: params.relatedEntityType ?? null,
    related_entity_id: params.relatedEntityId ?? null,
    receipt_id: params.receiptId ?? null,
    sender_user_id: params.senderUserId ?? null,
    metadata: params.metadata ?? {},
  }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateMessageStatus(
  messageId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await adminClient().from("messages").update(patch).eq("id", messageId);
}

export async function markSent(messageId: string, provider: string, providerMessageId: string | null, cost?: number | null, currency?: string | null) {
  await updateMessageStatus(messageId, {
    status: "sent", sent_at: new Date().toISOString(), failed_at: null, error: null,
    provider, provider_message_id: providerMessageId,
    cost: cost ?? null, cost_currency: currency ?? null,
  });
}

export async function markFailed(messageId: string, error: string, provider?: string) {
  await updateMessageStatus(messageId, {
    status: "failed", failed_at: new Date().toISOString(),
    error: String(error).slice(0, 500), ...(provider ? { provider } : {}),
  });
}

export async function markDryRun(messageId: string, provider: string) {
  await updateMessageStatus(messageId, {
    status: "dry_run", sent_at: new Date().toISOString(), provider, error: null,
  });
}

export async function readBody(res: Response): Promise<any> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { __raw: text }; }
}

/** Call another edge function with the internal shared secret. */
export async function callInternal(fn: string, payload: unknown): Promise<Response> {
  return await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "x-zenith-internal-key": Deno.env.get("ZENITH_INTERNAL_SECRET") ?? "",
    },
    body: JSON.stringify(payload),
  });
}
