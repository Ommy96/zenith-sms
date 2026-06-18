/**
 * Server-side dispatcher for web push.
 *
 * Body: { user_ids?: string[]; tenant_id?: string; title: string; body: string; url?: string; tag?: string }
 *
 * - Looks up `push_subscriptions` rows scoped to user_ids (and optional tenant_id).
 * - Signs and POSTs to each endpoint using VAPID.
 * - 410 / 404 responses prune dead subscriptions.
 *
 * Requires VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT secrets. If unset,
 * the function returns 503 so callers can surface a clear "push not configured"
 * message rather than failing silently.
 */
// @ts-ignore Deno-style imports
import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
// @ts-ignore - web-push has a Deno-compatible build via npm specifier
import webpush from "npm:web-push@3.6.7";

// @ts-ignore Deno globals
declare const Deno: { env: { get(k: string): string | undefined }; serve?: (h: (r: Request) => Promise<Response>) => void };

interface SendBody {
  user_ids?: string[];
  tenant_id?: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

Deno.serve?.(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY");
  const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@zenith.app";
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: "Push not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let payload: SendBody;
  try { payload = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }
  if (!payload?.title || !payload?.body) {
    return new Response(JSON.stringify({ error: "title and body required" }), { status: 400, headers: corsHeaders });
  }

  let q = supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (payload.user_ids?.length) q = q.in("user_ids", payload.user_ids as unknown as string);
  if (payload.user_ids?.length) q = supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", payload.user_ids);
  if (payload.tenant_id) q = q.eq("tenant_id", payload.tenant_id);

  const { data: subs, error } = await q;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

  const msg = JSON.stringify({
    title: payload.title, body: payload.body, url: payload.url, tag: payload.tag,
  });
  let sent = 0, pruned = 0;
  await Promise.all((subs || []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, msg);
      sent += 1;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", s.id);
        pruned += 1;
      }
    }
  }));

  return new Response(JSON.stringify({ sent, pruned, total: subs?.length ?? 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});