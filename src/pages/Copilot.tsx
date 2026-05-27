import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Loader2, Send, Sparkles, Wrench, ChevronDown, ChevronRight, User, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ToolCall = { tool: string; input: any; output: any };
type Msg = {
  role: "user" | "assistant";
  content: string;
  tool_calls?: ToolCall[];
  provider?: string;
  tokens?: { input: number; output: number };
};

const SUGGESTIONS = [
  "Show students with outstanding fees in Form 3",
  "Which students have been absent more than 5 times this month?",
  "What payments did we receive today?",
  "Which inventory items are below their reorder level?",
  "Give me a snapshot of the school right now",
];

export default function Copilot() {
  const { profile } = useAuth();
  const { can } = useTenant();
  const tenantId = profile?.tenant_id;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !tenantId || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ai-copilot", {
      body: { tenantId, messages: next.map((m) => ({ role: m.role, content: m.content })) },
    });
    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 0);
    const err = (data as any)?.error || error?.message;
    if (err) {
      toast({ title: "Copilot error", description: err, variant: "destructive" });
      setMessages((m) => [...m, { role: "assistant", content: `Sorry — ${err}` }]);
      return;
    }
    setMessages((m) => [...m, {
      role: "assistant",
      content: (data as any).text || "(no response)",
      tool_calls: (data as any).tool_calls ?? [],
      provider: (data as any).provider,
      tokens: (data as any).tokens,
    }]);
  };

  const reset = () => setMessages([]);

  const allowed = can("ai.use") || can("students.view");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Copilot</h1>
            <p className="text-sm text-muted-foreground">
              Ask about students, fees, attendance, staff and operations. Answers come from your live data.
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" /> New chat
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="min-h-[420px] max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="py-8 text-center space-y-4">
                <Sparkles className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Try one of these to get started</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={!allowed}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => <MessageBubble key={i} m={m} />)}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pl-1">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder={allowed ? "Ask about your school…" : "AI access not enabled for your role"}
                disabled={!allowed || busy}
                rows={1}
                className="min-h-[44px] resize-none"
              />
              <Button onClick={() => send()} disabled={!input.trim() || busy || !allowed} size="icon" className="h-11 w-11 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for newline. Copilot uses live data — always double-check before acting on the result.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MessageBubble({ m }: { m: Msg }) {
  if (m.role === "user") {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm whitespace-pre-wrap">
          {m.content}
        </div>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        {(m.tool_calls ?? []).length > 0 && <ToolActivity calls={m.tool_calls!} />}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
        {(m.provider || m.tokens) && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pt-1">
            {m.provider && <Badge variant="outline" className="text-[10px]">{m.provider}</Badge>}
            {m.tokens && <span>{m.tokens.input + m.tokens.output} tokens</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolActivity({ calls }: { calls: ToolCall[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border/60 bg-muted/30">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Wrench className="h-3.5 w-3.5 text-primary" />
        Used {calls.length} {calls.length === 1 ? "tool" : "tools"}:{" "}
        <span className="font-mono text-muted-foreground">{calls.map((c) => c.tool).join(", ")}</span>
      </button>
      {open && (
        <div className="border-t border-border/60 p-2 space-y-2">
          {calls.map((c, i) => (
            <div key={i} className="text-[11px] font-mono space-y-1">
              <div className="text-primary">→ {c.tool}({JSON.stringify(c.input)})</div>
              <pre className={cn("bg-background/60 rounded p-2 overflow-x-auto",
                c.output?.error ? "text-destructive" : "text-muted-foreground"
              )}>
                {JSON.stringify(c.output, null, 2).slice(0, 1200)}
                {JSON.stringify(c.output).length > 1200 && "\n… (truncated)"}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}