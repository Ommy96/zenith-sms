import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

function fillTemplate(body: string, params: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { template_id, audience_type, audience_filter = {}, default_params = [] } = await req.json();
    if (!template_id || !audience_type) {
      return new Response(JSON.stringify({ error: "template_id and audience_type required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", claims.claims.sub).maybeSingle();
    const tenant_id = profile?.tenant_id;
    if (!tenant_id) return new Response(JSON.stringify({ error: "No school" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: tmpl } = await admin.from("whatsapp_templates").select("*").eq("id", template_id).eq("tenant_id", tenant_id).maybeSingle();
    if (!tmpl) return new Response(JSON.stringify({ error: "Template not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Resolve recipients
    let recipients: Array<{ student_id: string; phone: string; student_name: string }> = [];
    if (audience_type === "class" && audience_filter.class_id) {
      const { data: cls } = await admin.from("classes").select("name, grade_level").eq("id", audience_filter.class_id).maybeSingle();
      const grade = cls?.grade_level || cls?.name;
      const { data: students } = await admin.from("students").select("id, first_name, last_name, guardian_phone").eq("tenant_id", tenant_id).eq("grade", grade).eq("status", "active");
      recipients = (students || []).filter(s => s.guardian_phone).map(s => ({ student_id: s.id, phone: s.guardian_phone!, student_name: `${s.first_name} ${s.last_name}` }));
    } else if (audience_type === "defaulters") {
      const { data: invs } = await admin.from("invoices").select("student_id, students!inner(id, first_name, last_name, guardian_phone, tenant_id)").eq("students.tenant_id", tenant_id).in("status", ["pending", "partial", "unpaid"]);
      const seen = new Set<string>();
      for (const i of (invs as any[]) || []) {
        const s = i.students;
        if (s && s.guardian_phone && !seen.has(s.id)) {
          seen.add(s.id);
          recipients.push({ student_id: s.id, phone: s.guardian_phone, student_name: `${s.first_name} ${s.last_name}` });
        }
      }
    } else if (audience_type === "all_parents") {
      const { data: students } = await admin.from("students").select("id, first_name, last_name, guardian_phone").eq("tenant_id", tenant_id).eq("status", "active");
      recipients = (students || []).filter(s => s.guardian_phone).map(s => ({ student_id: s.id, phone: s.guardian_phone!, student_name: `${s.first_name} ${s.last_name}` }));
    }

    const { data: broadcast } = await admin.from("whatsapp_broadcasts").insert({
      tenant_id, template_id, audience_type, audience_filter,
      recipient_count: recipients.length, status: "running",
      created_by: claims.claims.sub, started_at: new Date().toISOString(),
    }).select().single();

    const { data: cfg } = await admin.from("whatsapp_config").select("*").eq("tenant_id", tenant_id).maybeSingle();
    if (!cfg?.phone_number_id || !cfg?.access_token) {
      await admin.from("whatsapp_broadcasts").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", broadcast!.id);
      return new Response(JSON.stringify({ error: "WhatsApp not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sent = 0, failed = 0;
    const today = new Date().toISOString().slice(0, 10);
    let sentToday = cfg.last_reset_date === today ? cfg.messages_sent_today : 0;

    for (const r of recipients) {
      if (sentToday >= cfg.daily_message_limit) { failed++; continue; }
      // Substitute placeholders: index 0 (student name) auto-filled if labels first is student_name
      const params = [...default_params];
      const labels: string[] = (tmpl.placeholder_labels as any) || [];
      labels.forEach((label, idx) => {
        if (label === "student_name") params[idx] = r.student_name;
      });

      const body = fillTemplate(tmpl.body_template, params);
      const payload = {
        messaging_product: "whatsapp", to: r.phone, type: "template",
        template: {
          name: tmpl.name, language: { code: tmpl.language || "en" },
          components: params.length ? [{ type: "body", parameters: params.map((p: string) => ({ type: "text", text: String(p ?? "") })) }] : [],
        },
      };
      const res = await fetch(`https://graph.facebook.com/v20.0/${cfg.phone_number_id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const respBody = await res.json();
      const ok = res.ok;
      await admin.from("whatsapp_messages").insert({
        tenant_id, direction: "out", wa_message_id: respBody?.messages?.[0]?.id || null,
        to_phone: r.phone, student_id: r.student_id, template_id: tmpl.id, broadcast_id: broadcast!.id,
        body, status: ok ? "sent" : "failed", error: ok ? null : (respBody?.error?.message || "Failed"), raw_payload: respBody,
      });
      if (ok) { sent++; sentToday++; } else { failed++; }
    }

    await admin.from("whatsapp_config").update({ messages_sent_today: sentToday, last_reset_date: today }).eq("id", cfg.id);
    if (sent > 0) {
      await admin.from("whatsapp_templates").update({ usage_count: (tmpl.usage_count || 0) + sent, last_used_at: new Date().toISOString() }).eq("id", tmpl.id);
    }
    await admin.from("whatsapp_broadcasts").update({
      sent_count: sent, failed_count: failed, status: "completed", completed_at: new Date().toISOString(),
    }).eq("id", broadcast!.id);

    return new Response(JSON.stringify({ ok: true, broadcast_id: broadcast!.id, sent, failed, total: recipients.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});