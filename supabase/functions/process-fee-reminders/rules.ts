export type Tier = 'gentle' | 'firm' | 'final';
export function eatDay(now = new Date()): string {
  return new Date(now.getTime() + 3 * 3600000).toISOString().slice(0, 10);
}
export function reminderTier(due: string, today: string): Tier | null {
  const days = Math.floor((Date.parse(today) - Date.parse(due)) / 86400000);
  if (!Number.isFinite(days) || days < 1) return null;
  return days <= 7 ? 'gentle' : days <= 30 ? 'firm' : 'final';
}
export function tenantEligible(enabled: unknown, portalAccess: boolean): boolean {
  if (enabled === false || enabled === 'false') return false;
  return enabled === true || enabled === 'true' || portalAccess;
}
export function balanceOf(invoices: { balance: number | string; status: string }[]): number {
  return invoices.filter(i => ['issued', 'partial', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + Number(i.balance), 0);
}
export function render(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => vars[key] ?? '');
}
export async function deliver(
  dryRun: boolean,
  send: (channel: 'whatsapp' | 'sms') => Promise<{ ok: boolean; error?: string; dry_run?: boolean }>,
): Promise<{ channel: 'whatsapp' | 'sms'; status: 'sent' | 'dry_run' | 'failed'; error: string | null }> {
  if (dryRun) return { channel: 'whatsapp', status: 'dry_run', error: null };
  const attempt = async (channel: 'whatsapp' | 'sms') => {
    try { return await send(channel); } catch { return { ok: false, error: `${channel} delivery unavailable` }; }
  };
  const wa = await attempt('whatsapp');
  if (wa.ok) return { channel: 'whatsapp', status: wa.dry_run ? 'dry_run' : 'sent', error: null };
  const sms = await attempt('sms');
  return sms.ok
    ? { channel: 'sms', status: sms.dry_run ? 'dry_run' : 'sent', error: null }
    : { channel: 'sms', status: 'failed', error: `WhatsApp: ${wa.error ?? 'failed'}; SMS: ${sms.error ?? 'failed'}`.slice(0, 500) };
}