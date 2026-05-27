// Generates a single personalised report-card comment using the shared AI service
// (Claude default, Lovable AI fallback) with tenant quota + caching + house style.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { aiCall, authedUser, loadTemplate, renderTemplate } from "../_shared/ai-service.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await authedUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: profile } = await admin
      .from("profiles").select("tenant_id").eq("id", user.userId).maybeSingle();
    const tenantId = profile?.tenant_id;
    if (!tenantId) return json({ error: "No school associated" }, 400);

    const body = await req.json().catch(() => ({}));
    const {
      studentName, gradeLevel, subject, grade, score,
      strengths, improvements,
      style, length = "Medium", language, cbcCompetencies,
    } = body ?? {};
    if (!studentName || !subject) {
      return json({ error: "studentName and subject required" }, 400);
    }

    // Load house style defaults from tenant_settings.
    const { data: settings } = await admin
      .from("tenant_settings").select("key,value")
      .eq("tenant_id", tenantId)
      .in("key", ["ai.house_tone", "ai.default_language"]);
    const sMap: Record<string, any> = {};
    (settings ?? []).forEach((r: any) => { sMap[r.key] = r.value?.value ?? r.value; });
    const tone = style || sMap["ai.house_tone"] || "Encouraging";
    const lang = language || sMap["ai.default_language"] || "English";

    const lengthGuide: Record<string, string> = {
      Short: "exactly one concise sentence",
      Medium: "2 to 3 sentences",
      Long: "a full paragraph of 4 to 6 sentences",
    };

    const { version } = await loadTemplate("report_comment.v1", tenantId);
    const vars = {
      student_name: studentName,
      grade_level: gradeLevel ?? "",
      subject,
      grade_or_level: grade ?? (score != null ? `score ${score}` : "N/A"),
      whats_going_well: strengths || "—",
      needs_work: improvements || "—",
      tone,
      length: lengthGuide[length] ?? lengthGuide.Medium,
      language: lang,
      cbc_competencies: cbcCompetencies || "",
    };
    const systemPrompt = version.system_prompt
      ? renderTemplate(version.system_prompt, vars)
      : undefined;
    const userPrompt = renderTemplate(version.user_prompt, vars);

    const result = await aiCall({
      tenantId, userId: user.userId, feature: "report_comment",
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      model: version.model ? undefined : undefined, // honour provider defaults
      temperature: version.temperature ?? 0.7,
      maxTokens: 400,
      cacheContext: `${studentName}|${subject}|${grade ?? ""}|${score ?? ""}`,
      requestMeta: { templateSlug: "report_comment.v1", tone, length, language: lang },
    });

    // Pull current quota state so the client can show used/limit.
    const { data: quota } = await admin.rpc("ai_check_quota", { _tenant: tenantId });

    return json({
      comment: result.text.trim(),
      provider: result.provider, model: result.model,
      cacheHit: result.cacheHit, costUsd: result.costUsd,
      used: quota?.request_count ?? 0,
      limit: quota?.request_limit ?? null,
      quotaState: quota?.state ?? "ok",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "AI_QUOTA_EXCEEDED" ? 429 : 500;
    console.error("generate-report-comment", msg);
    return json({ error: msg }, status);
  }
});