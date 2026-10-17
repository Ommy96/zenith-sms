import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { eatDay } from './rules.ts';

// Exercise the actual handler with isolated HTTP-backed database fixtures.
// No live invoice edits, provider calls, or real parent messages.
Deno.test('full dry-run flow: logging, duplicate skip, tiers, opt-out', async () => {
  const originalFetch = globalThis.fetch;
  const originalServe = Deno.serve;
  const names = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ZENITH_INTERNAL_SECRET','MESSAGING_DRY_RUN'];
  const previous = names.map(name => Deno.env.get(name));
  Deno.env.set('SUPABASE_URL','https://reminder-test.invalid');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY','isolated-test-service');
  Deno.env.set('ZENITH_INTERNAL_SECRET','isolated-test-internal');
  Deno.env.set('MESSAGING_DRY_RUN','true');
  let handler: ((request: Request) => Promise<Response>) | undefined;
  // Capture the entrypoint, not an alternate implementation.
  Deno.serve = ((fn: typeof handler) => { handler = fn; return {}; }) as unknown as typeof Deno.serve;
  let dueDays = 1;
  let enabled = true;
  let claimed = false;
  const reminders: Record<string, unknown>[] = [];
  const messages: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    assertEquals(url.hostname,'reminder-test.invalid');
    const table = url.pathname.split('/').pop();
    const method = init?.method || 'GET';
    let data: unknown = [];
    if (table === 'tenants') data = [{id:'school',name:'Karama Academy'}];
    else if (table === 'tenant_settings') data = [{key:'fee_reminders_enabled',value:enabled}];
    else if (table === 'students') data = [{id:'student',first_name:'Brian',last_name:'Ombogo',admission_number:'ADM-001'}];
    else if (table === 'mpesa_config') data = {shortcode:'123456'};
    else if (table === 'invoices') {
      const today = eatDay();
      const due = new Date(Date.parse(today)-dueDays*86400000).toISOString().slice(0,10);
      data = [{id:'invoice',balance:500,status:'partial',due_date:due}];
    } else if (table === 'student_guardians') data = {guardian_id:'guardian'};
    else if (table === 'guardians') data = url.searchParams.has('portal_user_id') ? [] : {
      id:'guardian',full_name:'Test Parent',preferred_name:'Test',phone_primary:'+254700000000',whatsapp_number:null,
    };
    else if (table === 'message_templates') data = ['whatsapp','sms'].map(channel => ({
      id:channel,tenant_id:null,channel,language:'en',
      body_template:'{{school_name}}: {{parent_first_name}}, {{student_name}} owes KES {{balance_amount}}. Paybill {{paybill_number}}, account {{account_number}}, due {{due_date}}.',
    }));
    else if (table === 'claim_fee_reminder') {
      if (claimed) data = null;
      else { claimed = true; const body = JSON.parse(String(init?.body)); reminders.push({id:'reminder',reminder_tier:body.p_tier}); data='reminder'; }
    } else if (table === 'messages' && method === 'POST') {
      messages.push(JSON.parse(String(init?.body))); data={id:'message'};
    } else if (table === 'fee_reminders' && method === 'PATCH') {
      Object.assign(reminders[reminders.length-1],JSON.parse(String(init?.body))); data=null;
    } else throw new Error(`Unexpected fixture request: ${table} ${method}`);
    return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
  };
  try {
    await import('./index.ts');
    const invoke = async () => {
      if (!handler) throw new Error('Handler not loaded');
      const response = await handler(new Request('https://reminder-test.invalid/functions/v1/process-fee-reminders',{
        method:'POST',headers:{'x-zenith-internal-key':'isolated-test-internal'},body:JSON.stringify({dry_run_only:true}),
      }));
      assertEquals(response.status,200);
      return await response.json();
    };
    assertEquals((await invoke()).dry_run,1);
    assertEquals(reminders[0].reminder_tier,'gentle');
    assertEquals(reminders[0].status,'dry_run');
    assertEquals(messages[0].status,'dry_run');
    assertEquals(messages[0].channel,'whatsapp');
    assert(String(messages[0].body).includes('Brian Ombogo owes KES 500.00'));
    assert(!String(messages[0].body).includes('{{'));
    assertEquals((await invoke()).dry_run,0);
    assertEquals(reminders.length,1); assertEquals(messages.length,1);
    claimed=false; dueDays=10;
    assertEquals((await invoke()).dry_run,1); assertEquals(reminders[1].reminder_tier,'firm');
    claimed=false; dueDays=40;
    assertEquals((await invoke()).dry_run,1); assertEquals(reminders[2].reminder_tier,'final');
    enabled=false; claimed=false;
    assertEquals((await invoke()).tenants,0); assertEquals(reminders.length,3);
  } finally {
    globalThis.fetch=originalFetch; Deno.serve=originalServe;
    names.forEach((name,index) => {const value=previous[index]; if(value===undefined) Deno.env.delete(name); else Deno.env.set(name,value);});
  }
});