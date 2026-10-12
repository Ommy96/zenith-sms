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
} as const;
const safe = (s: string) => s.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const kind = body?.kind as keyof typeof KINDS;
    const id = body?.id as string;
    if (!KINDS[kind]) return json({ error: 'kind must be receipt, invoice or statement' }, 400);
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'A valid id is required' }, 400);
    const cfg = KINDS[kind];

    const user = await authedUser(req);
    await requireOwnsResource({ user, resourceType: cfg.owned, resourceId: id, functionName: 'download-document', req });

    // Render (or reuse) via the existing generator, as the caller.
    const gen = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${cfg.fn}`, {
      method: 'POST',
      headers: { Authorization: req.headers.get('Authorization') ?? '', apikey: req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ [cfg.key]: id }),
    });
    const out = await gen.json().catch(() => ({}));
    if (!gen.ok) return json({ error: out?.error || 'Could not create the PDF' }, gen.status);

    const admin = adminClient();
    let bytes: Uint8Array | null = null;
    if (out?.path) {
      const { data } = await admin.storage.from('receipts').download(out.path);
      if (data) bytes = new Uint8Array(await data.arrayBuffer());
    }
    if (!bytes && out?.url) {
      const r = await fetch(out.url);
      if (r.ok) bytes = new Uint8Array(await r.arrayBuffer());
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
