import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { adminClient, authErrorResponse, requireInternalSecret } from '../_shared/auth.ts';
import { callInternal, isDryRun, normalizePhone, readBody } from '../_shared/messaging.ts';
import { balanceOf, deliver, eatDay, reminderTier, render, tenantEligible } from './rules.ts';

const Body = z.object({ dry_run_only: z.boolean().optional() }).strict();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
function checked<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
// Paginate every list: schools can exceed PostgREST's 1,000-row default.
async function all(query: any): Promise<any[]> {
  const rows: any[] = [];
  for (let start = 0; ; start += 500) {
    const page = checked<any[]>(await query.range(start, start + 499)) ?? [];
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const summary = { tenants: 0, candidates: 0, sent: 0, dry_run: 0, skipped: 0, errors: 0 };
  try {
    const admin = adminClient();
    const cronKey = req.headers.get('x-zenith-cron-key');
    let cronOk = false;
    if (cronKey) cronOk = checked(await admin.rpc('verify_cron_key', { _key: cronKey })) === true;
    if (!cronOk) requireInternalSecret(req);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'Expected an object with optional dry_run_only boolean' }, 400);
    const today = eatDay();
    const tenants = await all(admin.from('tenants').select('id,name').order('id'));
    for (const tenant of tenants) {
      try {
        const settings = await all(admin.from('tenant_settings').select('key,value')
          .eq('tenant_id', tenant.id).in('key', ['fee_reminders_enabled', 'fee_reminder_time']));
        const enabled = settings.find(s => s.key === 'fee_reminders_enabled')?.value;
        const portal = checked(await admin.from('guardians').select('id').eq('tenant_id', tenant.id)
          .not('portal_user_id', 'is', null).limit(1));
        if (!tenantEligible(enabled, Boolean(portal?.length))) { summary.skipped++; continue; }
        summary.tenants++;
        const dryRun = parsed.data.dry_run_only === true || await isDryRun(tenant.id);
        const students = await all(admin.from('students').select('id,first_name,last_name,admission_number')
          .eq('tenant_id', tenant.id).eq('status', 'active').order('id'));
        const mpesa = checked(await admin.from('mpesa_config').select('shortcode')
          .eq('tenant_id', tenant.id).eq('is_active', true).maybeSingle());
        for (const student of students) {
          let reminderId: string | null = null;
          let messageId: string | null = null;
          try {
            const invoices = await all(admin.from('invoices').select('id,balance,due_date,status')
              .eq('tenant_id', tenant.id).eq('student_id', student.id)
              .in('status', ['issued', 'partial', 'overdue']).order('id'));
            const amount = balanceOf(invoices);
            const oldest = invoices.filter(i => Number(i.balance) > 0 && i.due_date)
              .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
            const tier = oldest ? reminderTier(oldest.due_date, today) : null;
            if (amount <= 0 || !tier) { summary.skipped++; continue; }
            summary.candidates++;
            const link = checked(await admin.from('student_guardians').select('guardian_id')
              .eq('tenant_id', tenant.id).eq('student_id', student.id)
              .eq('is_primary_contact', true).eq('receives_communications', true).maybeSingle());
            if (!link) { summary.skipped++; continue; }
            const guardian = checked(await admin.from('guardians')
              .select('id,full_name,preferred_name,phone_primary,whatsapp_number')
              .eq('tenant_id', tenant.id).eq('id', link.guardian_id).single());
            const phone = normalizePhone(guardian.whatsapp_number || guardian.phone_primary || '');
            const smsPhone = normalizePhone(guardian.phone_primary || guardian.whatsapp_number || '');
            const validPhone = /^\+[1-9]\d{7,14}$/;
            if (!validPhone.test(phone)) { summary.skipped++; continue; }
            const key = `fee_reminder_${tier}`;
            const templates = await all(admin.from('message_templates').select('id,tenant_id,channel,body_template,language')
              .eq('key', key).eq('is_active', true).or(`tenant_id.is.null,tenant_id.eq.${tenant.id}`).order('id'));
            const templateFor = (channel: string) => templates.find(t => t.channel === channel && t.tenant_id === tenant.id)
              ?? templates.find(t => t.channel === channel && t.tenant_id === null);
            const waTemplate = templateFor('whatsapp');
            const smsTemplate = templateFor('sms');
            if (!waTemplate || !smsTemplate) throw new Error(`Missing reminder templates for ${tier}`);
            const vars = {
              school_name: tenant.name,
              parent_first_name: (guardian.preferred_name || guardian.full_name || 'Parent').trim().split(/\s+/)[0],
              student_name: `${student.first_name} ${student.last_name}`.trim(),
              balance_amount: amount.toFixed(2),
              paybill_number: mpesa?.shortcode || 'contact school',
              account_number: student.admission_number || 'contact school',
              due_date: oldest.due_date,
            };
            reminderId = checked(await admin.rpc('claim_fee_reminder', {
              p_tenant_id: tenant.id, p_student_id: student.id, p_invoice_id: oldest.id,
              p_tier: tier, p_phone: phone, p_amount: amount,
            }));
            if (!reminderId) { summary.skipped++; continue; }
            const createMessage = async (channel: 'whatsapp' | 'sms') => {
              const tpl = channel === 'whatsapp' ? waTemplate : smsTemplate;
              const recipient = channel === 'whatsapp' ? phone : smsPhone;
              const body = render(tpl.body_template, vars);
              const now = new Date().toISOString();
              // Never use queued: the generic dispatcher cannot preserve Meta template parameters.
              const msg = checked(await admin.from('messages').insert({
                tenant_id: tenant.id, student_id: student.id, recipient_type: 'guardian', recipient_id: guardian.id,
                recipient_phone: recipient, recipient_name: guardian.full_name, channel, direction: 'outbound',
                body, template_key: key, template_id: tpl.id, template_variables: vars,
                status: dryRun ? 'dry_run' : 'sending', sent_at: dryRun ? now : null,
                related_entity_type: 'fee_reminder', related_entity_id: reminderId,
              }).select('id').single());
              messageId = msg.id;
              checked(await admin.from('fee_reminders').update({ message_id: msg.id, channel, sent_to: recipient }).eq('id', reminderId));
              return { msg, body, recipient, tpl };
            };
            if (dryRun) await createMessage('whatsapp');
            const result = await deliver(dryRun, async channel => {
              const { msg, body, recipient, tpl } = await createMessage(channel);
              let ok = false;
              let providerDryRun = false;
              try {
                if (!validPhone.test(recipient)) throw new Error('Missing phone');
                const response = await callInternal(channel === 'whatsapp' ? 'send-whatsapp' : 'send-sms', {
                  message_id: msg.id, tenant_id: tenant.id, recipient_phone: recipient, body,
                  ...(channel === 'whatsapp' ? { template: {
                    name: key, language: tpl.language || 'en',
                    params: [vars.parent_first_name, vars.student_name, vars.balance_amount,
                      vars.paybill_number, vars.account_number, vars.school_name, vars.due_date],
                  } } : {}),
                });
                const responseBody = await readBody(response);
                ok = response.ok && responseBody?.ok === true;
                providerDryRun = responseBody?.dry_run === true;
              } catch { /* Record safe channel error; do not persist provider responses or credentials. */ }
              if (!ok) checked(await admin.from('messages').update({ status: 'failed', failed_at: new Date().toISOString(),
                error: `${channel} provider rejected or could not process reminder` }).eq('id', msg.id));
              return { ok, dry_run: providerDryRun, error: `${channel} provider rejected or could not process reminder` };
            });
            const now = new Date().toISOString();
            checked(await admin.from('fee_reminders').update({
              status: result.status, channel: result.channel, error: result.error,
              sent_at: result.status === 'failed' ? null : now,
              failed_at: result.status === 'failed' ? now : null,
            }).eq('id', reminderId));
            if (result.status === 'dry_run') summary.dry_run++;
            else if (result.status === 'sent') summary.sent++;
            else summary.errors++;
          } catch {
            summary.errors++;
            if (reminderId) checked(await admin.from('fee_reminders').update({ status: 'failed',
              failed_at: new Date().toISOString(), error: 'Reminder processing failed; check function configuration' }).eq('id', reminderId));
            if (messageId) checked(await admin.from('messages').update({ status: 'failed',
              failed_at: new Date().toISOString(), error: 'Reminder processing failed' }).eq('id', messageId));
          }
        }
      } catch { summary.errors++; }
    }
    console.log(JSON.stringify({ event: 'fee_reminders_complete', ...summary }));
    return json({ ok: summary.errors === 0, ...summary }, summary.errors ? 500 : 200);
  } catch (error) { return authErrorResponse(error, corsHeaders); }
});
