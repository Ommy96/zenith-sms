// Thin alias for knec-results-import with body_code locked to "necta".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { tenant_id, csv } = await req.json() as { tenant_id: string; csv: string };
    if (!tenant_id || !csv) throw new Error("tenant_id and csv required");
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
    const header = lines.shift()!.split(",").map(s => s.trim().toLowerCase());
    const idx = (k: string) => header.indexOf(k);
    const iIndex = idx("index_number"), iSubj = idx("subject_code"), iGrade = idx("grade"), iPts = idx("points");
    if (iIndex < 0 || iSubj < 0 || iGrade < 0) throw new Error("CSV missing required columns (index_number, subject_code, grade)");

    let matched = 0, unmatched = 0;
    const sample: unknown[] = [];

    for (const line of lines) {
      const cells = line.split(",").map(s => s.trim());
      const indexNum = cells[iIndex];
      if (!indexNum) continue;
      const { data: student } = await supa.from("students").select("id")
        .eq("tenant_id", tenant_id).eq("necta_index_number", indexNum).maybeSingle();
      if (!student) { unmatched++; continue; }
      matched++;
      if (sample.length < 5) sample.push({ student_id: student.id, subject: cells[iSubj], grade: cells[iGrade] });
    }

    await supa.from("compliance_exports_log").insert({
      tenant_id, kind: "necta_results_import",
      params: { matched, unmatched, total: matched + unmatched }, row_count: matched,
    });

    return new Response(JSON.stringify({ body: "necta", matched, unmatched, sample }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});