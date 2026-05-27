import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

function fmt(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string) {
  return (s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const tenant = url.searchParams.get("tenant");
    if (!tenant) return new Response("Missing tenant", { status: 400 });

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: events } = await supa.from("calendar_events").select("*")
      .eq("tenant_id", tenant).order("starts_at").limit(500);
    const { data: tenantRow } = await supa.from("tenants").select("name").eq("id", tenant).maybeSingle();

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Zenith//Calendar//EN",
      `X-WR-CALNAME:${esc(tenantRow?.name || "School")} Calendar`,
    ];
    for (const e of events || []) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${e.id}@zenith`);
      lines.push(`DTSTAMP:${fmt(new Date(e.created_at))}`);
      lines.push(`DTSTART:${fmt(new Date(e.starts_at))}`);
      lines.push(`DTEND:${fmt(new Date(e.ends_at))}`);
      lines.push(`SUMMARY:${esc(e.title)}`);
      if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
      if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");

    return new Response(lines.join("\r\n"), {
      headers: { ...corsHeaders, "Content-Type": "text/calendar; charset=utf-8" },
    });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});