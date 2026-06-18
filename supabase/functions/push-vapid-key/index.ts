/**
 * Returns the VAPID public key so browsers can subscribe to push.
 * The PRIVATE key is read only by `push-send` and never leaves the server.
 */
// @ts-ignore Deno-style import
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// @ts-ignore Deno globals
declare const Deno: { env: { get(k: string): string | undefined } };

Deno.serve?.(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  if (!publicKey) {
    return new Response(JSON.stringify({ error: "VAPID_PUBLIC_KEY not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ publicKey }), {
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
});