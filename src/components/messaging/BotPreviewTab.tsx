import { useEffect, useMemo, useState } from "react";
import { Bot, Loader2, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Student = { id: string; first_name: string; last_name: string; admission_number: string | null };
type Turn = { role: "parent" | "bot"; text: string; tools?: string[] };

const SAMPLES = [
  "How much do I owe?",
  "Has my child been absent this term?",
  "What were the last exam results?",
  "When is the next school event?",
];

export function BotPreviewTab({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [quietFrom, setQuietFrom] = useState("21:00");
  const [quietTo, setQuietTo] = useState("06:00");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("students").select("id, first_name, last_name, admission_number")
        .eq("tenant_id", schoolId).eq("status", "active")
        .order("first_name").limit(100);
      setStudents((data ?? []) as Student[]);
      if (data?.[0]) setStudentId(data[0].id);

      const { data: s } = await supabase
        .from("tenant_settings").select("key,value")
        .eq("tenant_id", schoolId)
        .in("key", ["whatsapp.bot_enabled", "whatsapp.bot_quiet_hours"]);
      (s ?? []).forEach((r: any) => {
        const v = r.value?.value ?? r.value;
        if (r.key === "whatsapp.bot_enabled") setEnabled(v !== false);
        if (r.key === "whatsapp.bot_quiet_hours" && v) { setQuietFrom(v.from ?? "21:00"); setQuietTo(v.to ?? "06:00"); }
      });
    })();
  }, [schoolId]);

  const saveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase.from("tenant_settings").upsert([
      { tenant_id: schoolId, key: "whatsapp.bot_enabled", value: { value: enabled } as any },
      { tenant_id: schoolId, key: "whatsapp.bot_quiet_hours", value: { from: quietFrom, to: quietTo } as any },
    ], { onConflict: "tenant_id,key" });
    setSavingSettings(false);
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    toast({ title: "Bot settings saved" });
  };

  const ask = async (text?: string) => {
    const q = (text ?? question).trim();
    if (!q || !studentId || busy) return;
    setTurns((t) => [...t, { role: "parent", text: q }]);
    setQuestion("");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ai-parent-bot", {
      body: { tenantId: schoolId, studentId, question: q },
    });
    setBusy(false);
    const err = (data as any)?.error || error?.message;
    if (err) {
      setTurns((t) => [...t, { role: "bot", text: `Preview unavailable — ${err}` }]);
      return;
    }
    setTurns((t) => [...t, {
      role: "bot",
      text: (data as any).text ?? "(no reply)",
      tools: ((data as any).tool_calls ?? []).map((c: any) => c.tool),
    }]);
  };

  const selected = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);

  return (
    <div className="grid gap-4 lg:grid-cols-3 mt-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Bot preview</CardTitle>
          <CardDescription>
            Simulate what a parent receives on WhatsApp when they message the school about their child.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Preview as parent of</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select a learner" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}{s.admission_number ? ` · ${s.admission_number}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 min-h-[280px] max-h-[420px] overflow-y-auto p-3 space-y-3">
            {turns.length === 0 && (
              <div className="py-8 text-center space-y-3">
                <Bot className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Try a question a parent would ask</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SAMPLES.map((s) => (
                    <button key={s} onClick={() => ask(s)} disabled={!studentId}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((t, i) => t.role === "parent" ? (
              <div key={i} className="flex justify-end gap-2">
                <div className="max-w-[75%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm">{t.text}</div>
                <div className="h-7 w-7 rounded-full bg-background border flex items-center justify-center shrink-0"><User className="h-3.5 w-3.5" /></div>
              </div>
            ) : (
              <div key={i} className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-3.5 w-3.5 text-primary" /></div>
                <div className="max-w-[75%] space-y-1">
                  <div className="rounded-lg bg-background border px-3 py-2 text-sm whitespace-pre-wrap">{t.text}</div>
                  {t.tools?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {t.tools.map((tool, k) => <Badge key={k} variant="outline" className="text-[10px] font-mono">{tool}</Badge>)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Bot is typing…</div>}
          </div>

          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ask(); } }}
              placeholder={selected ? `Message about ${selected.first_name}…` : "Select a learner first"}
              disabled={!studentId || busy}
            />
            <Button onClick={() => ask()} disabled={!question.trim() || busy || !studentId} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Replies are generated from live school data for the selected learner — the same answers a linked guardian would receive.
          </p>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Bot settings</CardTitle>
          <CardDescription>Controls automatic replies to inbound parent messages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-sm">Auto-reply enabled</Label>
              <p className="text-[11px] text-muted-foreground">Answer parent questions automatically.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Quiet hours from</Label>
              <Input type="time" value={quietFrom} onChange={(e) => setQuietFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quiet hours to</Label>
              <Input type="time" value={quietTo} onChange={(e) => setQuietTo(e.target.value)} />
            </div>
          </div>
          <Button className="w-full" onClick={saveSettings} disabled={savingSettings}>
            {savingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}