import { useEffect, useState } from "react";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalMessages() {
  const { activeChild } = usePortal();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeChild) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("id, body, channel, status, sent_at, created_at")
        .eq("recipient_id", activeChild.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setMessages(data || []);
      setLoading(false);
    })();
  }, [activeChild?.id]);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold mb-2">Messages</h1>
      {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
      {messages.map((m) => (
        <Card key={m.id}>
          <CardContent className="p-3 space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px]">{m.channel.toUpperCase()}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(m.sent_at || m.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{m.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}