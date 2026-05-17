import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const student_id = body?.student_id as string | undefined;
    if (!student_id) {
      return new Response(JSON.stringify({ error: 'student_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: student } = await admin.from('students')
      .select('id, tenant_id, first_name, last_name, admission_number')
      .eq('id', student_id).maybeSingle();
    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // membership check
    const { data: member } = await admin.from('tenant_users')
      .select('user_id').eq('tenant_id', student.tenant_id).eq('user_id', user.id)
      .eq('is_active', true).maybeSingle();
    if (!member) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [{ data: tenant }, { data: invoices }, { data: payments }] = await Promise.all([
      admin.from('tenants').select('name, currency_code, address, phone, email').eq('id', student.tenant_id).maybeSingle(),
      admin.from('student_invoices')
        .select('invoice_number, issued_at, due_date, total, paid_total, balance, status')
        .eq('student_id', student_id).neq('status', 'void')
        .order('issued_at', { ascending: true }),
      admin.from('student_payments')
        .select('paid_at, method, reference, amount')
        .eq('student_id', student_id)
        .order('paid_at', { ascending: true }),
    ]);

    const currency = (tenant as any)?.currency_code || 'KES';
    const fmt = (n: number) => `${currency} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Build PDF
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
    if ((tenant as any)?.address) { text((tenant as any).address, M, y, { size: 9 }); y -= 11; }
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
    text('Total', M + 310, y, { size: 9, font: bold });
    text('Paid', M + 380, y, { size: 9, font: bold });
    text('Balance', M + 450, y, { size: 9, font: bold });
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    y -= 10;

    let totalBilled = 0, totalPaid = 0, totalBalance = 0;
    for (const i of (invoices || [])) {
      if (y < 80) { page = pdf.addPage([595, 842]); y = 800; }
      text((i as any).invoice_number || '—', M, y, { size: 9 });
      text((i as any).issued_at || '—', M + 110, y, { size: 9 });
      text((i as any).due_date || '—', M + 170, y, { size: 9 });
      text((i as any).status, M + 230, y, { size: 9 });
      text(fmt(Number((i as any).total)), M + 310, y, { size: 9 });
      text(fmt(Number((i as any).paid_total)), M + 380, y, { size: 9 });
      text(fmt(Number((i as any).balance)), M + 450, y, { size: 9 });
      totalBilled += Number((i as any).total);
      totalPaid += Number((i as any).paid_total);
      totalBalance += Number((i as any).balance);
      y -= 12;
    }

    y -= 8;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    y -= 12;
    text('TOTAL', M + 230, y, { size: 10, font: bold });
    text(fmt(totalBilled), M + 310, y, { size: 10, font: bold });
    text(fmt(totalPaid), M + 380, y, { size: 10, font: bold });
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
    for (const p of (payments || [])) {
      if (y < 60) { page = pdf.addPage([595, 842]); y = 800; }
      text(new Date((p as any).paid_at).toISOString().slice(0, 10), M, y, { size: 9 });
      text(((p as any).method || '').replace('_', ' '), M + 110, y, { size: 9 });
      text((p as any).reference || '—', M + 200, y, { size: 9 });
      text(fmt(Number((p as any).amount)), M + 450, y, { size: 9 });
      y -= 12;
    }

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
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});