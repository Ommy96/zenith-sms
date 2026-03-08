import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country } = await req.json();

    if (!country) {
      return new Response(
        JSON.stringify({ success: false, error: 'Country is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an expert on international education systems. For the country "${country}", provide the following information in valid JSON format only (no markdown, no code blocks, just raw JSON):

{
  "country": "${country}",
  "academic_calendar": {
    "school_year_start": "Month when the school year typically starts",
    "school_year_end": "Month when the school year typically ends",
    "terms": [
      { "name": "Term name", "start_month": "Month", "end_month": "Month" }
    ],
    "major_holidays": ["Holiday 1", "Holiday 2"]
  },
  "school_levels": [
    { "name": "Level name (e.g. Primary School)", "grades": "e.g. Grade 1-6", "age_range": "e.g. 6-12 years", "duration_years": 6 }
  ],
  "grading_system": {
    "type": "letter | percentage | gpa | points | descriptive",
    "scale": [
      { "grade": "A", "min_score": 80, "max_score": 100, "description": "Excellent" }
    ],
    "pass_mark": 50,
    "gpa_scale": "4.0 or 5.0 or N/A"
  },
  "common_subjects": {
    "core": ["Subject 1", "Subject 2"],
    "elective": ["Subject 1", "Subject 2"]
  },
  "payment_methods": {
    "common": ["Bank Transfer", "Mobile Money", "Cash"],
    "digital_platforms": ["Platform 1"],
    "currency": "Currency code (e.g. USD, KES, GBP)",
    "currency_symbol": "$",
    "fee_structure": "termly | semesterly | annually | monthly"
  },
  "regulatory_body": "Name of the main education regulatory body",
  "language_of_instruction": "Primary language"
}

Be accurate and specific to ${country}. Include real, commonly used data. Return ONLY the JSON object, nothing else.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI Gateway error:', errText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch education data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the AI response (handle potential markdown wrapping)
    let educationData;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      educationData = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse education data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: educationData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
