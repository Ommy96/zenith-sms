import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, MessageSquare, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export function SettingsTab({ tenantId }: { tenantId: string | undefined }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<any>({
    country_code: "KE",
    sms_provider: "africastalking",
    at_username: "",
    at_api_key: "",
    at_sender_id: "",
    twilio_account_sid: "",
    twilio_auth_token: "",
    twilio_from_number: "",
    email_provider: "resend",
    resend_api_key: "",
    email_from_address: "",
    email_from_name: "",
    sms_daily_limit: 5000,
    email_daily_limit: 10000,
  });

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const { data } = await supabase.from("tenant_messaging_config").select("*").eq("tenant_id", tenantId).maybeSingle();
      if (data) setCfg(data);
      setLoading(false);
    })();
  }, [tenantId]);

  const save = async () => {
    if (!tenantId) return;
    setSaving(true);
    const payload = { ...cfg, tenant_id: tenantId };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    delete payload.sms_sent_today; delete payload.email_sent_today; delete payload.last_reset_date;
    const { error } = await supabase.from("tenant_messaging_config").upsert(payload, { onConflict: "tenant_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Provider settings saved");
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>;

  const set = (k: string, v: any) => setCfg((c: any) => ({ ...c, [k]: v }));

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">SMS provider</h3></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Country</Label>
            <Select value={cfg.country_code} onValueChange={(v) => set("country_code", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="KE">Kenya</SelectItem>
                <SelectItem value="UG">Uganda</SelectItem>
                <SelectItem value="TZ">Tanzania</SelectItem>
                <SelectItem value="NG">Nigeria</SelectItem>
                <SelectItem value="ZA">South Africa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Provider</Label>
            <Select value={cfg.sms_provider} onValueChange={(v) => set("sms_provider", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="africastalking">Africa's Talking</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {cfg.sms_provider === "africastalking" ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>AT username</Label><Input value={cfg.at_username || ""} onChange={(e) => set("at_username", e.target.value)} /></div>
            <div><Label>AT API key</Label><Input type="password" value={cfg.at_api_key || ""} onChange={(e) => set("at_api_key", e.target.value)} /></div>
            <div><Label>Sender ID (optional)</Label><Input value={cfg.at_sender_id || ""} onChange={(e) => set("at_sender_id", e.target.value)} placeholder="e.g. SCHOOL" /></div>
            <div><Label>Daily SMS limit</Label><Input type="number" value={cfg.sms_daily_limit} onChange={(e) => set("sms_daily_limit", Number(e.target.value))} /></div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Account SID</Label><Input value={cfg.twilio_account_sid || ""} onChange={(e) => set("twilio_account_sid", e.target.value)} /></div>
            <div><Label>Auth token</Label><Input type="password" value={cfg.twilio_auth_token || ""} onChange={(e) => set("twilio_auth_token", e.target.value)} /></div>
            <div><Label>From number</Label><Input value={cfg.twilio_from_number || ""} onChange={(e) => set("twilio_from_number", e.target.value)} placeholder="+1..." /></div>
            <div><Label>Daily SMS limit</Label><Input type="number" value={cfg.sms_daily_limit} onChange={(e) => set("sms_daily_limit", Number(e.target.value))} /></div>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Email (Resend)</h3></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Resend API key</Label><Input type="password" value={cfg.resend_api_key || ""} onChange={(e) => set("resend_api_key", e.target.value)} /></div>
          <div><Label>From address</Label><Input value={cfg.email_from_address || ""} onChange={(e) => set("email_from_address", e.target.value)} placeholder="noreply@school.ac.ke" /></div>
          <div><Label>From name</Label><Input value={cfg.email_from_name || ""} onChange={(e) => set("email_from_name", e.target.value)} placeholder="School Name" /></div>
          <div><Label>Daily email limit</Label><Input type="number" value={cfg.email_daily_limit} onChange={(e) => set("email_daily_limit", Number(e.target.value))} /></div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-2"><MessageSquare className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">WhatsApp</h3></div>
        <p className="text-xs text-muted-foreground">WhatsApp Business is configured separately on the WhatsApp page.</p>
      </div>

      <Button onClick={save} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save settings
      </Button>
    </div>
  );
}