import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { authedUser, authErrorResponse, adminClient } from '../_shared/auth.ts';
import { requireOwnsResource } from '../_shared/ownership.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Zenith statement palette. Keep all PDF colors centralized here.
const COLORS = {
  amber: rgb(0.851, 0.467, 0.024),
  amberSoft: rgb(0.992, 0.957, 0.886),
  ink: rgb(0.102, 0.122, 0.157),
  secondary: rgb(0.290, 0.310, 0.345),
  muted: rgb(0.420, 0.400, 0.350),
  border: rgb(0.898, 0.898, 0.878),
  tableHead: rgb(0.961, 0.961, 0.941),
  rowAlt: rgb(0.980, 0.980, 0.969),
  white: rgb(1, 1, 1),
  successSoft: rgb(0.878, 0.973, 0.941),
  successText: rgb(0.024, 0.373, 0.275),
  dangerSoft: rgb(0.996, 0.910, 0.910),
  dangerText: rgb(0.600, 0.106, 0.106),
  neutralSoft: rgb(0.925, 0.925, 0.918),
  neutralText: rgb(0.300, 0.300, 0.290),
};

const PAGE = { width: 595.28, height: 841.89, margin: 56.7, footerTop: 45, contentBottom: 69 };

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || 'S';

const storagePath = (logoUrl: string) => {
  const marker = '/tenant-logos/';
  if (logoUrl.includes(marker)) return decodeURIComponent(logoUrl.split(marker)[1].split('?')[0]);
  return logoUrl.replace(/^\/+/, '').split('?')[0];
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const student_id = body?.student_id as string | undefined;
    if (!student_id) {
      return new Response(JSON.stringify({ error: 'student_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Identity + ownership (staff of the school, super admin, or linked guardian/student).
    const user = await authedUser(req);
    await requireOwnsResource({
      user, resourceType: 'student', resourceId: student_id,
      functionName: 'generate-statement-pdf', req,
    });

    const admin = adminClient();

    const { data: student } = await admin.from('students')
      .select('id, tenant_id, first_name, middle_name, last_name, admission_number, classes:current_class_id(name)')
      .eq('id', student_id).maybeSingle();
    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: tenant }, { data: invoices }, { data: payments }] = await Promise.all([
      admin.from('tenants').select('name, currency_code, address, phone, email, logo_url').eq('id', student.tenant_id).maybeSingle(),
      admin.from('invoices')
        .select('invoice_number, issue_date, due_date, total, amount_paid, balance, status')
        .eq('student_id', student_id).not('status', 'in', '("cancelled","written_off")')
        .order('issue_date', { ascending: true }),
      admin.from('payments')
        .select('paid_at, method, reference, amount, status')
        .eq('student_id', student_id)
        .order('paid_at', { ascending: true }),
    ]);

    const tenantRecord = tenant as any;
    const invoiceRows = (invoices || []) as any[];
    const paymentRows = ((payments || []) as any[]).filter((payment) => !payment.status || payment.status === 'completed' || payment.status === 'success');
    const currency = tenantRecord?.currency_code || 'KES';
    const fmt = (n: number) => `${currency} ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const totalBilled = invoiceRows.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const totalPaid = invoiceRows.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
    const totalBalance = invoiceRows.reduce((sum, item) => sum + Number(item.balance || 0), 0);
    const generatedAt = new Date();
    const statementId = `STMT-${generatedAt.getTime()}`;

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([PAGE.width, PAGE.height]);
    let y = PAGE.height - PAGE.margin;
    const contentWidth = PAGE.width - (PAGE.margin * 2);

    const fit = (value: unknown, maxWidth: number, size: number, selectedFont = font) => {
      const original = String(value ?? '—');
      if (selectedFont.widthOfTextAtSize(original, size) <= maxWidth) return original;
      let shortened = original;
      while (shortened.length > 1 && selectedFont.widthOfTextAtSize(`${shortened}…`, size) > maxWidth) shortened = shortened.slice(0, -1);
      return `${shortened}…`;
    };
    const drawText = (value: unknown, x: number, yy: number, options: { size?: number; font?: any; color?: any; maxWidth?: number } = {}) => {
      const size = options.size ?? 10;
      const selectedFont = options.font ?? font;
      page.drawText(options.maxWidth ? fit(value, options.maxWidth, size, selectedFont) : String(value ?? ''), {
        x, y: yy, size, font: selectedFont, color: options.color ?? COLORS.ink,
      });
    };
    const centered = (value: string, yy: number, size: number, selectedFont = font, color = COLORS.ink) => {
      drawText(value, (PAGE.width - selectedFont.widthOfTextAtSize(value, size)) / 2, yy, { size, font: selectedFont, color });
    };
    const rightAligned = (value: string, right: number, yy: number, size = 8.2, selectedFont = font, color = COLORS.ink) => {
      drawText(value, right - selectedFont.widthOfTextAtSize(value, size), yy, { size, font: selectedFont, color });
    };
    const roundedRect = (x: number, yy: number, width: number, height: number, radius: number, color: any) => {
      page.drawRectangle({ x: x + radius, y: yy, width: width - (radius * 2), height, color });
      page.drawRectangle({ x, y: yy + radius, width, height: height - (radius * 2), color });
      for (const [cx, cy] of [[x + radius, yy + radius], [x + width - radius, yy + radius], [x + radius, yy + height - radius], [x + width - radius, yy + height - radius]]) {
        page.drawCircle({ x: cx, y: cy, size: radius, color });
      }
    };
    const newPage = () => {
      page = pdf.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
    };
    const ensureSpace = (required: number) => {
      if (y - required < PAGE.contentBottom) newPage();
    };
    const sectionTitle = (title: string) => {
      drawText(title.toUpperCase(), PAGE.margin, y, { size: 10, font: bold, color: COLORS.secondary });
      y -= 18;
    };
    const chip = (label: string, x: number, yy: number, maxWidth: number, kind: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral') => {
      const normalized = label ? label.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—';
      const color = kind === 'success' ? COLORS.successText : kind === 'danger' ? COLORS.dangerText : kind === 'warning' ? COLORS.amber : COLORS.neutralText;
      const background = kind === 'success' ? COLORS.successSoft : kind === 'danger' ? COLORS.dangerSoft : kind === 'warning' ? COLORS.amberSoft : COLORS.neutralSoft;
      const labelWidth = Math.min(font.widthOfTextAtSize(normalized, 7.4) + 12, maxWidth);
      roundedRect(x, yy - 4, labelWidth, 15, 4, background);
      drawText(normalized, x + 6, yy, { size: 7.4, color, maxWidth: labelWidth - 12 });
    };

    // Centered school mark: use the tenant logo when available, otherwise initials.
    let logoDrawn = false;
    if (tenantRecord?.logo_url) {
      try {
        const path = storagePath(String(tenantRecord.logo_url));
        const { data: blob } = await admin.storage.from('tenant-logos').download(path);
        if (blob) {
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const image = /\.png$/i.test(path) ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const dimensions = image.scale(Math.min(1, 68 / image.height, 120 / image.width));
          page.drawImage(image, { x: (PAGE.width - dimensions.width) / 2, y: y - dimensions.height, width: dimensions.width, height: dimensions.height });
          y -= dimensions.height + 12;
          logoDrawn = true;
        }
      } catch (error) {
        console.warn('[statement] logo skipped', (error as Error).message);
      }
    }
    if (!logoDrawn) {
      const radius = 31;
      page.drawCircle({ x: PAGE.width / 2, y: y - radius, size: radius, color: COLORS.amberSoft });
      const mark = initials(tenantRecord?.name || 'School');
      const markSize = 20;
      drawText(mark, (PAGE.width - bold.widthOfTextAtSize(mark, markSize)) / 2, y - radius - 7, { size: markSize, font: bold, color: COLORS.amber });
      y -= (radius * 2) + 12;
    }

    const schoolName = tenantRecord?.name || 'School';
    centered(schoolName, y, 24, bold, COLORS.amber);
    y -= 19;
    const contact = [tenantRecord?.address, tenantRecord?.phone, tenantRecord?.email].filter(Boolean).join('  ·  ');
    if (contact) centered(fit(contact, contentWidth, 10), y, 10, font, COLORS.muted);
    y -= 20;
    page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.width - PAGE.margin, y }, thickness: 1, color: COLORS.amber });
    y -= 29;

    centered('FEE STATEMENT', y, 14, bold, COLORS.secondary);
    const generatedLabel = `Generated ${generatedAt.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    rightAligned(generatedLabel, PAGE.width - PAGE.margin, y + 2, 8.5, font, COLORS.muted);
    y -= 38;

    const cardHeight = 86;
    roundedRect(PAGE.margin, y - cardHeight, contentWidth, cardHeight, 8, COLORS.amberSoft);
    const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');
    drawText(`Student: ${fullName}`, PAGE.margin + 16, y - 25, { size: 12, font: bold, maxWidth: 285 });
    drawText(`Admission #: ${student.admission_number || '—'}`, PAGE.margin + 16, y - 45, { size: 10.5, color: COLORS.muted });
    const classRecord = student.classes as any;
    drawText(`Class: ${classRecord?.name || 'Not assigned'}`, PAGE.margin + 16, y - 64, { size: 10.5, color: COLORS.muted });
    const balanceText = fmt(totalBalance);
    rightAligned(balanceText, PAGE.width - PAGE.margin - 16, y - 34, 18, bold, COLORS.amber);
    rightAligned('Current balance', PAGE.width - PAGE.margin - 16, y - 55, 9.5, font, COLORS.muted);
    y -= cardHeight + 28;

    // Invoice table.
    sectionTitle('Invoices');
    const invoiceWidths = [80, 56, 56, 62, 76, 76, 76];
    const invoiceHeaders = ['Number', 'Issued', 'Due', 'Status', 'Total', 'Paid', 'Balance'];
    const drawInvoiceHeader = () => {
      page.drawRectangle({ x: PAGE.margin, y: y - 19, width: contentWidth, height: 25, color: COLORS.tableHead });
      let x = PAGE.margin;
      invoiceHeaders.forEach((header, index) => {
        if (index >= 4) rightAligned(header, x + invoiceWidths[index] - 7, y - 10, 8.2, bold, COLORS.secondary);
        else drawText(header, x + 7, y - 10, { size: 8.2, font: bold, color: COLORS.secondary });
        x += invoiceWidths[index];
      });
      y -= 25;
    };
    drawInvoiceHeader();
    if (!invoiceRows.length) {
      page.drawRectangle({ x: PAGE.margin, y: y - 42, width: contentWidth, height: 42, color: COLORS.white });
      centered('No invoices issued yet.', y - 25, 9.5, font, COLORS.muted);
      y -= 50;
    } else {
      invoiceRows.forEach((invoice, rowIndex) => {
        if (y - 26 < PAGE.contentBottom) {
          newPage();
          sectionTitle('Invoices — continued');
          drawInvoiceHeader();
        }
        if (rowIndex % 2 === 1) page.drawRectangle({ x: PAGE.margin, y: y - 26, width: contentWidth, height: 26, color: COLORS.rowAlt });
        const status = String(invoice.status || '—').toLowerCase();
        const values = [invoice.invoice_number || '—', invoice.issue_date || '—', invoice.due_date || '—'];
        let x = PAGE.margin;
        values.forEach((value, index) => { drawText(value, x + 7, y - 16, { size: 8.2, maxWidth: invoiceWidths[index] - 12 }); x += invoiceWidths[index]; });
        chip(status, x + 6, y - 16, invoiceWidths[3] - 12, status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : status === 'partial' ? 'warning' : 'neutral');
        x += invoiceWidths[3];
        [fmt(invoice.total), fmt(invoice.amount_paid), fmt(invoice.balance)].forEach((value, index) => {
          rightAligned(value, x + invoiceWidths[index + 4] - 7, y - 16, 7.8);
          x += invoiceWidths[index + 4];
        });
        y -= 26;
      });
      ensureSpace(34);
      page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.width - PAGE.margin, y }, thickness: 1.4, color: COLORS.border });
      y -= 22;
      let x = PAGE.margin + invoiceWidths.slice(0, 3).reduce((sum, width) => sum + width, 0);
      drawText('TOTAL', x + 7, y + 7, { size: 9, font: bold });
      x += invoiceWidths[3];
      [fmt(totalBilled), fmt(totalPaid), fmt(totalBalance)].forEach((value, index) => {
        rightAligned(value, x + invoiceWidths[index + 4] - 7, y + 7, 8.1, bold, index === 2 ? COLORS.amber : COLORS.ink);
        x += invoiceWidths[index + 4];
      });
      y -= 12;
    }

    y -= 22;
    ensureSpace(100);
    sectionTitle('Payments');
    const paymentWidths = [92, 103, 191, 96];
    const paymentHeaders = ['Date', 'Method', 'Reference', 'Amount'];
    const drawPaymentHeader = () => {
      page.drawRectangle({ x: PAGE.margin, y: y - 19, width: contentWidth, height: 25, color: COLORS.tableHead });
      let x = PAGE.margin;
      paymentHeaders.forEach((header, index) => {
        if (index === 3) rightAligned(header, x + paymentWidths[index] - 7, y - 10, 8.2, bold, COLORS.secondary);
        else drawText(header, x + 7, y - 10, { size: 8.2, font: bold, color: COLORS.secondary });
        x += paymentWidths[index];
      });
      y -= 25;
    };
    drawPaymentHeader();
    if (!paymentRows.length) {
      page.drawRectangle({ x: PAGE.margin, y: y - 42, width: contentWidth, height: 42, color: COLORS.white });
      centered('No payments recorded yet.', y - 25, 9.5, font, COLORS.muted);
      y -= 42;
    } else {
      paymentRows.forEach((payment, rowIndex) => {
        if (y - 26 < PAGE.contentBottom) {
          newPage();
          sectionTitle('Payments — continued');
          drawPaymentHeader();
        }
        if (rowIndex % 2 === 1) page.drawRectangle({ x: PAGE.margin, y: y - 26, width: contentWidth, height: 26, color: COLORS.rowAlt });
        let x = PAGE.margin;
        const paidDate = payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-KE') : '—';
        drawText(paidDate, x + 7, y - 16, { size: 8.2, maxWidth: paymentWidths[0] - 12 });
        x += paymentWidths[0];
        chip(String(payment.method || '—'), x + 6, y - 16, paymentWidths[1] - 12, 'neutral');
        x += paymentWidths[1];
        drawText(payment.reference || '—', x + 7, y - 16, { size: 8.2, maxWidth: paymentWidths[2] - 12 });
        x += paymentWidths[2];
        rightAligned(fmt(payment.amount), x + paymentWidths[3] - 7, y - 16, 8.2);
        y -= 26;
      });
    }

    // Footer is stamped after pagination is complete so every page has X of Y.
    const pages = pdf.getPages();
    pages.forEach((footerPage, index) => {
      footerPage.drawLine({ start: { x: PAGE.margin, y: PAGE.footerTop + 12 }, end: { x: PAGE.width - PAGE.margin, y: PAGE.footerTop + 12 }, thickness: 0.8, color: COLORS.amber });
      const left = `Generated by Zenith · ${schoolName}`;
      footerPage.drawText(fit(left, 190, 8), { x: PAGE.margin, y: PAGE.footerTop - 1, size: 8, font, color: COLORS.muted });
      const pageLabel = `Page ${index + 1} of ${pages.length}`;
      footerPage.drawText(pageLabel, { x: (PAGE.width - font.widthOfTextAtSize(pageLabel, 8)) / 2, y: PAGE.footerTop - 1, size: 8, font, color: COLORS.muted });
      const idLabel = `Statement ID: ${statementId}`;
      footerPage.drawText(idLabel, { x: PAGE.width - PAGE.margin - font.widthOfTextAtSize(idLabel, 8), y: PAGE.footerTop - 1, size: 8, font, color: COLORS.muted });
    });

    const bytes = await pdf.save();
    const path = `${student.tenant_id}/statements/${student.admission_number || student.id}-${Date.now()}.pdf`;
    const { error: upErr } = await admin.storage.from('receipts').upload(path, bytes, {
      contentType: 'application/pdf', upsert: true,
    });
    if (upErr) throw upErr;
    const { data: signed } = await admin.storage.from('receipts').createSignedUrl(path, 300);

    return new Response(JSON.stringify({ url: signed?.signedUrl, path }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (e: any) {
    return authErrorResponse(e, corsHeaders);
  }
});
