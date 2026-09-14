// Generates a CBC-format lesson plan.
import { adminClient, authedUser, requirePermission, authErrorResponse } from "../_shared/auth.ts";
import { callAnthropic, corsHeaders, jsonResponse } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    const { subject_id, grade_level_id, topic, duration_minutes, lesson_number, tenant_id } = await req.json();
    if (!topic) return jsonResponse({ error: "topic required" }, 400);
    const tenantId = tenant_id ?? user.tenantIds[0];
    if (!user.isSuperAdmin) requirePermission(user, tenantId, "ai.use");

    const admin = adminClient();
    const { data: subject } = subject_id
      ? await admin.from("subjects").select("name").eq("id", subject_id).maybeSingle()
      : { data: null };
    const { data: grade } = grade_level_id
      ? await admin.from("grade_levels").select("name").eq("id", grade_level_id).maybeSingle()
      : { data: null };

    const result = await callAnthropic({
      tenantId,
      userId: user.userId,
      functionName: "draft-lesson-plan",
      purpose: "lesson_plan",
      system:
        "You write CBC lesson plans. Use these headings: Strand, Sub-strand, Specific learning outcomes, " +
        "Key inquiry question, Learning resources, Organisation of learning (introduction, lesson development " +
        "in steps, conclusion), Core competencies, Values, Assessment, Teacher self-evaluation.",
      prompt:
        `Subject: ${subject?.name ?? "unspecified"}\nGrade: ${grade?.name ?? "unspecified"}\n` +
        `Topic: ${topic}\nDuration: ${duration_minutes ?? 40} minutes\nLesson number: ${lesson_number ?? 1}`,
      maxTokens: 2500,
    });

    return jsonResponse({ ok: true, lesson_plan: result.text });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
