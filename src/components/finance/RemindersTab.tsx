import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Bell, Send, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Channel = "whatsapp" | "sms" | "email";
const ALL_CHANNELS: Channel[] = ["whatsapp", "sms", "email"];

export function RemindersTab({ tenantId, canConfigure }: { tenantId: string; canConfigure: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [cfg, setCfg] = useState({
    is_active: false,
    days_before_due: "7,3,1",
    days_after_due: "1,7,14,30",
    channels: ["whatsapp"] as Channel[],
  });
  const [logs, setLogs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from("payment_reminders_config").select("*").eq("tenant_id", tenantId).maybeSingle(),
      supabase.from("reminder_log").select("*, students:student_id(first_name, last_name, admission_number)")
        .eq("tenant_id", tenantId).order("sent_at", { ascending: false }).limit(50),
    ]);
    if (c) setCfg({
      is_active: c.is_active,
      days_before_due: (c.days_before_due ?? []).join(","),
      days_after_due: (c.days_after_due ?? []).join(","),
      channels: (c.channels ?? ["whatsapp"]) as Channel[],
    });
    setLogs(l ?? []);
    setLoading(false);
  };

  useEffect(() => { if (tenantId) load(); /* eslint-disable-next-line */ }, [tenantId]);

  const parseDays = (s: string) => s.split(",").map(x => parseInt(x.trim(), 10)).filter(n => Number.isFinite(n) && n >= 0);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("payment_reminders_config").upsert({
      tenant_id: tenantId,
      is_active: cfg.is_active,
      days_before_due: parseDays(cfg.days_before_due),
      days_after_due: parseDays(cfg.days_after_due),
      channels: cfg.channels as any,
    });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Reminder settings saved" });
    load();
  };

  const runNow = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("process-fee-reminders", { body: {} });
    setRunning(false);
    if (error) return toast({ title: "Run failed", description: error.message, variant: "destructive" });
    const s = data as any;
    toast({ title: "Reminder job complete", description: `Sent ${s?.sent ?? 0}, skipped ${s?.skipped ?? 0}, errors ${s?.errors ?? 0}` });
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Automated fee reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Send reminders automatically</p>
              <p className="text-xs text-muted-foreground">Runs every hour. Skips already-notified invoices for the day.</p>
            </div>
            <Switch checked={cfg.is_active} onCheckedChange={(v) => setCfg({ ...cfg, is_active: v })} disabled={!canConfigure} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Days BEFORE due (comma-separated)</label>
              <Input value={cfg.days_before_due} onChange={(e) => setCfg({ ...cfg, days_before_due: e.target.value })} placeholder="7,3,1" disabled={!canConfigure} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Days AFTER due (comma-separated)</label>
              <Input value={cfg.days_after_due} onChange={(e) => setCfg({ ...cfg, days_after_due: e.target.value })} placeholder="1,7,14,30" disabled={!canConfigure} />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Channels</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CHANNELS.map((ch) => {
                const on = cfg.channels.includes(ch);
                return (
                  <Button key={ch} size="sm" variant={on ? "default" : "outline"} disabled={!canConfigure}
                    onClick={() => setCfg({ ...cfg, channels: on ? cfg.channels.filter(c => c !== ch) : [...cfg.channels, ch] })}>
                    {ch}
                  </Button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">SMS & Email send only when a provider is configured. WhatsApp uses your tenant&apos;s WhatsApp Business config.</p>
          </div>

          {canConfigure && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={runNow} disabled={running} className="gap-1.5">
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Run now
              </Button>
              <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent reminder activity</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">No reminders sent yet.</p> : (
            <ul className="divide-y">
              {logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{l.students?.first_name} {l.students?.last_name} <span className="text-muted-foreground">· {l.students?.admission_number}</span></p>
                    <p className="text-xs text-muted-foreground truncate">{l.recipient || "—"} · {new Date(l.sent_at).toLocaleString()}</p>
                    {l.error && <p className="text-[11px] text-destructive truncate">{l.error}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="capitalize">{l.channel}</Badge>
                    <Badge variant={l.status === "sent" ? "default" : l.status === "failed" ? "destructive" : "outline"} className="capitalize">{l.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}