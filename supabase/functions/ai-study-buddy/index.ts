// AI Study Buddy — homework helper chat for students/parents in the portal.
// Streaming SSE response. Verifies caller is linked to the studentId via portal RPC.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { authedUser, aiStream, checkQuota } from "../_shared/ai-service.ts";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await authedUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const { tenantId, studentId, subject, messages } = body ?? {};
    if (!tenantId || !studentId || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "tenantId, studentId, messages required" }, 400);
    }

    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data } = await svc.rpc("portal_my_student_ids", { _user: user.userId });
    const allowed = (data ?? []).some((r: any) => r.student_id === studentId);
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const { data: stu } = await svc.from("students")
      .select("first_name, last_name, classes(name, grade_levels(name, stage))")
      .eq("id", studentId).maybeSingle();
    const gradeLevel = (stu as any)?.classes?.grade_levels?.name ?? "";
    const stage = (stu as any)?.classes?.grade_levels?.stage ?? "";

    const system = `You are Study Buddy — a patient, encouraging homework helper.
You are helping ${stu?.first_name ?? "the student"}, who is in ${gradeLevel || "school"} (${stage || ""}).
${subject ? `Today they are working on: ${subject}.` : ""}
Rules:
- Explain step-by-step and use examples appropriate for their grade level.
- Never just give the final answer to a homework question without showing reasoning. Guide them to think it through.
- If asked for inappropriate help (cheating on a graded exam, harmful content), politely decline.
- Keep tone warm, supportive, and short — 3-6 sentences per turn unless a worked example is needed.
- Use simple markdown (lists, bold) when it helps.`;

    const quota = await checkQuota(tenantId);
    if (quota.state === "hard_stop") return json({ error: "AI_QUOTA_EXCEEDED" }, 429);

    return await aiStream({
      tenantId, userId: user.userId, feature: "study_buddy",
      system, messages, temperature: 0.6, maxTokens: 800,
      cache: false,
      requestMeta: { studentId, subject },
    }, corsHeaders);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});