import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { subject, class_name, date, objectives, learning_outcomes } = body || {};
    if (!subject) {
      return new Response(JSON.stringify({ error: 'subject required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const outcomes = Array.isArray(learning_outcomes) && learning_outcomes.length
      ? `\nTarget learning outcomes:\n- ${learning_outcomes.join('\n- ')}` : '';

    const prompt = `You are an experienced East African teacher drafting a single 40-minute lesson plan.
Subject: ${subject}
Class: ${class_name || 'not specified'}
Date: ${date || 'today'}
Teacher notes: ${objectives || 'none provided'}${outcomes}

Return ONLY valid JSON with these keys (no markdown, no commentary):
{
  "objectives": "2-4 SMART learning objectives, bulleted",
  "materials": "list of materials needed",
  "introduction": "5-minute hook/intro activity",
  "development": "25-minute main lesson with teacher and learner activities",
  "conclusion": "5-minute recap and check for understanding",
  "assessment": "formative assessment for the lesson",
  "homework": "short follow-up task"
}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      return new Response(JSON.stringify({ error: 'ai_failed', detail: text }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content || '{}';
    let plan: any = {};
    try { plan = JSON.parse(content); } catch { plan = { development: content }; }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});