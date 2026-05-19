import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Loader2, Users, Coins, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { resolveAudience, renderTemplate, type AudienceFilter, type AudienceRecipient } from "@/lib/messaging/audience";
import { loadPricing, estimateCost } from "@/lib/messaging/cost";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

const CHANNELS: Array<{ key: "sms" | "whatsapp" | "email"; label: string }> = [
  { key: "sms", label: "SMS" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
];

export function ComposeTab({ tenantId }: { tenantId: string | undefined }) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const qc = useQueryClient();

  const [scope, setScope] = useState<AudienceFilter["scope"]>("all_parents");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [channels, setChannels] = useState<("sms" | "whatsapp" | "email")[]>(["sms"]);
  const [templateId, setTemplateId] = useState<string>("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [recipients, setRecipients] = useState<AudienceRecipient[]>([]);
  const [resolving, setResolving] = useState(false);

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-mini", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase.from("classes").select("id, name, grade_level").eq("tenant_id", tenantId).order("name");
      return data || [];
    },
    enabled: !!tenantId,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates-for-compose", tenantId, channels[0]],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data } = await supabase
        .from("message_templates")
        .select("id, name, body, subject, channel, variables")
        .eq("tenant_id", tenantId)
        .in("channel", channels)
        .order("name");
      return data || [];
    },
    enabled: !!tenantId,
  });

  const { data: pricing = [] } = useQuery({
    queryKey: ["pricing", tenantId, tenant?.country_code],
    queryFn: () => loadPricing(tenantId!, tenant?.country_code || "KE"),
    enabled: !!tenantId,
  });

  // Re-resolve audience when filter changes
  useEffect(() => {
    if (!tenantId) return;
    setResolving(true);
    resolveAudience(tenantId, { scope, class_ids: classIds })
      .then(setRecipients)
      .catch((e) => toast.error(e.message))
      .finally(() => setResolving(false));
  }, [tenantId, scope, classIds]);

  const onTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x: any) => x.id === id) as any;
    if (t) {
      setBody(t.body);
      setSubject(t.subject || "");
      if (!campaignName) setCampaignName(t.name);
    }
  };

  const costs = useMemo(() => {
    return channels.map((ch) => {
      const filtered = recipients.filter((r) =>
        ch === "email" ? !!r.guardian_email : !!r.guardian_phone
      );
      const e = estimateCost(pricing as any, ch, filtered.length);
      return { channel: ch, eligible: filtered.length, ...e };
    });
  }, [channels, recipients, pricing]);

  const totalCost = costs.reduce((s, c) => s + c.total, 0);
  const currency = costs[0]?.currency || tenant?.currency_code || "KES";

  const send = useMutation({
    mutationFn: async () => {
      if (!tenantId || !user) throw new Error("Not authenticated");
      if (!body) throw new Error("Body is required");
      if (channels.length === 0) throw new Error("Pick at least one channel");
      if (recipients.length === 0) throw new Error("No recipients in audience");

      // Create campaign
      const { data: camp, error: cErr } = await supabase
        .from("broadcast_campaigns")
        .insert({
          tenant_id: tenantId,
          name: campaignName || `Broadcast ${new Date().toLocaleString()}`,
          audience_filter: { scope, class_ids: classIds } as any,
          template_id: templateId || null,
          channels: channels as any,
          scheduled_for: scheduledFor || null,
          status: scheduledFor ? "scheduled" : "sending",
          recipient_count: recipients.length,
          total_cost: totalCost,
          cost_currency: currency,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (cErr) throw cErr;

      // Build queued messages (dispatcher in Phase B will pick them up)
      const rows: any[] = [];
      for (const ch of channels) {
        for (const r of recipients) {
          const address = ch === "email" ? r.guardian_email : r.guardian_phone;
          if (!address) continue;
          const vars = {
            guardian_name: r.guardian_name || "Parent",
            student_name: r.student_name,
            student_first_name: r.student_name.split(" ")[0],
            class: r.class_name || "",
            currency,
            balance: r.balance ?? "",
            school_name: tenant?.name || "",
          };
          rows.push({
            tenant_id: tenantId,
            campaign_id: camp.id,
            sender_user_id: user.id,
            recipient_type: ch === "email" ? "email" : "phone",
            recipient_address: address,
            recipient_name: r.guardian_name,
            student_id: r.student_id,
            channel: ch,
            template_id: templateId || null,
            template_variables: vars,
            subject: ch === "email" ? renderTemplate(subject, vars) : null,
            body: renderTemplate(body, vars),
            status: scheduledFor ? "queued" : "queued",
            scheduled_for: scheduledFor || null,
          });
        }
      }
      if (rows.length === 0) throw new Error("No recipients had a reachable address for the chosen channels");

      // Chunked insert
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await supabase.from("messages").insert(rows.slice(i, i + 500));
        if (error) throw error;
      }
      // Kick the dispatcher (fire and forget — it will claim & send what's due)
      if (!scheduledFor) {
        supabase.functions.invoke("dispatch-messages", { body: { limit: Math.min(rows.length, 200) } }).catch(() => {});
      }
      return { campaign: camp.id, count: rows.length };
    },
    onSuccess: ({ count }) => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["messages-history"] });
      toast.success(`${count} messages queued`);
      setBody(""); setSubject(""); setTemplateId(""); setCampaignName("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleChannel = (c: "sms" | "whatsapp" | "email") => {
    setChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Audience */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Audience</h3></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Who</Label>
              <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_parents">All parents</SelectItem>
                  <SelectItem value="by_class">By class</SelectItem>
                  <SelectItem value="defaulters">Fee defaulters</SelectItem>
                  <SelectItem value="all_students">All students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scope === "by_class" && (
              <div>
                <Label>Classes</Label>
                <div className="border rounded-md p-2 max-h-32 overflow-auto space-y-1">
                  {classes.map((c: any) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs">
                      <Checkbox checked={classIds.includes(c.id)} onCheckedChange={(v) => setClassIds((p) => v ? [...p, c.id] : p.filter((x) => x !== c.id))} />
                      {c.name}{c.grade_level ? ` · ${c.grade_level}` : ""}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Channel + template + body */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div>
            <Label>Channels</Label>
            <div className="flex gap-2 mt-1">
              {CHANNELS.map((c) => (
                <Button key={c.key} type="button" size="sm" variant={channels.includes(c.key) ? "default" : "outline"} onClick={() => toggleChannel(c.key)}>
                  {c.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Template (optional)</Label>
            <Select value={templateId} onValueChange={onTemplate}>
              <SelectTrigger><SelectValue placeholder="Pick a template or write below" /></SelectTrigger>
              <SelectContent>
                {(templates as any[]).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} · {t.channel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {channels.includes("email") && (
            <div><Label>Email subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          )}
          <div>
            <Label>Message body</Label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hi {{guardian_name}}, ..." />
            <p className="text-[10px] text-muted-foreground mt-1">Use {"{{guardian_name}}, {{student_name}}, {{balance}}, {{currency}}, {{school_name}}"}.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Campaign name</Label><Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Optional label" /></div>
            <div><Label>Schedule (optional)</Label><Input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} /></div>
          </div>
        </div>
      </div>

      {/* Summary / preview */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Cost preview</h3></div>
          {resolving ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Calculating…</div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">{recipients.length} students matched</div>
              <ul className="space-y-1.5">
                {costs.map((c) => (
                  <li key={c.channel} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2"><Badge variant="outline" className="uppercase text-[10px]">{c.channel}</Badge>{c.eligible} reachable</span>
                    <span className="font-mono">{c.currency} {c.total.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-2 flex items-center justify-between text-sm font-semibold">
                <span>Total</span><span className="font-mono">{currency} {totalCost.toFixed(2)}</span>
              </div>
              {recipients.length > 0 && recipients.some((r) => !r.guardian_phone && !r.guardian_email) && (
                <p className="text-[10px] text-amber-600 flex items-start gap-1"><AlertTriangle className="h-3 w-3 mt-0.5" />Some students have no guardian contact and will be skipped.</p>
              )}
            </>
          )}
          <Button className="w-full gap-2" disabled={send.isPending || recipients.length === 0 || !body} onClick={() => send.mutate()}>
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {scheduledFor ? "Schedule send" : "Send now"}
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Preview</h3>
          {recipients[0] ? (
            <div className="text-xs bg-muted/40 rounded p-3 whitespace-pre-line">
              {renderTemplate(body || "(empty)", {
                guardian_name: recipients[0].guardian_name || "Parent",
                student_name: recipients[0].student_name,
                currency,
                balance: recipients[0].balance ?? "0",
                school_name: tenant?.name || "",
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No recipients yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}