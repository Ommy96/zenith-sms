import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_LIMIT = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();
    const schoolId = profile?.tenant_id;
    if (!schoolId) {
      return new Response(JSON.stringify({ error: "No school associated" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      studentName, subject, grade, score,
      strengths, improvements, style = "Encouraging", length = "Medium",
    } = body ?? {};

    if (!studentName || !subject) {
      return new Response(JSON.stringify({ error: "studentName and subject required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usage check
    const ym = new Date().toISOString().slice(0, 7);
    const { data: usageRow } = await admin
      .from("ai_comment_usage")
      .select("id, count")
      .eq("user_id", user.id)
      .eq("year_month", ym)
      .maybeSingle();

    const currentCount = usageRow?.count ?? 0;
    if (currentCount >= MONTHLY_LIMIT) {
      return new Response(JSON.stringify({
        error: "Monthly AI generation limit reached",
        used: currentCount, limit: MONTHLY_LIMIT,
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lengthGuide: Record<string, string> = {
      Short: "exactly one concise sentence",
      Medium: "2 to 3 sentences",
      Long: "a full paragraph of 4 to 6 sentences",
    };
    const styleGuide: Record<string, string> = {
      Encouraging: "warm, positive and motivating tone",
      Formal: "professional, neutral academic tone",
      Direct: "concise, candid, straightforward tone",
    };

    const systemPrompt = `You write personalised school report card comments for teachers.
Write in ${styleGuide[style] ?? styleGuide.Encouraging}.
Length: ${lengthGuide[length] ?? lengthGuide.Medium}.
Address the student by first name. Mention the subject. Reference the strengths and areas to improve naturally; do not list them as bullets. Do not invent facts beyond what's provided. Do not include the grade letter unless it adds value.`;

    const userPrompt = `Student: ${studentName}
Subject: ${subject}
Grade: ${grade ?? "N/A"}${score != null ? ` (score ${score})` : ""}
What's going well: ${strengths || "—"}
What needs work: ${improvements || "—"}

Write the report card comment.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const comment: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Increment usage
    if (usageRow) {
      await admin.from("ai_comment_usage")
        .update({ count: currentCount + 1 })
        .eq("id", usageRow.id);
    } else {
      await admin.from("ai_comment_usage").insert({
        user_id: user.id, tenant_id: schoolId, year_month: ym, count: 1,
      });
    }

    return new Response(JSON.stringify({
      comment,
      used: currentCount + 1,
      limit: MONTHLY_LIMIT,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-report-comment error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});