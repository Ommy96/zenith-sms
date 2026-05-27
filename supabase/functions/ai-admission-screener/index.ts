// AI admission screener: scores applicants against school criteria.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { tenantId, applicationId, applicant, criteria } = body || {};
    if (!tenantId || !applicant) return json({ error: "tenantId and applicant required" }, 400);

    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } }, auth: { persistSession: false } }
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: member } = await svc.rpc("is_tenant_member", { _tenant: tenantId, _user: u.user.id });
    if (!member) return json({ error: "Forbidden" }, 403);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const sys = `You are an admissions officer for a school. Evaluate applicants fairly, flag risks, and produce structured JSON only.`;
    const prompt = `Evaluate this applicant against the school's criteria.

APPLICANT:
${JSON.stringify(applicant, null, 2)}

CRITERIA (optional):
${JSON.stringify(criteria || { academic_threshold: 60, age_match: true, behavioural_clean: true }, null, 2)}

Return STRICT JSON only:
{
  "score": 0-100,
  "recommendation": "admit" | "interview" | "waitlist" | "decline",
  "strengths": ["..."],
  "red_flags": ["..."],
  "interview_questions": ["...","...","..."],
  "rationale": "2-4 sentences"
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });
    if (!aiRes.ok) return json({ error: "AI call failed", detail: await aiRes.text() }, 500);
    const aiJson = await aiRes.json();
    const text: string = aiJson.choices?.[0]?.message?.content || "";
    const parsed = parseJson(text);
    if (!parsed) return json({ error: "Could not parse AI response", raw: text }, 500);

    const { data: row, error: insErr } = await svc.from("admission_screenings").insert({
      tenant_id: tenantId,
      application_id: applicationId || null,
      applicant_name: applicant.name || applicant.full_name || null,
      grade_level: applicant.grade_level || applicant.grade || null,
      score: clampInt(parsed.score, 0, 100),
      recommendation: parsed.recommendation || null,
      strengths: parsed.strengths || [],
      red_flags: parsed.red_flags || [],
      interview_questions: parsed.interview_questions || [],
      rationale: parsed.rationale || null,
      input_data: applicant,
      criteria: criteria || null,
      created_by: u.user.id,
    }).select().single();
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, screening: row });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function clampInt(n: any, min: number, max: number) {
  const v = Math.round(Number(n)); if (Number.isNaN(v)) return null;
  return Math.max(min, Math.min(max, v));
}
function parseJson(text: string): any | null {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  try { return JSON.parse(trimmed); } catch {}
  const m = trimmed.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}
function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}