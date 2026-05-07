import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CANONICAL_FIELDS = [
  "admission_number", "first_name", "last_name", "full_name", "gender",
  "date_of_birth", "grade", "email", "phone", "address",
  "guardian_name", "guardian_phone", "guardian_email", "guardian_relationship",
  "admission_date", "status",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headers, sampleRows } = await req.json();
    if (!Array.isArray(headers) || headers.length === 0) {
      return new Response(JSON.stringify({ error: "headers required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You map spreadsheet columns from a school's student roster to a canonical schema.
Canonical fields: ${CANONICAL_FIELDS.join(", ")}.
Return one mapping per uploaded header. Use null when no good match exists.
Use "full_name" only when first/last name aren't separate; otherwise prefer first_name/last_name.`;

    const userPrompt = `Uploaded headers: ${JSON.stringify(headers)}
Sample rows (first 3): ${JSON.stringify(sampleRows ?? [])}
Return the mapping via the tool.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_mapping",
            description: "Return mapping of uploaded headers to canonical fields",
            parameters: {
              type: "object",
              properties: {
                mapping: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      header: { type: "string" },
                      canonical_field: {
                        type: ["string", "null"],
                        enum: [...CANONICAL_FIELDS, null],
                      },
                      confidence: { type: "number" },
                    },
                    required: ["header", "canonical_field"],
                  },
                },
              },
              required: ["mapping"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_mapping" } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later." }), {
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { mapping: [] };

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-import-mapping error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});