// generate-invoice-pdf — branded A4 invoice (same look as the fee statement),
// stored privately at receipts/{tenant_id}/invoices/{invoice_number}.pdf.
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { authedUser, authErrorResponse, adminClient } from '../_shared/auth.ts';
import { requireOwnsResource } from '../_shared/ownership.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const COLORS = {
  amber: rgb(0.851, 0.467, 0.024), amberSoft: rgb(0.992, 0.957, 0.886),
  ink: rgb(0.102, 0.122, 0.157), secondary: rgb(0.290, 0.310, 0.345), muted: rgb(0.420, 0.400, 0.350),
  border: rgb(0.898, 0.898, 0.878), tableHead: rgb(0.961, 0.961, 0.941), rowAlt: rgb(0.980, 0.980, 0.969),
  successSoft: rgb(0.878, 0.973, 0.941), successText: rgb(0.024, 0.373, 0.275),
  dangerSoft: rgb(0.996, 0.910, 0.910), dangerText: rgb(0.600, 0.106, 0.106),
  infoSoft: rgb(0.886, 0.925, 0.996), infoText: rgb(0.114, 0.306, 0.847),
  neutralSoft: rgb(0.925, 0.925, 0.918), neutralText: rgb(0.300, 0.300, 0.290),
};
const PAGE = { width: 595.28, height: 841.89, margin: 56.7, footerTop: 45, contentBottom: 69 };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const invoice_id = body?.invoice_id as string | undefined;
    if (!invoice_id || !/^[0-9a-f-]{36}$/i.test(invoice_id)) return json({ error: 'invoice_id required' }, 400);
    const user = await authedUser(req);
    await requireOwnsResource({ user, resourceType: 'invoice', resourceId: invoice_id, functionName: 'generate-invoice-pdf', req });

    const admin = adminClient();
    const { data: inv } = await admin.from('invoices')
      .select('*, students:student_id(id, first_name, middle_name, last_name, admission_number), terms:term_id(name), academic_years:academic_year_id(name)')
      .eq('id', invoice_id).maybeSingle();
    if (!inv) return json({ error: 'Invoice not found' }, 404);
    const [{ data: tenant }, { data: lines }, { data: enr }] = await Promise.all([
      admin.from('tenants').select('name, address, phone, email, logo_url, currency_code').eq('id', inv.tenant_id).maybeSingle(),
      admin.from('invoice_line_items').select('description, quantity, unit_amount, line_total').eq('invoice_id', invoice_id).order('sort_order'),
      admin.from('student_enrollments').select('classes:class_id(name)').eq('student_id', inv.student_id).eq('status', 'active').limit(1).maybeSingle(),
    ]);
    const currency = inv.currency || tenant?.currency_code || 'KES';
    const fmt = (n: number) => `${currency} ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([PAGE.width, PAGE.height]);
    let y = PAGE.height - PAGE.margin;
    const W = PAGE.width - PAGE.margin * 2;
    const fit = (v: unknown, max: number, size: number, f = font) => {
      let s = String(v ?? '—'); if (f.widthOfTextAtSize(s, size) <= max) return s;
      while (s.length > 1 && f.widthOfTextAtSize(`${s}…`, size) > max) s = s.slice(0, -1); return `${s}…`;
    };
    const text = (v: unknown, x: number, yy: number, o: { size?: number; f?: any; color?: any; max?: number } = {}) => {
      const size = o.size ?? 10, f = o.f ?? font;
      page.drawText(o.max ? fit(v, o.max, size, f) : String(v ?? '—'), { x, y: yy, size, font: f, color: o.color ?? COLORS.ink });
    };
    const center = (v: string, yy: number, size: number, f = font, color = COLORS.ink) => text(v, (PAGE.width - f.widthOfTextAtSize(v, size)) / 2, yy, { size, f, color });
    const right = (v: string, r: number, yy: number, size = 9, f = font, color = COLORS.ink) => text(v, r - f.widthOfTextAtSize(v, size), yy, { size, f, color });

    // Header: logo or monogram, school name, contacts, amber rule.
    let logo = false;
    if (tenant?.logo_url) {
      try {
        const m = '/tenant-logos/'; const path = tenant.logo_url.includes(m) ? decodeURIComponent(tenant.logo_url.split(m)[1].split('?')[0]) : tenant.logo_url;
        const { data: blob } = await admin.storage.from('tenant-logos').download(path);
        if (blob) {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const img = /\.png$/i.test(path) ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const d = img.scale(Math.min(1, 68 / img.height, 120 / img.width));
          page.drawImage(img, { x: (PAGE.width - d.width) / 2, y: y - d.height, width: d.width, height: d.height });
          y -= d.height + 12; logo = true;
        }
      } catch (e) { console.warn('[invoice] logo skipped', (e as Error).message); }
    }
    const schoolName = tenant?.name || 'School';
    if (!logo) {
      const mark = schoolName.trim().split(/\s+/).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();
      page.drawCircle({ x: PAGE.width / 2, y: y - 31, size: 31, color: COLORS.amberSoft });
      center(mark, y - 38, 20, bold, COLORS.amber); y -= 74;
    }
    center(schoolName, y, 24, bold, COLORS.amber); y -= 19;
    const contact = [tenant?.address, tenant?.phone, tenant?.email].filter(Boolean).join('  ·  ');
    if (contact) center(fit(contact, W, 10), y, 10, font, COLORS.muted);
    y -= 20;
    page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.width - PAGE.margin, y }, thickness: 1, color: COLORS.amber });
    y -= 29;

    // Title row with status chip.
    text('INVOICE', PAGE.margin, y, { size: 16, f: bold, color: COLORS.secondary });
    text(inv.invoice_number || '—', PAGE.margin + 80, y + 1, { size: 12, f: bold });
    const status = String(inv.status || 'draft');
    const label = status === 'written_off' ? 'Voided' : status.charAt(0).toUpperCase() + status.slice(1);
    const [bg, fg] = status === 'paid' ? [COLORS.successSoft, COLORS.successText] : status === 'overdue' ? [COLORS.dangerSoft, COLORS.dangerText]
      : status === 'partial' ? [COLORS.amberSoft, COLORS.amber] : status === 'issued' ? [COLORS.infoSoft, COLORS.infoText] : [COLORS.neutralSoft, COLORS.neutralText];
    const cw = bold.widthOfTextAtSize(label, 9) + 18;
    page.drawRectangle({ x: PAGE.width - PAGE.margin - cw, y: y - 5, width: cw, height: 19, color: bg });
    text(label, PAGE.width - PAGE.margin - cw + 9, y + 1, { size: 9, f: bold, color: fg });
    y -= 30;

    // Bill-to card + dates.
    const cardH = 92;
    page.drawRectangle({ x: PAGE.margin, y: y - cardH, width: W, height: cardH, color: COLORS.amberSoft });
    const st = inv.students as any;
    text('BILL TO', PAGE.margin + 16, y - 20, { size: 8, f: bold, color: COLORS.muted });
    text([st?.first_name, st?.middle_name, st?.last_name].filter(Boolean).join(' '), PAGE.margin + 16, y - 38, { size: 12.5, f: bold, max: 260 });
    text(`Admission #: ${st?.admission_number || '—'}`, PAGE.margin + 16, y - 56, { size: 10, color: COLORS.muted });
    text(`Class: ${(enr as any)?.classes?.name || 'Not assigned'}`, PAGE.margin + 16, y - 72, { size: 10, color: COLORS.muted });
    const rows: [string, string][] = [
      ['Issue date', inv.issue_date || '—'], ['Due date', inv.due_date || '—'],
      ['Term', `${(inv.terms as any)?.name ?? '—'} · ${(inv.academic_years as any)?.name ?? ''}`],
    ];
    rows.forEach(([k, v], i) => {
      text(k, PAGE.margin + 300, y - 24 - i * 18, { size: 9, color: COLORS.muted });
      right(v, PAGE.width - PAGE.margin - 16, y - 24 - i * 18, 9.5, bold);
    });
    y -= cardH + 28;

    // Line items.
    const widths = [W - 250, 50, 100, 100];
    const heads = ['Description', 'Qty', 'Unit price', 'Amount'];
    const header = () => {
      page.drawRectangle({ x: PAGE.margin, y: y - 19, width: W, height: 25, color: COLORS.tableHead });
      let x = PAGE.margin;
      heads.forEach((h, i) => { if (i) right(h, x + widths[i] - 8, y - 10, 8.5, bold, COLORS.secondary); else text(h, x + 8, y - 10, { size: 8.5, f: bold, color: COLORS.secondary }); x += widths[i]; });
      y -= 25;
    };
    header();
    const items = (lines ?? []) as any[];
    if (!items.length) { center('No line items.', y - 22, 9.5, font, COLORS.muted); y -= 40; }
    items.forEach((l, i) => {
      if (y - 26 < PAGE.contentBottom + 120) { page = pdf.addPage([PAGE.width, PAGE.height]); y = PAGE.height - PAGE.margin; header(); }
      if (i % 2) page.drawRectangle({ x: PAGE.margin, y: y - 26, width: W, height: 26, color: COLORS.rowAlt });
      let x = PAGE.margin;
      text(l.description, x + 8, y - 16, { size: 9, max: widths[0] - 16 }); x += widths[0];
      right(String(Number(l.quantity)), x + widths[1] - 8, y - 16); x += widths[1];
      right(fmt(l.unit_amount), x + widths[2] - 8, y - 16); x += widths[2];
      right(fmt(l.line_total), x + widths[3] - 8, y - 16, 9, bold);
      y -= 26;
    });
    page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.width - PAGE.margin, y }, thickness: 1.2, color: COLORS.border });
    y -= 22;

    // Totals block.
    const totals: [string, number, boolean][] = [
      ['Subtotal', inv.subtotal, false], ['Discounts', inv.discount_total, false], ['VAT', inv.vat_total, false],
      ['Total', inv.total, true], ['Paid', inv.amount_paid, false],
    ];
    totals.forEach(([k, v, strong]) => {
      text(k, PAGE.width - PAGE.margin - 230, y, { size: 10, f: strong ? bold : font, color: strong ? COLORS.ink : COLORS.muted });
      right(fmt(v), PAGE.width - PAGE.margin - 8, y, 10, strong ? bold : font); y -= 18;
    });
    page.drawRectangle({ x: PAGE.width - PAGE.margin - 240, y: y - 12, width: 240, height: 30, color: COLORS.amberSoft });
    text('Balance due', PAGE.width - PAGE.margin - 230, y, { size: 11, f: bold });
    right(fmt(inv.balance), PAGE.width - PAGE.margin - 8, y, 13, bold, COLORS.amber);
    y -= 44;
    if (inv.notes) { text('Notes', PAGE.margin, y, { size: 9, f: bold, color: COLORS.secondary }); text(inv.notes, PAGE.margin, y - 14, { size: 9, color: COLORS.muted, max: W }); }

    const pages = pdf.getPages();
    pages.forEach((p, i) => {
      p.drawLine({ start: { x: PAGE.margin, y: PAGE.footerTop + 12 }, end: { x: PAGE.width - PAGE.margin, y: PAGE.footerTop + 12 }, thickness: 0.8, color: COLORS.amber });
      p.drawText(fit(`Generated by Zenith · ${schoolName}`, 190, 8), { x: PAGE.margin, y: PAGE.footerTop - 1, size: 8, font, color: COLORS.muted });
      const pl = `Page ${i + 1} of ${pages.length}`;
      p.drawText(pl, { x: (PAGE.width - font.widthOfTextAtSize(pl, 8)) / 2, y: PAGE.footerTop - 1, size: 8, font, color: COLORS.muted });
      const id = `Invoice ${inv.invoice_number}`;
      p.drawText(id, { x: PAGE.width - PAGE.margin - font.widthOfTextAtSize(id, 8), y: PAGE.footerTop - 1, size: 8, font, color: COLORS.muted });
    });

    const bytes = await pdf.save();
    const safe = String(inv.invoice_number || inv.id).replace(/[^\w.-]/g, '-');
    const path = `${inv.tenant_id}/invoices/${safe}.pdf`;
    const { error: upErr } = await admin.storage.from('receipts').upload(path, bytes, { contentType: 'application/pdf', upsert: true });
    if (upErr) throw upErr;
    const { data: signed } = await admin.storage.from('receipts').createSignedUrl(path, 300);
    return json({ url: signed?.signedUrl, path });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
