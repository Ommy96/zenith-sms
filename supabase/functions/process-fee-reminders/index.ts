import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * Hourly cron job. Scans every tenant with payment_reminders_config.is_active
 * and finds invoices whose due_date matches today ± configured offsets.
 * For each (invoice, channel) it logs to reminder_log (deduped per day).
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const summary = { tenants: 0, candidates: 0, sent: 0, skipped: 0, errors: 0 };

  try {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const { data: configs } = await admin.from('payment_reminders_config').select('*').eq('is_active', true);

    for (const cfg of (configs ?? [])) {
      summary.tenants++;
      const offsets: { days: number; type: 'before' | 'after' }[] = [
        ...(cfg.days_before_due ?? []).map((d: number) => ({ days: d, type: 'before' as const })),
        ...(cfg.days_after_due ?? []).map((d: number) => ({ days: d, type: 'after' as const })),
      ];
      if (offsets.length === 0) continue;

      // Build list of target due dates
      const targetDates = offsets.map(o => {
        const d = new Date(today);
        d.setDate(d.getDate() + (o.type === 'before' ? o.days : -o.days));
        return { offset: o, date: d.toISOString().slice(0, 10) };
      });

      const dueDates = Array.from(new Set(targetDates.map(t => t.date)));
      const { data: invoices } = await admin.from('student_invoices')
        .select('id, student_id, invoice_number, total, balance, due_date, status')
        .eq('tenant_id', cfg.tenant_id)
        .in('due_date', dueDates)
        .gt('balance', 0)
        .not('status', 'in', '(void,paid,draft)');

      if (!invoices?.length) continue;

      // Tenant config
      const [{ data: tenant }, { data: wa }] = await Promise.all([
        admin.from('tenants').select('name, currency_code').eq('id', cfg.tenant_id).maybeSingle(),
        admin.from('whatsapp_config').select('phone_number_id, access_token').eq('tenant_id', cfg.tenant_id).maybeSingle(),
      ]);

      for (const inv of invoices) {
        summary.candidates++;

        // Primary guardian
        const { data: sg } = await admin.from('student_guardians')
          .select('is_primary_contact, guardians:guardian_id(full_name, phone_primary, email)')
          .eq('student_id', inv.student_id);
        const primary = (sg ?? []).find((x: any) => x.is_primary_contact) ?? sg?.[0];
        const g = (primary as any)?.guardians;
        if (!g) { summary.skipped++; continue; }

        const { data: stu } = await admin.from('students')
          .select('first_name, last_name, admission_number').eq('id', inv.student_id).maybeSingle();

        const offset = targetDates.find(t => t.date === inv.due_date)?.offset;
        const verb = offset?.type === 'before'
          ? `due in ${offset.days} day${offset.days === 1 ? '' : 's'}`
          : `overdue by ${offset?.days} day${offset?.days === 1 ? '' : 's'}`;
        const currency = (tenant as any)?.currency_code || 'KES';
        const balanceFmt = `${currency} ${Number(inv.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const message =
          `Dear ${g.full_name || 'Parent'}, fee invoice ${inv.invoice_number} for ${stu?.first_name ?? ''} ${stu?.last_name ?? ''} ` +
          `(${stu?.admission_number ?? ''}) is ${verb}. Outstanding balance: ${balanceFmt}. ` +
          `Please pay via M-Pesa using admission number as the reference. ` +
          `— ${(tenant as any)?.name ?? 'School'}`;

        for (const channel of (cfg.channels ?? [])) {
          // Dedupe: skip if already logged today for this (invoice, channel)
          const { data: existing } = await admin.from('reminder_log')
            .select('id').eq('invoice_id', inv.id).eq('channel', channel)
            .gte('sent_at', `${todayStr}T00:00:00Z`).limit(1);
          if (existing && existing.length > 0) { summary.skipped++; continue; }

          const recipient = channel === 'email' ? g.email : g.phone_primary;
          if (!recipient) {
            await admin.from('reminder_log').insert({
              tenant_id: cfg.tenant_id, invoice_id: inv.id, student_id: inv.student_id,
              channel, status: 'skipped', error: `No ${channel} recipient`, message,
            });
            summary.skipped++; continue;
          }

          let status = 'queued';
          let error: string | null = null;

          try {
            if (channel === 'whatsapp') {
              if (!wa?.phone_number_id || !wa?.access_token) {
                status = 'skipped'; error = 'WhatsApp not configured';
              } else {
                const res = await fetch(`https://graph.facebook.com/v20.0/${wa.phone_number_id}/messages`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${wa.access_token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: String(recipient).replace(/\D/g, ''),
                    type: 'text',
                    text: { body: message },
                  }),
                });
                if (!res.ok) { status = 'failed'; error = (await res.text()).slice(0, 300); }
                else status = 'sent';
              }
            } else if (channel === 'sms') {
              status = 'skipped'; error = 'SMS provider not configured';
            } else if (channel === 'email') {
              status = 'skipped'; error = 'Email provider not configured';
            } else {
              status = 'skipped'; error = `Unknown channel ${channel}`;
            }
          } catch (e: any) {
            status = 'failed'; error = String(e?.message ?? e);
          }

          await admin.from('reminder_log').insert({
            tenant_id: cfg.tenant_id, invoice_id: inv.id, student_id: inv.student_id,
            channel, recipient, status, error, message,
          });

          if (status === 'sent') summary.sent++;
          else if (status === 'failed') summary.errors++;
          else summary.skipped++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, ...summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e), ...summary }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});