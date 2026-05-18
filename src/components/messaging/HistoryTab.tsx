import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, MessageSquare, Phone, Bell } from "lucide-react";

const statusColors: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  sending: "bg-amber-500/10 text-amber-600",
  sent: "bg-blue-500/10 text-blue-600",
  delivered: "bg-emerald-500/10 text-emerald-600",
  read: "bg-emerald-500/10 text-emerald-600",
  failed: "bg-destructive/10 text-destructive",
  opted_out: "bg-muted text-muted-foreground",
};

const channelIcons: Record<string, any> = {
  sms: Phone, whatsapp: MessageSquare, email: Mail, in_app: Bell, voice: Phone, push: Bell,
};

export function HistoryTab({ tenantId }: { tenantId: string | undefined }) {
  const [channel, setChannel] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages-history", tenantId, channel, status, search],
    queryFn: async () => {
      if (!tenantId) return [];
      let q = supabase
        .from("messages")
        .select("id, channel, status, recipient_address, recipient_name, body, subject, cost, cost_currency, sent_at, created_at, error")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (channel !== "all") q = q.eq("channel", channel as any);
      if (status !== "all") q = q.eq("status", status as any);
      if (search) q = q.or(`recipient_address.ilike.%${search}%,body.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search recipient or body" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="in_app">In-app</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No messages match these filters.</div>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {messages.map((m: any) => {
            const Icon = channelIcons[m.channel] || Bell;
            return (
              <div key={m.id} className="p-3 flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">{m.recipient_name || m.recipient_address}</span>
                    <span className="text-[10px] text-muted-foreground">{m.recipient_address}</span>
                    <Badge className={`text-[10px] ${statusColors[m.status] || ""}`}>{m.status}</Badge>
                  </div>
                  {m.subject && <p className="text-xs font-medium mt-0.5">{m.subject}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-line">{m.body}</p>
                  {m.error && <p className="text-[10px] text-destructive mt-0.5">{m.error}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">{new Date(m.sent_at || m.created_at).toLocaleString()}</p>
                  {Number(m.cost) > 0 && <p className="text-[10px] font-mono">{m.cost_currency} {Number(m.cost).toFixed(2)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}