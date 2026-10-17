import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { balanceOf, deliver, eatDay, reminderTier, render, tenantEligible } from './rules.ts';
Deno.test('gentle covers 1–7 days overdue', () => {
  assertEquals(reminderTier('2026-10-16','2026-10-17'), 'gentle');
  assertEquals(reminderTier('2026-10-10','2026-10-17'), 'gentle');
});
Deno.test('firm covers 8–30 days and 10 day verification', () => {
  for (const due of ['2026-10-09','2026-10-07','2026-09-17']) assertEquals(reminderTier(due,'2026-10-17'), 'firm');
});
Deno.test('final covers 31+ and 40 day verification', () => {
  for (const due of ['2026-09-16','2026-09-07']) assertEquals(reminderTier(due,'2026-10-17'), 'final');
});
Deno.test('Brian due October 22 is not overdue on October 17', () => assertEquals(reminderTier('2026-10-22','2026-10-17'),null));
Deno.test('due today is not overdue', () => assertEquals(reminderTier('2026-10-17','2026-10-17'),null));
Deno.test('tenant opt-out overrides portal access', () => assertEquals(tenantEligible(false,true),false));
Deno.test('portal access or explicit enablement required', () => {
  assertEquals(tenantEligible(undefined,true),true);
  assertEquals(tenantEligible(true,false),true);
  assertEquals(tenantEligible(undefined,false),false);
});
Deno.test('only issued partial overdue balances count', () => assertEquals(balanceOf([
  {balance:100,status:'issued'},{balance:200,status:'partial'},{balance:300,status:'overdue'},
  {balance:400,status:'draft'},{balance:500,status:'void'},{balance:600,status:'paid'},
]),600));
Deno.test('EAT midnight determines daily boundary', () => assertEquals(eatDay(new Date('2026-10-17T21:00:00Z')),'2026-10-18'));
Deno.test('dry-run never calls a provider', async () => {
  let calls = 0;
  assertEquals(await deliver(true,async () => {calls++;return {ok:true};}),{channel:'whatsapp',status:'dry_run',error:null});
  assertEquals(calls,0);
});
Deno.test('WhatsApp success never sends SMS', async () => {
  const calls: string[]=[];
  await deliver(false,async channel => {calls.push(channel);return {ok:true};});
  assertEquals(calls,['whatsapp']);
});
Deno.test('WhatsApp failure falls back to SMS', async () => {
  const calls: string[]=[];
  const result=await deliver(false,async channel => {calls.push(channel);return {ok:channel==='sms',error:'not approved'};});
  assertEquals(calls,['whatsapp','sms']); assertEquals(result.status,'sent');assertEquals(result.channel,'sms');
});
Deno.test('both failures recorded',async () => assertEquals((await deliver(false,async () => ({ok:false,error:'failure'}))).status,'failed'));
Deno.test('render substitutes balance and school', () => assertEquals(render('{{school_name}} KES {{balance_amount}}',{school_name:'Karama Academy',balance_amount:'500.00'}),'Karama Academy KES 500.00'));