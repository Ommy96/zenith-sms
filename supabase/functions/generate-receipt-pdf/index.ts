// generate-receipt-pdf — renders a branded A4 fee receipt into the private
// `receipts` bucket and returns a 30-day signed link.
//
// verify_jwt: true for user calls; the internal secret is accepted for
// service-to-service calls (e.g. the M-Pesa callback).

import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { adminClient, authErrorResponse, authedUser } from "../_shared/auth.ts";
import { requireOwnsResource } from "../_shared/ownership.ts";
import { corsHeaders, jsonResponse } from "../_shared/messaging.ts";

const SIGNED_URL_TTL = 60 * 60 * 24 * 30;

function money(n: number, currency: string) {
  return `${currency} ${Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { receipt_id, force } = await req.json();
    if (!receipt_id) return jsonResponse({ error: "receipt_id required" }, 400);

    const admin = adminClient();
    const internalKey = req.headers.get("x-zenith-internal-key");
    const isInternal = !!internalKey && internalKey === Deno.env.get("ZENITH_INTERNAL_SECRET");
    if (!isInternal) {
      const user = await authedUser(req);
      await requireOwnsResource({
        user, resourceType: "receipt", resourceId: receipt_id,
        functionName: "generate-receipt-pdf", req,
      });
    }

    const { data: receipt } = await admin.from("student_receipts")
      .select("*, students:student_id(first_name, middle_name, last_name, admission_number), payments:payment_id(method, reference, paid_at, payment_number)")
      .eq("id", receipt_id).maybeSingle();
    if (!receipt) return jsonResponse({ error: "Receipt not found" }, 404);

    if (receipt.pdf_url && !force) {
      return jsonResponse({ ok: true, url: receipt.pdf_url, cached: true });
    }

    const { data: tenant } = await admin.from("tenants")
      .select("name, address, phone, email, currency_code, logo_url").eq("id", receipt.tenant_id).maybeSingle();
    const currency = receipt.currency ?? tenant?.currency_code ?? "KES";

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const ink = rgb(0.07, 0.09, 0.15);
    const muted = rgb(0.42, 0.45, 0.5);
    let y = 790;

    // Optional school logo from the tenant-logos bucket.
    if (tenant?.logo_url) {
      try {
        const path = tenant.logo_url.includes("/tenant-logos/")
          ? tenant.logo_url.split("/tenant-logos/")[1].split("?")[0]
          : tenant.logo_url;
        const { data: blob } = await admin.storage.from("tenant-logos").download(path);
        if (blob) {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const img = path.toLowerCase().endsWith(".png")
            ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const dims = img.scale(48 / img.height);
          page.drawImage(img, { x: 50, y: y - dims.height + 14, width: dims.width, height: dims.height });
        }
      } catch (e) { console.warn("[receipt] logo skipped", (e as Error).message); }
    }

    const text = (s: string, x: number, yy: number, size = 10, font = regular, color = ink) =>
      page.drawText(s ?? "", { x, y: yy, size, font, color });

    text(tenant?.name ?? "School", 120, y, 16, bold);
    y -= 16;
    text([tenant?.address, tenant?.phone, tenant?.email].filter(Boolean).join("  •  "), 120, y, 9, regular, muted);
    y -= 40;

    text("OFFICIAL FEE RECEIPT", 50, y, 13, bold);
    text(receipt.receipt_number ?? "", 420, y, 13, bold);
    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: muted });
    y -= 28;

    const s = receipt.students as any;
    const p = receipt.payments as any;
    const rows: [string, string][] = [
      ["Student", [s?.first_name, s?.middle_name, s?.last_name].filter(Boolean).join(" ")],
      ["Admission No.", s?.admission_number ?? "—"],
      ["Payment No.", p?.payment_number ?? "—"],
      ["Method", (p?.method ?? "—").toUpperCase()],
      ["Reference", p?.reference ?? "—"],
      ["Date", new Date(p?.paid_at ?? receipt.issued_at ?? Date.now()).toLocaleString("en-KE")],
    ];
    for (const [label, value] of rows) {
      text(label, 50, y, 10, regular, muted);
      text(String(value), 200, y, 10, bold);
      y -= 20;
    }

    y -= 14;
    page.drawRectangle({ x: 50, y: y - 34, width: 495, height: 44, color: rgb(0.96, 0.96, 0.98) });
    text("AMOUNT RECEIVED", 66, y - 12, 10, regular, muted);
    text(money(receipt.amount, currency), 380, y - 16, 16, bold);
    y -= 70;

    if (receipt.is_regenerated) text("DUPLICATE COPY", 50, y, 10, bold, muted);
    text("This is a computer-generated receipt and is valid without a signature.", 50, 60, 8, regular, muted);
    text(`Generated ${new Date().toLocaleString("en-KE")} • Zenith OS`, 50, 48, 8, regular, muted);

    const bytes = await pdf.save();
    const year = new Date(receipt.issued_at ?? Date.now()).getFullYear();
    const path = `${receipt.tenant_id}/${year}/${String(receipt.receipt_number ?? receipt.id).replace(/[^\w.-]/g, "-")}.pdf`;

    const { error: upErr } = await admin.storage.from("receipts")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) return jsonResponse({ error: upErr.message }, 500);

    const { data: signed } = await admin.storage.from("receipts").createSignedUrl(path, SIGNED_URL_TTL);

    await admin.from("student_receipts").update({
      pdf_url: signed?.signedUrl ?? null,
      pdf_generated_at: new Date().toISOString(),
      ...(force ? { is_regenerated: true, regenerated_at: new Date().toISOString() } : {}),
      metadata: { ...(receipt.metadata ?? {}), storage_path: path },
    }).eq("id", receipt_id);

    return jsonResponse({ ok: true, url: signed?.signedUrl, path });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
