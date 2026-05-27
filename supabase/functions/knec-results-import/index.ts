import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generic exam-body results importer (KCSE/KCPE/UNEB/NECTA/REB).
 * Accepts CSV with columns: index_number, candidate_name, subject_code, grade, points
 * Matches candidates by index_number → students.knec_index_number (or related country field).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { tenant_id, body_code, csv } = await req.json() as {
      tenant_id: string; body_code: "knec" | "uneb" | "necta" | "reb"; csv: string;
    };
    if (!tenant_id || !csv) throw new Error("tenant_id and csv required");
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
    const header = lines.shift()!.split(",").map(s => s.trim().toLowerCase());
    const idx = (k: string) => header.indexOf(k);
    const iIndex = idx("index_number"), iSubj = idx("subject_code"), iGrade = idx("grade"), iPts = idx("points");
    if (iIndex < 0 || iSubj < 0 || iGrade < 0) throw new Error("CSV missing required columns");

    const indexCol: Record<string, string> = {
      knec: "knec_index_number",
      uneb: "uneb_index_number",
      necta: "necta_index_number",
      reb: "rwanda_reb_id",
    };
    const col = indexCol[body_code] || "knec_index_number";

    let matched = 0, unmatched = 0;
    const rows: Array<{ student_id: string; subject_code: string; grade: string; points: number | null }> = [];

    for (const line of lines) {
      const cells = line.split(",").map(s => s.trim());
      const indexNum = cells[iIndex];
      if (!indexNum) continue;
      const { data: student } = await supa.from("students").select("id")
        .eq("tenant_id", tenant_id).eq(col, indexNum).maybeSingle();
      if (!student) { unmatched++; continue; }
      rows.push({
        student_id: student.id, subject_code: cells[iSubj],
        grade: cells[iGrade], points: iPts >= 0 ? Number(cells[iPts]) || null : null,
      });
      matched++;
    }

    await supa.from("compliance_exports_log").insert({
      tenant_id, kind: `${body_code}_results_import`,
      params: { matched, unmatched, total: matched + unmatched }, row_count: matched,
    });

    return new Response(JSON.stringify({ matched, unmatched, sample: rows.slice(0, 5) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});