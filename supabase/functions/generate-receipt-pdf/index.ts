// generate-receipt-pdf — renders a branded A4 fee receipt into the private
// `receipts` bucket and returns a 30-day signed link.
//
// verify_jwt: true for user calls; the internal secret is accepted for
// service-to-service calls (e.g. the M-Pesa callback).

import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { adminClient, authErrorResponse, authedUser } from "../_shared/auth.ts";
import { requireOwnsResource } from "../_shared/ownership.ts";
import { corsHeaders, jsonResponse } from "../_shared/messaging.ts";

const TEMPLATE = "amber-v2";
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

    const { data: tenant } = await admin.from("tenants")
      .select("name, address, phone, email, currency_code, logo_url").eq("id", receipt.tenant_id).maybeSingle();
    const currency = receipt.currency ?? tenant?.currency_code ?? "KES";

    // Reuse the stored PDF only if it was rendered with the current template and logo.
    const meta = (receipt.metadata ?? {}) as Record<string, unknown>;
    if (receipt.pdf_url && !force && meta.template === TEMPLATE && (meta.logo ?? null) === (tenant?.logo_url ?? null)) {
      return jsonResponse({ ok: true, url: receipt.pdf_url, path: meta.storage_path, cached: true });
    }

    const W = 595.28, H = 841.89, M = 56.7, CW = W - M * 2;
    const C = {
      amber: rgb(0.851, 0.467, 0.024), amberSoft: rgb(0.992, 0.957, 0.886),
      ink: rgb(0.102, 0.122, 0.157), secondary: rgb(0.290, 0.310, 0.345), muted: rgb(0.420, 0.400, 0.350),
      border: rgb(0.898, 0.898, 0.878), paper: rgb(0.992, 0.992, 0.984),
    };
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([W, H]);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const mono = await pdf.embedFont(StandardFonts.CourierBold);
    const monoReg = await pdf.embedFont(StandardFonts.Courier);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.paper });
    const fit = (s: string, max: number, size: number, f = regular) => {
      if (f.widthOfTextAtSize(s, size) <= max) return s;
      while (s.length > 1 && f.widthOfTextAtSize(`${s}…`, size) > max) s = s.slice(0, -1);
      return `${s}…`;
    };
    const text = (s: string, x: number, yy: number, size = 10, font = regular, color = C.ink) =>
      page.drawText(s ?? "", { x, y: yy, size, font, color });
    const center = (s: string, yy: number, size: number, font = regular, color = C.ink) =>
      text(s, (W - font.widthOfTextAtSize(s, size)) / 2, yy, size, font, color);
    const right = (s: string, r: number, yy: number, size = 10, font = regular, color = C.ink) =>
      text(s, r - font.widthOfTextAtSize(s, size), yy, size, font, color);
    let y = H - M;

    // Centered header: tenant logo, or amber monogram fallback.
    let logo = false;
    if (tenant?.logo_url) {
      try {
        const m = "/tenant-logos/";
        const path = tenant.logo_url.includes(m) ? decodeURIComponent(tenant.logo_url.split(m)[1].split("?")[0]) : tenant.logo_url.split("?")[0];
        const { data: blob } = await admin.storage.from("tenant-logos").download(path);
        if (blob) {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const img = /\.png$/i.test(path) ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const d = img.scale(Math.min(1, 72 / img.height, 140 / img.width));
          page.drawImage(img, { x: (W - d.width) / 2, y: y - d.height, width: d.width, height: d.height });
          y -= d.height + 14; logo = true;
        }
      } catch (e) { console.warn("[receipt] logo skipped", (e as Error).message); }
    }
    const schoolName = tenant?.name ?? "School";
    if (!logo) {
      const mark = schoolName.trim().split(/\s+/).slice(0, 2).map((p: string) => p[0]).join("").toUpperCase();
      page.drawCircle({ x: W / 2, y: y - 31, size: 31, color: C.amberSoft });
      center(mark, y - 38, 20, bold, C.amber); y -= 76;
    }
    center(fit(schoolName, CW, 24, bold), y, 24, bold, C.amber); y -= 19;
    const contact = [tenant?.address, tenant?.phone, tenant?.email].filter(Boolean).join("  ·  ");
    if (contact) center(fit(contact, CW, 9.5), y, 9.5, regular, C.muted);
    y -= 18;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: C.amber });
    y -= 34;

    // Title row: document title left, receipt number right (amber mono).
    const rn = receipt.receipt_number ?? "—";
    text("OFFICIAL FEE RECEIPT", M, y, 14, bold, C.secondary);
    right(rn, W - M, y, 13, mono, C.amber);
    y -= 34;

    const s = receipt.students as any;
    const p = receipt.payments as any;
    const rows: [string, string, boolean][] = [
      ["Student", [s?.first_name, s?.middle_name, s?.last_name].filter(Boolean).join(" ") || "—", false],
      ["Admission No.", s?.admission_number ?? "—", false],
      ["Payment No.", p?.payment_number ?? "—", true],
      ["Method", ({ mpesa: "M-Pesa", bank_transfer: "Bank transfer", cash: "Cash", cheque: "Cheque", card: "Card" } as Record<string, string>)[p?.method] ?? (p?.method ?? "—"), false],
      ["Reference", p?.reference ?? "—", true],
      ["Date", new Date(p?.paid_at ?? receipt.issued_at ?? Date.now()).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" }), false],
    ];
    for (const [label, value, isMono] of rows) {
      text(label, M + 8, y, 11, regular, C.muted);
      right(fit(String(value), CW - 160, 11, isMono ? mono : bold), W - M - 8, y, 11, isMono ? mono : bold);
      y -= 10;
      page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: C.border });
      y -= 19;
    }

    // Amount received card: label left, large amber amount right.
    y -= 8;
    page.drawRectangle({ x: M, y: y - 56, width: CW, height: 56, color: C.amberSoft, borderColor: C.amberSoft, borderWidth: 0 });
    text("AMOUNT RECEIVED", M + 16, y - 32, 9, bold, C.muted);
    right(money(receipt.amount, currency), W - M - 16, y - 36, 22, bold, C.amber);
    y -= 84;

    if (receipt.is_regenerated) center("DUPLICATE COPY", y, 10, bold, C.amber);
    center("This is a computer-generated receipt and is valid without a signature.", 82, 8.5, regular, C.muted);
    page.drawLine({ start: { x: M, y: 57 }, end: { x: W - M, y: 57 }, thickness: 0.8, color: C.amber });
    text(fit(`Generated by Zenith · ${schoolName}`, 170, 8), M, 44, 8, regular, C.muted);
    center("Thank you for your payment.", 44, 8, italic, C.muted);
    const stamp = new Date().toLocaleString("sv-SE", { timeZone: "Africa/Nairobi" }).slice(0, 16);
    right(stamp, W - M, 44, 8, monoReg, C.muted);

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
      metadata: { ...meta, storage_path: path, template: TEMPLATE, logo: tenant?.logo_url ?? null },
    }).eq("id", receipt_id);

    return jsonResponse({ ok: true, url: signed?.signedUrl, path });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
