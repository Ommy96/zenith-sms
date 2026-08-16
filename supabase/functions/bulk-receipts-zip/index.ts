// bulk-receipts-zip — bundle up to 500 receipt PDFs into a single ZIP,
// store it under receipts/bulk/ and return a 24h signed URL.
//
// Auth: caller must be a tenant member with fees.view AND fees.bulk_export
// (super_admin bypasses). All receipt_ids must belong to the caller's tenant.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { requireAuth, EdgeAuthError } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jr = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MAX_RECEIPTS = 500;
const ZIP_TTL = 60 * 60 * 24; // 24 hours

const sanitize = (s: string) => String(s || "").replace(/[^A-Za-z0-9_-]/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = await requireAuth(req);
    const admin = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.receipt_ids) ? body.receipt_ids.filter((x: unknown) => typeof x === "string") : [];
    if (!ids.length) return jr({ error: "receipt_ids required" }, 400);
    if (ids.length > MAX_RECEIPTS) {
      return jr({ error: `You can bulk-download up to ${MAX_RECEIPTS} receipts at a time. Selected ${ids.length} — please filter to reduce.` }, 400);
    }

    const canBulk = auth.isSuperAdmin
      || (auth.permissions.includes("fees.view") && auth.permissions.includes("fees.bulk_export"))
      || auth.roles.some((r) => ["school_admin", "principal", "bursar"].includes(r));
    if (!canBulk) return jr({ error: "Forbidden: missing fees.bulk_export" }, 403);

    const { data: receipts, error: rErr } = await admin
      .from("student_receipts")
      .select("id, tenant_id, receipt_number, pdf_url, payment_id")
      .in("id", ids);
    if (rErr) return jr({ error: rErr.message }, 500);
    if (!receipts?.length) return jr({ error: "No receipts found" }, 404);

    // Tenant scoping — every receipt must be in a tenant the caller belongs to.
    const tenantIds = [...new Set(receipts.map((r: any) => r.tenant_id))];
    if (!auth.isSuperAdmin && tenantIds.some((t) => !auth.tenantIds.includes(t))) {
      return jr({ error: "Forbidden: receipts outside your school" }, 403);
    }
    if (tenantIds.length > 1) return jr({ error: "Receipts span multiple schools" }, 400);
    const tenantId = tenantIds[0];

    const { data: tenant } = await admin.from("tenants").select("slug, name").eq("id", tenantId).maybeSingle();

    // Student names for filenames
    const paymentIds = receipts.map((r: any) => r.payment_id).filter(Boolean);
    const { data: payments } = await admin
      .from("student_payments")
      .select("id, student:student_id(first_name, last_name)")
      .in("id", paymentIds.length ? paymentIds : ["00000000-0000-0000-0000-000000000000"]);
    const nameByPayment = new Map<string, string>();
    for (const p of (payments || []) as any[]) {
      nameByPayment.set(p.id, `${p.student?.first_name || ""}${p.student?.last_name || ""}`);
    }

    const zip = new JSZip();
    let added = 0;
    const failed: string[] = [];

    for (const r of receipts as any[]) {
      try {
        let path: string | null = r.pdf_url;
        if (!path) {
          const res = await fetch(`${url}/functions/v1/generate-receipt-pdf`, {
            method: "POST",
            headers: { Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
            body: JSON.stringify({ receipt_id: r.id }),
          });
          const j = await res.json().catch(() => ({}));
          path = j?.path || null;
        }
        if (!path) { failed.push(r.receipt_number || r.id); continue; }
        const { data: file, error: dlErr } = await admin.storage.from("receipts").download(path);
        if (dlErr || !file) { failed.push(r.receipt_number || r.id); continue; }
        const bytes = new Uint8Array(await (file as Blob).arrayBuffer());
        const name = `Receipt_${sanitize(r.receipt_number || r.id)}_${sanitize(nameByPayment.get(r.payment_id) || "Student")}.pdf`;
        zip.file(name, bytes);
        added++;
      } catch (_e) {
        failed.push(r.receipt_number || r.id);
      }
    }

    if (!added) return jr({ error: "No receipt PDFs could be assembled", failed }, 500);

    const zipBytes = await zip.generateAsync({ type: "uint8array" });
    const day = new Date().toISOString().slice(0, 10);
    const fileName = `Receipts_${sanitize(tenant?.slug || tenant?.name || "school")}_${day}_${added}.zip`;
    const zipPath = `${tenantId}/bulk/${Date.now()}_${fileName}`;

    const { error: upErr } = await admin.storage.from("receipts").upload(zipPath, zipBytes, {
      contentType: "application/zip", upsert: true,
    });
    if (upErr) return jr({ error: "Upload failed", detail: upErr.message }, 500);

    const { data: signed } = await admin.storage.from("receipts").createSignedUrl(zipPath, ZIP_TTL);

    await admin.from("audit_logs").insert({
      tenant_id: tenantId,
      actor_user_id: auth.userId,
      action: "bulk_receipt_export",
      entity_type: "student_receipts",
      after: { count: added, failed_count: failed.length, file: fileName, receipt_ids: ids },
    }).then(() => {}, () => {});

    return jr({ url: signed?.signedUrl, path: zipPath, filename: fileName, count: added, failed });
  } catch (e) {
    if (e instanceof EdgeAuthError) return jr({ error: e.message }, e.status);
    console.error("bulk-receipts-zip error", e);
    return jr({ error: String((e as Error).message || e) }, 500);
  }
});
