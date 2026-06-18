import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Channel = "whatsapp" | "sms";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const runId: string | undefined = body.runId;
    const cardId: string | undefined = body.cardId;
    const channels: Channel[] = Array.isArray(body.channels) && body.channels.length
      ? body.channels
      : ["whatsapp", "sms"];

    if (!runId && !cardId) {
      return json({ error: "runId or cardId required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authenticate caller and check permission
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: u } = await userClient.auth.getUser();
    const actor = u?.user?.id || null;
    if (!actor) return json({ error: "Unauthorized" }, 401);

    // Resolve tenant + cards
    let tenantId: string;
    let cards: any[] = [];
    let run: any = null;
    if (runId) {
      const { data: r } = await supabase
        .from("report_card_runs")
        .select("id, tenant_id, term_id, class_id")
        .eq("id", runId).maybeSingle();
      if (!r) return json({ error: "Run not found" }, 404);
      run = r;
      tenantId = r.tenant_id;
      const { data: cs } = await supabase
        .from("report_cards")
        .select("id, tenant_id, run_id, student_id, pdf_url, status, delivery_status")
        .eq("run_id", runId)
        .eq("status", "ready");
      cards = cs || [];
    } else {
      const { data: c } = await supabase
        .from("report_cards")
        .select("id, tenant_id, run_id, student_id, pdf_url, status, delivery_status")
        .eq("id", cardId!).maybeSingle();
      if (!c) return json({ error: "Card not found" }, 404);
      tenantId = c.tenant_id;
      cards = [c];
      const { data: r } = await supabase.from("report_card_runs")
        .select("id, tenant_id, term_id, class_id").eq("id", c.run_id).maybeSingle();
      run = r;
    }

    // Permission check via security-definer helper
    const { data: allowed } = await supabase.rpc("has_perm", {
      _tenant: tenantId, _perm: "reports.generate", _user: actor,
    });
    if (!allowed) return json({ error: "Not authorized" }, 403);

    const { data: tenant } = await supabase
      .from("tenants").select("name").eq("id", tenantId).maybeSingle();
    const { data: term } = run?.term_id
      ? await supabase.from("terms").select("name").eq("id", run.term_id).maybeSingle()
      : { data: null } as any;
    const examName = term?.name ? `${term.name} Report` : "Report Card";
    const schoolName = tenant?.name || "School";

    // Pull whatsapp + sms templates for tenant
    const { data: tpls } = await supabase
      .from("message_templates")
      .select("id, channel, body, subject")
      .eq("tenant_id", tenantId)
      .eq("slug", "exam_result_ready")
      .in("channel", channels);

    const tplByChannel = new Map<string, any>();
    for (const t of tpls || []) tplByChannel.set(t.channel, t);

    let delivered = 0;
    const skipped: string[] = [];

    for (const card of cards) {
      if (!card.pdf_url) { skipped.push(card.id); continue; }

      const { data: student } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("id", card.student_id).maybeSingle();
      if (!student) { skipped.push(card.id); continue; }

      const { data: links } = await supabase
        .from("student_guardians")
        .select("guardian_id, receives_communications, guardians:guardian_id(id, full_name, phone_primary, whatsapp_number)")
        .eq("student_id", card.student_id);

      const messageIds: string[] = [];
      let errored: string | null = null;

      for (const link of links || []) {
        if (link.receives_communications === false) continue;
        const g: any = link.guardians;
        if (!g) continue;
        const studentName = `${student.first_name} ${student.last_name}`.trim();

        for (const channel of channels) {
          const tpl = tplByChannel.get(channel);
          const addr = channel === "whatsapp"
            ? (g.whatsapp_number || g.phone_primary)
            : (g.phone_primary || g.whatsapp_number);
          if (!addr) continue;

          const vars = {
            guardian_name: g.full_name || "Parent",
            student_name: studentName,
            exam_name: examName,
            link: card.pdf_url,
            school_name: schoolName,
          };
          const body = tpl?.body
            ? render(tpl.body, vars)
            : `Dear ${vars.guardian_name}, ${vars.student_name}'s ${vars.exam_name} is ready. View: ${vars.link} — ${vars.school_name}`;

          const { data: msg, error: msgErr } = await supabase
            .from("messages")
            .insert({
              tenant_id: tenantId,
              recipient_type: "guardian",
              recipient_id: g.id,
              recipient_address: addr,
              recipient_name: g.full_name,
              student_id: card.student_id,
              channel,
              template_id: tpl?.id || null,
              template_variables: vars,
              subject: tpl?.subject || null,
              body,
              status: "queued",
              direction: "outbound",
            })
            .select("id").single();
          if (msgErr) { errored = msgErr.message; continue; }
          if (msg) messageIds.push(msg.id);
        }
      }

      const status = messageIds.length > 0
        ? "queued"
        : (errored ? "failed" : "no_guardian");

      await supabase.from("report_cards").update({
        delivery_status: status,
        delivery_error: errored,
        delivered_at: messageIds.length > 0 ? new Date().toISOString() : null,
        message_ids: messageIds,
      }).eq("id", card.id);

      if (messageIds.length > 0) delivered++;
    }

    if (runId) {
      await supabase.from("report_card_runs").update({
        delivered_count: delivered,
        delivered_at: new Date().toISOString(),
        delivery_status: delivered === cards.length ? "delivered" : "partial",
      }).eq("id", runId);
    }

    return json({ ok: true, delivered, total: cards.length, skipped });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, key) => vars[key] ?? "");
}
function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}