import { useEffect, useState } from "react";
import { Brain, Activity, FileText, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface QuotaInfo {
  plan: string;
  state: "ok" | "soft_alert" | "hard_stop";
  pct_used: number;
  request_count: number;
  cost_usd: number;
  request_limit: number | null;
  cost_cap_usd: number | null;
  hard_stop_override: boolean;
}

interface UsageRow {
  feature: string;
  provider: string;
  model: string;
  total_tokens: number;
  cost_usd: number;
  created_at: string;
  cache_hit: boolean;
  status: string;
}

export function AiSettingsTab() {
  const { profile, role } = useAuth();
  const { can } = useTenant();
  const { toast } = useToast();
  const tenantId = profile?.tenant_id;
  const isAdmin = role === "school_admin" || role === "super_admin" || can("ai.admin");

  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [recent, setRecent] = useState<UsageRow[]>([]);
  const [tone, setTone] = useState("encouraging");
  const [language, setLanguage] = useState("en");
  const [hardStop, setHardStop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    void (async () => {
      setLoading(true);
      const [q, r, s] = await Promise.all([
        supabase.rpc("ai_check_quota", { _tenant: tenantId }),
        supabase.from("ai_usage_logs").select("feature,provider,model,total_tokens,cost_usd,created_at,cache_hit,status")
          .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(20),
        supabase.from("tenant_settings").select("key,value").eq("tenant_id", tenantId).in("key", ["ai.house_tone","ai.default_language","ai.hard_stop"]),
      ]);
      if (q.data) setQuota(q.data as unknown as QuotaInfo);
      if (r.data) setRecent(r.data as UsageRow[]);
      if (s.data) {
        for (const row of s.data as any[]) {
          if (row.key === "ai.house_tone") setTone(row.value?.value ?? "encouraging");
          if (row.key === "ai.default_language") setLanguage(row.value?.value ?? "en");
          if (row.key === "ai.hard_stop") setHardStop(!!row.value?.value);
        }
      }
      setLoading(false);
    })();
  }, [tenantId]);

  const saveSetting = async (key: string, value: any) => {
    if (!tenantId) return;
    setSaving(true);
    const { error } = await supabase.from("tenant_settings")
      .upsert({ tenant_id: tenantId, key, value: { value } }, { onConflict: "tenant_id,key" });
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved" });
  };

  if (loading) {
    return <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading AI settings…
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Quota card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">Monthly AI usage</h3>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Plan: {quota?.plan ?? "—"}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Requests this month" value={quota?.request_count ?? 0} />
          <Stat label="Request limit" value={quota?.request_limit ?? "∞"} />
          <Stat label="Estimated cost (USD)" value={`$${(quota?.cost_usd ?? 0).toFixed(4)}`} />
          <Stat label="Cost cap (USD)" value={quota?.cost_cap_usd ? `$${quota.cost_cap_usd.toFixed(2)}` : "∞"} />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">{quota?.pct_used ?? 0}% used</span>
            {quota?.state === "soft_alert" && (
              <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> 80% threshold reached
              </span>
            )}
            {quota?.state === "hard_stop" && (
              <span className="text-destructive inline-flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> AI calls blocked — quota exhausted
              </span>
            )}
          </div>
          <Progress value={Math.min(100, quota?.pct_used ?? 0)} className="h-2" />
        </div>
      </div>

      {/* House style */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">House style</h3>
        </div>
        <p className="text-xs text-muted-foreground">Defaults used when AI generates report card comments, letters, and parent messages.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Default tone</Label>
            <Select value={tone} onValueChange={(v) => { setTone(v); saveSetting("ai.house_tone", v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="encouraging">Encouraging</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Default language</Label>
            <Select value={language} onValueChange={(v) => { setLanguage(v); saveSetting("ai.default_language", v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Kiswahili</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-card-foreground">Manual AI hard-stop</p>
              <p className="text-xs text-muted-foreground">Block all AI calls for this school until you turn it back on.</p>
            </div>
            <Switch checked={hardStop} onCheckedChange={(v) => { setHardStop(v); saveSetting("ai.hard_stop", v); }} disabled={saving} />
          </div>
        )}
      </div>

      {/* Recent usage */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Recent AI calls</h3>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground">No AI calls recorded yet. Try a feature like AI report comments to see activity here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2 pr-3">When</th>
                  <th className="text-left py-2 pr-3">Feature</th>
                  <th className="text-left py-2 pr-3">Provider</th>
                  <th className="text-left py-2 pr-3">Model</th>
                  <th className="text-right py-2 pr-3">Tokens</th>
                  <th className="text-right py-2 pr-3">Cost</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-3">{r.feature}</td>
                    <td className="py-2 pr-3">{r.provider}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.model}</td>
                    <td className="py-2 pr-3 text-right">{r.total_tokens}</td>
                    <td className="py-2 pr-3 text-right">${Number(r.cost_usd).toFixed(4)}</td>
                    <td className="py-2">
                      {r.cache_hit
                        ? <span className="text-emerald-600 dark:text-emerald-400">cache</span>
                        : r.status === "success"
                          ? <span className="text-foreground">ok</span>
                          : <span className="text-destructive">{r.status}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-card-foreground mt-1">{value}</p>
    </div>
  );
}