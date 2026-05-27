// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// POST { tenant_id, csv, commit?: boolean }
// Parses a NEMIS progression CSV and updates students.nemis_upi (and birth_certificate_number if present).
// Returns a preview diff unless commit=true.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = []; let field = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((f) => f.trim().length > 0));
}

function findCol(headers: string[], patterns: RegExp[]) {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim().toLowerCase();
    if (patterns.some((p) => p.test(h))) return i;
  }
  return -1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return j({ error: "Unauthorized" }, 401);
    const svc = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const tenant_id = body.tenant_id;
    const csv = String(body.csv ?? "");
    const commit = !!body.commit;
    if (!tenant_id || !csv) return j({ error: "tenant_id and csv required" }, 400);

    const { data: canManage } = await svc.rpc("has_perm", { _tenant: tenant_id, _perm: "students.manage", _user: user.id });
    if (!canManage) return j({ error: "Forbidden" }, 403);

    // Strip BOM
    const clean = csv.replace(/^\uFEFF/, "");
    const rows = parseCsv(clean);
    if (rows.length < 2) return j({ error: "CSV appears empty" }, 400);
    const headers = rows[0];
    const colUpi = findCol(headers, [/upi/]);
    const colAdm = findCol(headers, [/admission/, /adm\s*no/, /\badm\b/]);
    const colBcn = findCol(headers, [/birth.*cert.*no/, /^bcn$/]);
    const colName = findCol(headers, [/full\s*name/, /^name$/]);
    if (colUpi < 0) return j({ error: "Could not find UPI column in CSV" }, 400);
    if (colAdm < 0 && colBcn < 0 && colName < 0) {
      return j({ error: "CSV needs at least one of: admission number, birth certificate number, or full name" }, 400);
    }

    const { data: students } = await svc.from("students")
      .select("id, admission_number, birth_certificate_number, nemis_upi, first_name, last_name")
      .eq("tenant_id", tenant_id);
    const byAdm = new Map<string, any>();
    const byBcn = new Map<string, any>();
    const byName = new Map<string, any>();
    for (const s of students ?? []) {
      if (s.admission_number) byAdm.set(String(s.admission_number).toUpperCase().replace(/\s+/g, ""), s);
      if (s.birth_certificate_number) byBcn.set(String(s.birth_certificate_number).replace(/\s+/g, ""), s);
      const name = `${s.first_name} ${s.last_name}`.trim().toLowerCase();
      byName.set(name, s);
    }

    const matched: any[] = [];
    const unmatched: any[] = [];
    const unchanged: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const upi = (r[colUpi] ?? "").trim();
      if (!upi) continue;
      let s: any = null;
      if (colAdm >= 0 && r[colAdm]) s = byAdm.get(String(r[colAdm]).toUpperCase().replace(/\s+/g, ""));
      if (!s && colBcn >= 0 && r[colBcn]) s = byBcn.get(String(r[colBcn]).replace(/\s+/g, ""));
      if (!s && colName >= 0 && r[colName]) s = byName.get(String(r[colName]).trim().toLowerCase());
      const csvName = colName >= 0 ? r[colName] : `${r[colAdm] ?? ""} ${r[colBcn] ?? ""}`;
      if (!s) {
        unmatched.push({ csv_name: csvName, csv_adm: colAdm >= 0 ? r[colAdm] : "", csv_bcn: colBcn >= 0 ? r[colBcn] : "", new_upi: upi });
        continue;
      }
      if ((s.nemis_upi ?? "") === upi) {
        unchanged.push({ student_id: s.id, name: `${s.first_name} ${s.last_name}`, upi });
      } else {
        matched.push({ student_id: s.id, name: `${s.first_name} ${s.last_name}`, old_upi: s.nemis_upi ?? null, new_upi: upi });
      }
    }

    if (commit && matched.length) {
      for (const m of matched) {
        await svc.from("students").update({ nemis_upi: m.new_upi, updated_at: new Date().toISOString() }).eq("id", m.student_id);
      }
    }

    return j({
      committed: commit,
      summary: { matched: matched.length, unmatched: unmatched.length, unchanged: unchanged.length },
      matched: matched.slice(0, 200),
      unmatched: unmatched.slice(0, 200),
      unchanged_count: unchanged.length,
    });
  } catch (e: any) {
    return j({ error: e?.message ?? "Internal error" }, 500);
  }
});
function j(d: unknown, s = 200) { return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }