import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';
import { authedUser, authErrorResponse, adminClient } from '../_shared/auth.ts';
import { requireOwnsResource } from '../_shared/ownership.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
      .select('id, tenant_id, first_name, last_name, admission_number')
      .eq('id', student_id).maybeSingle();
    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: tenant }, { data: invoices }, { data: payments }] = await Promise.all([
      admin.from('tenants').select('name, currency_code, address, phone, email').eq('id', student.tenant_id).maybeSingle(),
      admin.from('invoices')
        .select('invoice_number, issue_date, due_date, total, amount_paid, balance, status')
        .eq('student_id', student_id).not('status', 'in', '("cancelled","written_off")')
        .order('issue_date', { ascending: true }),
      admin.from('payments')
        .select('paid_at, method, reference, amount, status')
        .eq('student_id', student_id)
        .order('paid_at', { ascending: true }),
    ]);

    const currency = (tenant as any)?.currency_code || 'KES';
    const fmt = (n: number) => `${currency} ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const pdf = await PDFDocument.create();
    let page = pdf.addPage([595, 842]); // A4
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const W = 595, M = 40;
    let y = 800;

    const text = (s: string, x: number, yy: number, opts: { size?: number; font?: any; color?: any } = {}) => {
      page.drawText(s, { x, y: yy, size: opts.size ?? 10, font: opts.font ?? font, color: opts.color ?? rgb(0.1, 0.1, 0.1) });
    };

    text((tenant as any)?.name || 'School', M, y, { size: 16, font: bold });
    y -= 16;
    if ((tenant as any)?.address) { text(String((tenant as any).address), M, y, { size: 9 }); y -= 11; }
    if ((tenant as any)?.phone || (tenant as any)?.email) {
      text([(tenant as any).phone, (tenant as any).email].filter(Boolean).join(' · '), M, y, { size: 9 });
      y -= 11;
    }
    y -= 6;
    text('FEE STATEMENT', M, y, { size: 14, font: bold });
    text(new Date().toISOString().slice(0, 10), W - M - 60, y, { size: 9 });
    y -= 18;
    text(`Student: ${student.first_name} ${student.last_name}`, M, y, { size: 10, font: bold });
    y -= 12;
    text(`Admission #: ${student.admission_number || '—'}`, M, y, { size: 10 });
    y -= 20;

    // Invoices
    text('Invoices', M, y, { size: 11, font: bold });
    y -= 14;
    text('Number', M, y, { size: 9, font: bold });
    text('Issued', M + 110, y, { size: 9, font: bold });
    text('Due', M + 170, y, { size: 9, font: bold });
    text('Status', M + 230, y, { size: 9, font: bold });
    text('Total', M + 300, y, { size: 9, font: bold });
    text('Paid', M + 375, y, { size: 9, font: bold });
    text('Balance', M + 450, y, { size: 9, font: bold });
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    y -= 10;

    let totalBilled = 0, totalPaid = 0, totalBalance = 0;
    for (const i of ((invoices || []) as any[])) {
      if (y < 80) { page = pdf.addPage([595, 842]); y = 800; }
      text(i.invoice_number || '—', M, y, { size: 9 });
      text(i.issue_date || '—', M + 110, y, { size: 9 });
      text(i.due_date || '—', M + 170, y, { size: 9 });
      text(String(i.status ?? ''), M + 230, y, { size: 9 });
      text(fmt(Number(i.total)), M + 300, y, { size: 9 });
      text(fmt(Number(i.amount_paid)), M + 375, y, { size: 9 });
      text(fmt(Number(i.balance)), M + 450, y, { size: 9 });
      totalBilled += Number(i.total || 0);
      totalPaid += Number(i.amount_paid || 0);
      totalBalance += Number(i.balance || 0);
      y -= 12;
    }
    if (!invoices?.length) { text('No invoices yet.', M, y, { size: 9 }); y -= 12; }

    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    y -= 12;
    text('TOTAL', M + 230, y, { size: 10, font: bold });
    text(fmt(totalBilled), M + 300, y, { size: 10, font: bold });
    text(fmt(totalPaid), M + 375, y, { size: 10, font: bold });
    text(fmt(totalBalance), M + 450, y, { size: 10, font: bold, color: totalBalance > 0 ? rgb(0.8, 0.1, 0.1) : rgb(0.05, 0.5, 0.1) });
    y -= 24;

    // Payments
    if (y < 140) { page = pdf.addPage([595, 842]); y = 800; }
    text('Payments', M, y, { size: 11, font: bold });
    y -= 14;
    text('Date', M, y, { size: 9, font: bold });
    text('Method', M + 110, y, { size: 9, font: bold });
    text('Reference', M + 200, y, { size: 9, font: bold });
    text('Amount', M + 450, y, { size: 9, font: bold });
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    y -= 10;
    for (const p of ((payments || []) as any[])) {
      if (p.status && p.status !== 'completed' && p.status !== 'success') continue;
      if (y < 60) { page = pdf.addPage([595, 842]); y = 800; }
      text(p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 10) : '—', M, y, { size: 9 });
      text(String(p.method || '').replace(/_/g, ' '), M + 110, y, { size: 9 });
      text(p.reference || '—', M + 200, y, { size: 9 });
      text(fmt(Number(p.amount)), M + 450, y, { size: 9 });
      y -= 12;
    }
    if (!payments?.length) { text('No payments recorded.', M, y, { size: 9 }); }

    const bytes = await pdf.save();
    const path = `${student.tenant_id}/statements/${student.admission_number || student.id}-${Date.now()}.pdf`;
    const { error: upErr } = await admin.storage.from('documents').upload(path, bytes, {
      contentType: 'application/pdf', upsert: true,
    });
    if (upErr) throw upErr;
    const { data: signed } = await admin.storage.from('documents').createSignedUrl(path, 300);

    return new Response(JSON.stringify({ url: signed?.signedUrl, path }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (e: any) {
    return authErrorResponse(e, corsHeaders);
  }
});
