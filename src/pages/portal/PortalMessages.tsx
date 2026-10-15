import { useState } from "react";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Mail, MessageCircle, MessageSquare, Smartphone } from "lucide-react";
import { shortDate } from "@/lib/portal/format";
import { usePortalData, must } from "@/lib/portal/usePortalData";
import { ListSkeleton, PageTitle, PortalEmpty, PortalError, StaleNote } from "@/components/portal/PortalStates";

const ICON: Record<string, any> = { whatsapp: MessageCircle, sms: Smartphone, email: Mail };
const SEEN_KEY = "portal_seen_messages";

// Parents receive only in v1 — no compose.
export default function PortalMessages() {
  const { activeChild, guardian } = usePortal();
  const [open, setOpen] = useState<any | null>(null);
  const [seen, setSeen] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch { return []; } });

  const { data, loading, error, cachedAt, retry } = usePortalData(
    activeChild ? `msg:${activeChild.id}:${guardian?.id ?? ""}` : null,
    async () => {
      const filters = [`student_id.eq.${activeChild!.id}`];
      if (guardian?.id) filters.push(`and(recipient_type.eq.guardian,recipient_id.eq.${guardian.id})`);
      return must<any[]>(await supabase.from("messages")
        .select("id, channel, subject, body, created_at, sent_at, read_at, template_key")
        .eq("direction", "outbound").or(filters.join(","))
        .neq("template_key", "portal_otp")
        .order("created_at", { ascending: false }).limit(100));
    },
  );

  const openMsg = (m: any) => {
    setOpen(m);
    if (!seen.includes(m.id)) { const next = [...seen, m.id]; setSeen(next); localStorage.setItem(SEEN_KEY, JSON.stringify(next)); }
  };

  const groups = (data ?? []).reduce<Record<string, any[]>>((acc, m) => {
    const k = shortDate(m.sent_at || m.created_at); (acc[k] ||= []).push(m); return acc;
  }, {});

  if (!activeChild) return null;
  return (
    <div className="space-y-4">
      <PageTitle sub="Messages from your school">Messages</PageTitle>
      <StaleNote at={cachedAt} onRetry={retry} />
      {loading && !data ? <ListSkeleton /> : error && !data ? <PortalError onRetry={retry} /> : !data?.length ? (
        <PortalEmpty icon={MessageSquare} title="No messages yet" text="Messages the school sends you will appear here." />
      ) : Object.entries(groups).map(([day, items]) => (
        <div key={day}>
          <p className="mb-2 text-sm font-medium text-muted-foreground">{day}</p>
          <Card><CardContent className="divide-y p-0">
            {items.map((m) => {
              const Icon = ICON[m.channel] ?? MessageSquare;
              const unread = !m.read_at && !seen.includes(m.id);
              return (
                <button key={m.id} onClick={() => openMsg(m)} className="flex min-h-16 w-full items-start gap-3 p-4 text-left">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-base ${unread ? "font-semibold" : ""}`}>{m.subject || m.body}</p>
                    <p className="text-xs text-muted-foreground">{new Date(m.sent_at || m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {m.channel}</p>
                  </div>
                  {unread && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                </button>
              );
            })}
          </CardContent></Card>
        </div>
      ))}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          {open && (<>
            <SheetHeader><SheetTitle>{open.subject || "Message"}</SheetTitle></SheetHeader>
            <p className="mt-1 text-sm text-muted-foreground">{shortDate(open.sent_at || open.created_at)} · {open.channel}</p>
            <p className="mt-4 whitespace-pre-wrap text-base">{open.body}</p>
          </>)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
