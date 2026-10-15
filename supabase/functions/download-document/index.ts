// download-document — serves receipt / invoice / statement PDFs as bytes so the
// browser never navigates to a Storage signed link (ad blockers often block those).
// The matching generate-*-pdf function still renders and stores the file; this
// function forwards the caller's own token to it, then streams the stored PDF back.
import { authedUser, authErrorResponse, adminClient } from '../_shared/auth.ts';
import { requireOwnsResource } from '../_shared/ownership.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'content-disposition',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const KINDS = {
  receipt: { fn: 'generate-receipt-pdf', key: 'receipt_id', owned: 'receipt' },
  invoice: { fn: 'generate-invoice-pdf', key: 'invoice_id', owned: 'invoice' },
  statement: { fn: 'generate-statement-pdf', key: 'student_id', owned: 'student' },
  report_card: { fn: '', key: 'report_card_id', owned: 'student' },
} as const;
const safe = (s: string) => s.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body?.kind as keyof typeof KINDS;
    const id = body?.id as string;
    if (!KINDS[kind]) return json({ error: 'kind must be receipt, invoice, statement or report_card' }, 400);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'A valid id is required' }, 400);
    const cfg = KINDS[kind];

    const user = await authedUser(req);
    const admin = adminClient();

    // Report cards: ownership is checked on the card's student; parents only get published cards.
    if (kind === 'report_card') {
      const { data: rc } = await admin.from('report_cards')
        .select('student_id, tenant_id, pdf_url, published_at, exams:exam_id(name), students:student_id(first_name, last_name)')
        .eq('id', id).maybeSingle();
      if (!rc) return json({ error: 'Report card not found' }, 404);
      const own = await requireOwnsResource({ user, resourceType: 'student', resourceId: rc.student_id, functionName: 'download-document', req });
      if (own.actorType === 'portal_guardian' && !rc.published_at) return json({ error: 'Report card not found' }, 404);
      if (!rc.pdf_url) return json({ error: 'The PDF for this report card has not been generated yet. Please check back later.' }, 404);
      let rbytes: Uint8Array | null = null;
      const m = String(rc.pdf_url).match(/\/object\/(?:sign|public)\/([^/]+)\/([^?]+)/);
      if (m) {
        const { data } = await admin.storage.from(m[1]).download(decodeURIComponent(m[2]));
        if (data) rbytes = new Uint8Array(await data.arrayBuffer());
      } else if (!/^https?:/.test(rc.pdf_url)) {
        const { data } = await admin.storage.from('reports').download(rc.pdf_url);
        if (data) rbytes = new Uint8Array(await data.arrayBuffer());
      }
      if (!rbytes) return json({ error: 'The PDF could not be found' }, 404);
      const st: any = rc.students;
      const rname = `Report-${safe([st?.first_name, st?.last_name].filter(Boolean).join('-') || 'Student')}-${safe((rc.exams as any)?.name ?? '')}`;
      return new Response(rbytes, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${rname}.pdf"`, 'Cache-Control': 'private, no-cache' } });
    }

    await requireOwnsResource({ user, resourceType: cfg.owned, resourceId: id, functionName: 'download-document', req });
    const force = body?.force_regenerate === true;

    // Invoices: reuse the stored PDF if it is newer than the invoice and the school record.
    let bytes: Uint8Array | null = null;
    if (kind === 'invoice' && !force) {
      const { data: inv } = await admin.from('invoices').select('tenant_id, invoice_number, updated_at').eq('id', id).maybeSingle();
      if (inv?.invoice_number) {
        const { data: t } = await admin.from('tenants').select('updated_at').eq('id', inv.tenant_id).maybeSingle();
        const file = String(inv.invoice_number).replace(/[^\w.-]/g, '-') + '.pdf';
        const { data: list } = await admin.storage.from('receipts').list(`${inv.tenant_id}/invoices`, { search: file });
        const hit = (list ?? []).find((f: any) => f.name === file);
        const stamp = hit?.updated_at ?? hit?.created_at;
        const fresh = stamp && new Date(stamp) > new Date(inv.updated_at) && (!t?.updated_at || new Date(stamp) > new Date(t.updated_at));
        if (fresh) {
          const { data } = await admin.storage.from('receipts').download(`${inv.tenant_id}/invoices/${file}`);
          if (data) bytes = new Uint8Array(await data.arrayBuffer());
        }
      }
    }

    // Otherwise render (receipts reuse their own stored copy) via the generator, as the caller.
    if (!bytes) {
    const gen = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${cfg.fn}`, {
      method: 'POST',
      headers: { Authorization: req.headers.get('Authorization') ?? '', apikey: req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ [cfg.key]: id, ...(force && kind === 'receipt' ? { force: true } : {}) }),
    });
    const out = await gen.json().catch(() => ({}));
    if (!gen.ok) return json({ error: out?.error || 'Could not create the PDF' }, gen.status);

    if (out?.path) {
      const { data } = await admin.storage.from('receipts').download(out.path);
      if (data) bytes = new Uint8Array(await data.arrayBuffer());
    }
    if (!bytes && out?.url) {
      const r = await fetch(out.url);
      if (r.ok) bytes = new Uint8Array(await r.arrayBuffer());
    }
    }
    if (!bytes) return json({ error: 'The PDF could not be found' }, 404);

    let name = 'document';
    if (kind === 'receipt') {
      const { data } = await admin.from('student_receipts').select('receipt_number').eq('id', id).maybeSingle();
      name = `Receipt-${safe(data?.receipt_number ?? id)}`;
    } else if (kind === 'invoice') {
      const { data } = await admin.from('invoices').select('invoice_number').eq('id', id).maybeSingle();
      name = `Invoice-${safe(data?.invoice_number ?? id)}`;
    } else {
      const { data } = await admin.from('students').select('first_name, last_name').eq('id', id).maybeSingle();
      const month = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' }).replace(' ', '');
      name = `Statement-${safe([data?.first_name, data?.last_name].filter(Boolean).join('-') || 'Student')}-${month}`;
    }

    return new Response(bytes, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}.pdf"`, 'Cache-Control': 'private, no-cache' },
    });
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
