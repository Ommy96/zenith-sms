// Drafts a school document (transfer, recommendation, bonafide, fee extension, etc.)
// using the shared AI service. Returns plain prose; the client adds letterhead.

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
      docType, studentId, studentName: studentNameIn, admissionNumber: admIn,
      purpose, keyPoints, tone,
    } = body ?? {};
    if (!docType || !purpose) return json({ error: "docType and purpose required" }, 400);

    // Resolve school + (optional) student details.
    const { data: tenant } = await admin.from("tenants").select("name").eq("id", tenantId).maybeSingle();
    let studentName = studentNameIn ?? "";
    let admissionNumber = admIn ?? "";
    if (studentId && (!studentName || !admissionNumber)) {
      const { data: s } = await admin
        .from("students").select("first_name,last_name,admission_number")
        .eq("id", studentId).eq("tenant_id", tenantId).maybeSingle();
      if (s) {
        studentName = studentName || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
        admissionNumber = admissionNumber || s.admission_number || "";
      }
    }

    const { data: settings } = await admin
      .from("tenant_settings").select("key,value")
      .eq("tenant_id", tenantId)
      .in("key", ["ai.house_tone"]);
    const sMap: Record<string, any> = {};
    (settings ?? []).forEach((r: any) => { sMap[r.key] = r.value?.value ?? r.value; });

    const { version } = await loadTemplate("doc_letter.v1", tenantId);
    const vars = {
      school_name: tenant?.name ?? "Our School",
      student_name: studentName || "N/A",
      admission_number: admissionNumber || "N/A",
      purpose: `${docType}: ${purpose}`,
      key_points: keyPoints || "—",
      tone: tone || sMap["ai.house_tone"] || "Formal",
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    };
    const systemPrompt = version.system_prompt
      ? renderTemplate(version.system_prompt, vars) : undefined;
    const userPrompt = renderTemplate(version.user_prompt, vars);

    const result = await aiCall({
      tenantId, userId: user.userId, feature: "doc_gen",
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: version.temperature ?? 0.5,
      maxTokens: 900,
      cacheContext: `${docType}|${studentId ?? studentName}|${purpose}`,
      requestMeta: { templateSlug: "doc_letter.v1", docType },
    });

    const { data: quota } = await admin.rpc("ai_check_quota", { _tenant: tenantId });

    return json({
      draft: result.text.trim(),
      header: {
        schoolName: vars.school_name,
        date: vars.date,
        studentName: vars.student_name,
        admissionNumber: vars.admission_number,
        docType,
      },
      provider: result.provider, model: result.model, cacheHit: result.cacheHit,
      used: quota?.request_count ?? 0, limit: quota?.request_limit ?? null,
      quotaState: quota?.state ?? "ok",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "AI_QUOTA_EXCEEDED" ? 429 : 500;
    console.error("ai-document-draft", msg);
    return json({ error: msg }, status);
  }
});