import { useEffect, useRef, useState } from "react";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, BookOpen, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Help me understand fractions",
  "Explain photosynthesis simply",
  "How do I solve 2x + 5 = 13?",
  "Give me tips for memorising vocabulary",
];

export default function PortalStudyBuddy() {
  const { activeChild } = usePortal();
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text: string) => {
    if (!activeChild || !text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-study-buddy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tenantId: activeChild.tenant_id,
          studentId: activeChild.id,
          subject: subject || undefined,
          messages: history,
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.text();
        throw new Error(err || "Failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.delta) {
              acc += evt.delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Study Buddy is unavailable right now");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  if (!activeChild) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        No child linked to your account yet.
      </CardContent></Card>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-200px)]">
      <Card>
        <CardContent className="py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Study Buddy</div>
            <div className="text-xs text-muted-foreground truncate">
              Helping {activeChild.first_name} learn — guided, not solved.
            </div>
          </div>
          <Badge variant="secondary" className="gap-1"><BookOpen className="h-3 w-3" /> AI</Badge>
        </CardContent>
      </Card>

      <Input
        placeholder="Subject (optional, e.g. Maths, English)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl bg-card border p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Try asking:</div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full text-left text-sm rounded-lg border px-3 py-2 hover:bg-muted transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted rounded-tl-sm"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{m.content || (streaming ? "…" : "")}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2"
      >
        <Input
          placeholder="Ask anything about homework…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
        />
        <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}