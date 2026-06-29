// generate-receipt-pdf — render an A4 PDF receipt for a student_payments row,
// store it in the private `receipts` bucket, and return a signed URL.
//
// Auth model:
//   * Admin/bursar (fees.view permission OR roles school_admin/super_admin) — any receipt in tenant
//   * Parent / portal user — only receipts for students they guard
//   * Anyone else — 403
//
// The PDF is cached: if `pdf_url` exists on the receipt row and `regenerate`
// is not requested, we just sign and return.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { requireAuth, EdgeAuthError } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIGNED_URL_TTL = 60 * 60 * 24 * 30; // 30 days
const SHORT_TTL = 60 * 60 * 24 * 7;       // 7 days (share links)

function fmtMoney(n: number, ccy: string) {
  const v = Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${ccy} ${v}`;
}
function maskPhone(p?: string | null) {
  if (!p) return "";
  const s = String(p).replace(/\s+/g, "");
  if (s.length < 7) return s;
  return `${s.slice(0, 4)}****${s.slice(-3)}`;
}
function fmtDateLong(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(+dt)) return d;
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

async function buildPdf(opts: {
  tenant: any; student: any; payer: string | null; payerPhone: string | null;
  invoices: any[]; allocations: any[]; payment: any; receipt: any;
  issuedBy: string | null; currency: string;
  termBefore: number; termAfter: number;
}): Promise<Uint8Array> {
  const { tenant, student, payer, payerPhone, allocations, payment, receipt, issuedBy, currency, termBefore, termAfter } = opts;

  const doc = await PDFDocument.create();
  // A4 in points: 595.28 x 841.89
  const page = doc.addPage([595.28, 841.89]);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);

  const ink = rgb(0.07, 0.09, 0.15);
  const muted = rgb(0.42, 0.45, 0.52);
  const accent = rgb(0.31, 0.27, 0.90); // indigo-600
  const successFg = rgb(0.05, 0.45, 0.22);
  const successBg = rgb(0.86, 0.96, 0.88);

  const M = 51; // ~18mm
  const W = 595.28;
  let y = 841.89 - M;

  // === HEADER ===
  const schoolName = tenant?.name || "School";
  page.drawText(schoolName, { x: M, y: y - 14, size: 18, font: bold, color: accent });
  const headerLines = [
    tenant?.address, tenant?.phone, tenant?.email,
  ].filter(Boolean) as string[];
  let hy = y - 32;
  for (const line of headerLines) {
    page.drawText(line, { x: M, y: hy, size: 9, font: helv, color: muted });
    hy -= 11;
  }
  const meta2 = [
    tenant?.registration_number ? `Reg. No: ${tenant.registration_number}` : null,
    tenant?.nemis_code ? `NEMIS: ${tenant.nemis_code}` : null,
  ].filter(Boolean).join("   ");
  if (meta2) { page.drawText(meta2, { x: M, y: hy, size: 9, font: helv, color: muted }); hy -= 11; }

  y = Math.min(hy, y - 64) - 6;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.6, color: muted });
  y -= 22;

  // === RECEIPT META ===
  const label = "OFFICIAL RECEIPT";
  const labelW = bold.widthOfTextAtSize(label, 11);
  page.drawText(label, { x: (W - labelW) / 2, y, size: 11, font: bold, color: ink });
  y -= 18;
  const rcpNo = receipt?.receipt_number || "—";
  const rcpW = bold.widthOfTextAtSize(rcpNo, 16);
  page.drawText(rcpNo, { x: (W - rcpW) / 2, y: y - 4, size: 16, font: bold, color: ink });
  y -= 22;
  const dateStr = fmtDateLong(receipt?.issued_at || payment?.paid_at);
  const dW = helv.widthOfTextAtSize(dateStr, 10);
  page.drawText(dateStr, { x: (W - dW) / 2, y, size: 10, font: helv, color: muted });
  y -= 18;
  // Status badge
  const badgeText = "PAID";
  const bw = bold.widthOfTextAtSize(badgeText, 9) + 16;
  const bx = (W - bw) / 2;
  page.drawRectangle({ x: bx, y: y - 4, width: bw, height: 16, color: successBg });
  page.drawText(badgeText, { x: bx + 8, y: y, size: 9, font: bold, color: successFg });
  y -= 26;

  // === STUDENT / PAYER ===
  const colLeftX = M;
  const colRightX = W / 2 + 8;
  const studentName = [student?.first_name, student?.last_name].filter(Boolean).join(" ") || "—";
  const drawKV = (x: number, yy: number, label: string, value: string, valueFont = bold) => {
    page.drawText(label, { x, y: yy, size: 8, font: helv, color: muted });
    page.drawText(value, { x, y: yy - 13, size: 11, font: valueFont, color: ink });
  };
  drawKV(colLeftX, y, "RECEIVED FROM", payer || "Walk-in");
  drawKV(colRightX, y, "ON BEHALF OF", studentName);
  if (payerPhone) page.drawText(payerPhone, { x: colLeftX, y: y - 26, size: 9, font: helv, color: muted });
  const adm = student?.admission_number ? `Adm: ${student.admission_number}` : "";
  if (adm) page.drawText(adm, { x: colRightX, y: y - 26, size: 9, font: helv, color: muted });
  y -= 50;

  // === PAYMENT DETAILS ===
  page.drawText("PAYMENT DETAILS", { x: M, y, size: 9, font: bold, color: muted });
  y -= 4;
  page.drawLine({ start: { x: M, y: y - 2 }, end: { x: W - M, y: y - 2 }, thickness: 0.4, color: muted });
  y -= 16;

  const methodLabel = (payment?.method || "—").toUpperCase().replace("_", " ");
  const detailRows: [string, string][] = [
    ["Method", methodLabel],
    ["Reference", payment?.reference || "—"],
    ["Date received", fmtDateLong(payment?.paid_at)],
  ];
  if (payment?.method === "mpesa") {
    detailRows.push(["Payer phone", maskPhone(payerPhone || payment?.payer_phone)]);
  }
  for (const [k, v] of detailRows) {
    page.drawText(k, { x: M, y, size: 10, font: helv, color: muted });
    page.drawText(String(v || "—"), { x: M + 130, y, size: 10, font: helv, color: ink });
    y -= 14;
  }
  y -= 8;

  // === AMOUNT BREAKDOWN ===
  page.drawText("AMOUNT BREAKDOWN", { x: M, y, size: 9, font: bold, color: muted });
  y -= 4;
  page.drawLine({ start: { x: M, y: y - 2 }, end: { x: W - M, y: y - 2 }, thickness: 0.4, color: muted });
  y -= 16;
  page.drawText("Description", { x: M, y, size: 9, font: bold, color: muted });
  page.drawText("Amount", { x: W - M - 80, y, size: 9, font: bold, color: muted });
  y -= 14;

  let subtotal = 0;
  if (allocations.length === 0) {
    page.drawText("Payment on account", { x: M, y, size: 11, font: serif, color: ink });
    const amt = fmtMoney(Number(payment?.amount || 0), currency);
    const aw = helv.widthOfTextAtSize(amt, 11);
    page.drawText(amt, { x: W - M - aw, y, size: 11, font: helv, color: ink });
    subtotal = Number(payment?.amount || 0);
    y -= 16;
  } else {
    for (const a of allocations) {
      const inv = a.invoice || {};
      const desc = inv.invoice_number ? `Invoice ${inv.invoice_number}` : "Allocation";
      page.drawText(desc, { x: M, y, size: 11, font: serif, color: ink });
      const amt = fmtMoney(Number(a.amount || 0), currency);
      const aw = helv.widthOfTextAtSize(amt, 11);
      page.drawText(amt, { x: W - M - aw, y, size: 11, font: helv, color: ink });
      subtotal += Number(a.amount || 0);
      y -= 16;
    }
  }
  page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 0.3, color: muted });
  y -= 4;
  const totalLabel = "TOTAL RECEIVED";
  page.drawText(totalLabel, { x: M, y, size: 11, font: bold, color: ink });
  const totalStr = fmtMoney(Number(payment?.amount || 0), currency);
  const tw = bold.widthOfTextAtSize(totalStr, 12);
  page.drawText(totalStr, { x: W - M - tw, y, size: 12, font: bold, color: accent });
  y -= 24;

  // === BALANCE CARD ===
  const card = { x: M, y: y - 56, w: W - M * 2, h: 56 };
  page.drawRectangle({ x: card.x, y: card.y, width: card.w, height: card.h, borderColor: muted, borderWidth: 0.4 });
  const colW = card.w / 3;
  const cardLine = (i: number, label: string, value: string, color = ink) => {
    page.drawText(label, { x: card.x + colW * i + 10, y: card.y + 34, size: 8, font: helv, color: muted });
    page.drawText(value, { x: card.x + colW * i + 10, y: card.y + 14, size: 12, font: bold, color });
  };
  cardLine(0, "BALANCE BEFORE", fmtMoney(termBefore, currency));
  cardLine(1, "THIS PAYMENT", fmtMoney(Number(payment?.amount || 0), currency));
  cardLine(2, "BALANCE AFTER", fmtMoney(termAfter, currency), termAfter <= 0 ? successFg : ink);
  y = card.y - 24;

  // === FOOTER ===
  page.drawText(`Issued by: ${issuedBy || "—"}`, { x: M, y, size: 10, font: helv, color: ink });
  y -= 30;
  page.drawLine({ start: { x: M, y }, end: { x: M + 180, y }, thickness: 0.6, color: ink });
  page.drawText("Authorized signature", { x: M, y: y - 12, size: 8, font: helv, color: muted });
  page.drawRectangle({ x: W - M - 90, y: y - 24, width: 90, height: 64, borderColor: muted, borderWidth: 0.4 });
  page.drawText("School stamp", { x: W - M - 88, y: y - 36, size: 7, font: helv, color: muted });

  const genStr = `Generated by Zenith at ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC · Receipt ${receipt?.receipt_number || ""}`;
  page.drawText(genStr, { x: M, y: M - 24, size: 7, font: helv, color: muted });
  page.drawText("Page 1 of 1", { x: W - M - 50, y: M - 24, size: 7, font: helv, color: muted });

  return await doc.save();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAuth(req).catch((e) => { throw e; });
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const receiptId = body?.receipt_id as string | undefined;
    const regenerate = !!body?.regenerate;
    const ttl = body?.short_ttl ? SHORT_TTL : SIGNED_URL_TTL;
    if (!receiptId) return new Response(JSON.stringify({ error: "receipt_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Fetch receipt
    const { data: receipt, error: rErr } = await admin
      .from("student_receipts").select("*").eq("id", receiptId).maybeSingle();
    if (rErr || !receipt) return new Response(JSON.stringify({ error: "Receipt not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Authorize
    const isStaff = auth.isSuperAdmin
      || auth.roles.some((r) => ["school_admin", "bursar", "finance"].includes(r))
      || auth.permissions.includes("fees.view");
    const inTenant = auth.tenantIds.includes(receipt.tenant_id);
    if (!isStaff || !inTenant) {
      // parent path: check guardian -> student via payment
      const { data: pay } = await admin.from("student_payments").select("student_id, tenant_id").eq("id", receipt.payment_id).maybeSingle();
      if (!pay) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
      const { data: link } = await admin
        .from("student_guardians").select("guardian_id, guardians:guardian_id(user_id)")
        .eq("student_id", pay.student_id).limit(20);
      const guardianUserIds = (link || []).map((l: any) => l.guardians?.user_id).filter(Boolean);
      if (!guardianUserIds.includes(auth.userId)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
      }
    }

    const tenantId = receipt.tenant_id;

    // Cached path
    if (receipt.pdf_url && !regenerate) {
      const { data: signed } = await admin.storage.from("receipts").createSignedUrl(receipt.pdf_url, ttl);
      if (signed?.signedUrl) {
        return new Response(JSON.stringify({ url: signed.signedUrl, path: receipt.pdf_url, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Gather data
    const [{ data: tenant }, { data: payment }] = await Promise.all([
      admin.from("tenants").select("id, name, address, phone, email, logo_url, registration_number, nemis_code, currency_code").eq("id", tenantId).maybeSingle(),
      admin.from("student_payments").select("*").eq("id", receipt.payment_id).maybeSingle(),
    ]);
    if (!payment) return new Response(JSON.stringify({ error: "Payment missing" }), { status: 404, headers: corsHeaders });

    const [{ data: student }, { data: allocations }, { data: receivedBy }, { data: guardianLinks }] = await Promise.all([
      admin.from("students").select("id, first_name, last_name, admission_number, current_class_id").eq("id", payment.student_id).maybeSingle(),
      admin.from("payment_allocations").select("amount, invoice:invoice_id(id, invoice_number, term_id, status)").eq("payment_id", payment.id),
      payment.received_by ? admin.from("profiles").select("full_name").eq("user_id", payment.received_by).maybeSingle() : Promise.resolve({ data: null }),
      admin.from("student_guardians").select("guardian:guardian_id(full_name, phone, is_primary)").eq("student_id", payment.student_id),
    ]);

    const primary = (guardianLinks || []).map((l: any) => l.guardian).find((g: any) => g?.is_primary) || (guardianLinks || [])[0]?.guardian;
    const currency = tenant?.currency_code || "KES";

    // Term balance computation: sum balances on invoices for this student before/after this payment.
    const { data: openInvoices } = await admin
      .from("student_invoices").select("balance").eq("student_id", payment.student_id);
    const balanceAfter = (openInvoices || []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0);
    const balanceBefore = balanceAfter + Number(payment.amount || 0);

    const pdfBytes = await buildPdf({
      tenant, student, payer: primary?.full_name || null, payerPhone: primary?.phone || payment.payer_phone || null,
      invoices: [], allocations: allocations || [], payment, receipt,
      issuedBy: receivedBy?.full_name || null, currency,
      termBefore: balanceBefore, termAfter: balanceAfter,
    });

    const year = new Date(receipt.issued_at || Date.now()).getFullYear();
    const safeNo = String(receipt.receipt_number || receipt.id).replace(/[^A-Za-z0-9_-]/g, "_");
    const path = `${tenantId}/${year}/${safeNo}.pdf`;

    const { error: upErr } = await admin.storage.from("receipts").upload(path, pdfBytes, {
      contentType: "application/pdf", upsert: true,
    });
    if (upErr) {
      console.error("upload failed", upErr);
      return new Response(JSON.stringify({ error: "Upload failed", detail: upErr.message }), { status: 500, headers: corsHeaders });
    }
    await admin.from("student_receipts").update({ pdf_url: path }).eq("id", receipt.id);

    const { data: signed } = await admin.storage.from("receipts").createSignedUrl(path, ttl);
    return new Response(JSON.stringify({ url: signed?.signedUrl, path, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof EdgeAuthError) {
      return new Response(JSON.stringify({ error: e.message }), { status: e.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    console.error("generate-receipt-pdf error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});