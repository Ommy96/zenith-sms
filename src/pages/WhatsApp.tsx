import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Copy, Check, Loader2, Send, Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const sb = supabase as any;

type Cfg = {
  id?: string;
  school_id: string;
  phone_number_id: string | null;
  access_token: string | null;
  business_account_id: string | null;
  webhook_verify_token: string | null;
  display_phone_number: string | null;
  is_active: boolean;
  daily_message_limit: number;
  messages_sent_today: number;
  last_reset_date: string;
};

type Template = {
  id: string;
  name: string;
  category: string;
  language: string;
  body_template: string;
  placeholder_count: number;
  placeholder_labels: string[];
  status: string;
  usage_count: number;
  last_used_at: string | null;
};

type WaMessage = {
  id: string;
  direction: "in" | "out";
  from_phone: string | null;
  to_phone: string | null;
  student_id: string | null;
  body: string | null;
  status: string;
  created_at: string;
};

type Broadcast = {
  id: string;
  audience_type: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
};

type StudentLite = { id: string; first_name: string; last_name: string; grade: string | null; guardian_phone: string | null };
type ClassLite = { id: string; name: string; grade_level: string | null };

function emptyCfg(school_id: string): Cfg {
  return {
    school_id, phone_number_id: "", access_token: "", business_account_id: "",
    webhook_verify_token: crypto.randomUUID().replace(/-/g, "").slice(0, 24),
    display_phone_number: "", is_active: true, daily_message_limit: 1000,
    messages_sent_today: 0, last_reset_date: new Date().toISOString().slice(0, 10),
  };
}

export default function WhatsApp() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Meta Cloud API integration</p>
        </div>
      </div>

      {!schoolId ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No school context.</CardContent></Card>
      ) : (
        <Tabs defaultValue="connection">
          <TabsList>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
          </TabsList>
          <TabsContent value="connection"><ConnectionTab schoolId={schoolId} /></TabsContent>
          <TabsContent value="templates"><TemplatesTab schoolId={schoolId} /></TabsContent>
          <TabsContent value="broadcast"><BroadcastTab schoolId={schoolId} /></TabsContent>
          <TabsContent value="inbox"><InboxTab schoolId={schoolId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ----------------------------- Connection ----------------------------- */
function ConnectionTab({ schoolId }: { schoolId: string }) {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/whatsapp-webhook`;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("whatsapp_config").select("*").eq("school_id", schoolId).maybeSingle();
    setCfg(data || emptyCfg(schoolId));
    setLoading(false);
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    const { error } = cfg.id
      ? await sb.from("whatsapp_config").update({ ...cfg }).eq("id", cfg.id)
      : await sb.from("whatsapp_config").insert({ ...cfg }).select().single();
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    load();
  };

  const test = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("whatsapp-test-connection");
    setTesting(false);
    if (error || (data as any)?.error) {
      toast({ title: "Connection failed", description: (data as any)?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Connection OK", description: (data as any)?.display_phone_number || "Verified" });
    }
  };

  if (loading || !cfg) return <Card><CardContent className="py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></CardContent></Card>;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Meta Cloud API credentials</CardTitle>
          <CardDescription>Get these from your Meta Business → WhatsApp → API Setup.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Phone Number ID</Label>
            <Input value={cfg.phone_number_id || ""} onChange={(e) => setCfg({ ...cfg, phone_number_id: e.target.value })} />
          </div>
          <div>
            <Label>Business Account ID</Label>
            <Input value={cfg.business_account_id || ""} onChange={(e) => setCfg({ ...cfg, business_account_id: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Access Token</Label>
            <div className="flex gap-2">
              <Input type={showToken ? "text" : "password"} value={cfg.access_token || ""} onChange={(e) => setCfg({ ...cfg, access_token: e.target.value })} />
              <Button variant="outline" size="icon" onClick={() => setShowToken(s => !s)}>{showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            </div>
          </div>
          <div>
            <Label>Webhook Verify Token</Label>
            <Input value={cfg.webhook_verify_token || ""} onChange={(e) => setCfg({ ...cfg, webhook_verify_token: e.target.value })} />
          </div>
          <div>
            <Label>Daily message limit</Label>
            <Input type="number" value={cfg.daily_message_limit} onChange={(e) => setCfg({ ...cfg, daily_message_limit: Number(e.target.value) || 0 })} />
            <p className="text-xs text-muted-foreground mt-1">Sent today: {cfg.messages_sent_today}</p>
          </div>
          <div className="md:col-span-2">
            <Label>Webhook Callback URL</Label>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Paste this URL and your verify token into Meta → Webhooks. Subscribe to <span className="font-mono">messages</span>.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={cfg.is_active} onCheckedChange={(v) => setCfg({ ...cfg, is_active: v })} />
            <Label>Active</Label>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button>
        <Button variant="outline" onClick={test} disabled={testing || !cfg.id}>{testing && <Loader2 className="h-4 w-4 animate-spin" />} Test connection</Button>
      </div>
    </motion.div>
  );
}

/* ----------------------------- Templates ----------------------------- */
function TemplatesTab({ schoolId }: { schoolId: string }) {
  const [rows, setRows] = useState<Template[]>([]);
  const [stats, setStats] = useState<Record<string, { sent: number; delivered: number; read: number; failed: number }>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Template>>({ name: "", category: "utility", language: "en", body_template: "", placeholder_labels: [] });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from("whatsapp_templates").select("*").eq("school_id", schoolId).order("name");
    setRows((data as Template[]) || []);
    const { data: msgs } = await sb.from("whatsapp_messages").select("template_id, status").eq("school_id", schoolId).not("template_id", "is", null);
    const acc: Record<string, any> = {};
    for (const m of (msgs as any[]) || []) {
      const k = m.template_id;
      acc[k] ||= { sent: 0, delivered: 0, read: 0, failed: 0 };
      if (m.status === "sent") acc[k].sent++;
      else if (m.status === "delivered") acc[k].delivered++;
      else if (m.status === "read") acc[k].read++;
      else if (m.status === "failed") acc[k].failed++;
    }
    setStats(acc);
    setLoading(false);
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.body_template) return toast({ title: "Name and body required", variant: "destructive" });
    const placeholders = (form.body_template.match(/\{\{(\d+)\}\}/g) || []).length;
    const labels = (form.placeholder_labels && form.placeholder_labels.length === placeholders) ? form.placeholder_labels : Array(placeholders).fill("").map((_, i) => `param_${i + 1}`);
    const { error } = await sb.from("whatsapp_templates").insert({
      school_id: schoolId, name: form.name, category: form.category || "utility",
      language: form.language || "en", body_template: form.body_template,
      placeholder_count: placeholders, placeholder_labels: labels, status: "approved",
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setOpen(false);
    setForm({ name: "", category: "utility", language: "en", body_template: "", placeholder_labels: [] });
    load();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Message templates</CardTitle>
            <CardDescription>Approved templates with placeholders ({"{{1}}, {{2}} ..."})</CardDescription>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add template</Button>
        </CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead>
                <TableHead>Placeholders</TableHead><TableHead>Sends</TableHead><TableHead>Delivered</TableHead>
                <TableHead>Read</TableHead><TableHead>Failed</TableHead><TableHead>Last used</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map(t => {
                  const s = stats[t.id] || { sent: 0, delivered: 0, read: 0, failed: 0 };
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                      <TableCell><Badge variant={t.status === "approved" ? "default" : "outline"}>{t.status}</Badge></TableCell>
                      <TableCell>{t.placeholder_count}</TableCell>
                      <TableCell>{t.usage_count}</TableCell>
                      <TableCell>{s.delivered}</TableCell>
                      <TableCell>{s.read}</TableCell>
                      <TableCell>{s.failed}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.last_used_at ? new Date(t.last_used_at).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-6">No templates yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. event_reminder" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="utility">Utility</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="authentication">Authentication</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Language</Label><Input value={form.language || "en"} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
            </div>
            <div>
              <Label>Body</Label>
              <Textarea rows={4} value={form.body_template || ""} onChange={(e) => setForm({ ...form, body_template: e.target.value })} placeholder="Hi {{1}}, your child {{2}} ..." />
              <p className="text-xs text-muted-foreground mt-1">Use {"{{1}}"}, {"{{2}}"}... for placeholders.</p>
            </div>
          </div>
          <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ----------------------------- Broadcast ----------------------------- */
function BroadcastTab({ schoolId }: { schoolId: string }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [audienceType, setAudienceType] = useState("all_parents");
  const [classId, setClassId] = useState("");
  const [params, setParams] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: c }, { data: s }, { data: h }] = await Promise.all([
        sb.from("whatsapp_templates").select("*").eq("school_id", schoolId).order("name"),
        sb.from("classes").select("id, name, grade_level").eq("school_id", schoolId).order("name"),
        sb.from("students").select("id, first_name, last_name, grade, guardian_phone").eq("school_id", schoolId).eq("status", "active"),
        sb.from("whatsapp_broadcasts").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(20),
      ]);
      setTemplates((t as any) || []);
      setClasses((c as any) || []);
      setStudents((s as any) || []);
      setHistory((h as any) || []);
    })();
  }, [schoolId]);

  const tmpl = useMemo(() => templates.find(t => t.id === templateId), [templates, templateId]);

  useEffect(() => {
    if (tmpl) setParams(Array(tmpl.placeholder_count).fill(""));
  }, [tmpl]);

  const recipients = useMemo(() => {
    if (audienceType === "all_parents") return students.filter(s => s.guardian_phone);
    if (audienceType === "class" && classId) {
      const c = classes.find(x => x.id === classId);
      const grade = c?.grade_level || c?.name;
      return students.filter(s => s.grade === grade && s.guardian_phone);
    }
    return [];
  }, [audienceType, classId, classes, students]);

  const send = async () => {
    if (!templateId || !audienceType) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("whatsapp-broadcast", {
      body: { template_id: templateId, audience_type: audienceType, audience_filter: audienceType === "class" ? { class_id: classId } : {}, default_params: params },
    });
    setSending(false);
    if (error || (data as any)?.error) return toast({ title: "Broadcast failed", description: (data as any)?.error || error?.message, variant: "destructive" });
    toast({ title: "Broadcast sent", description: `Sent: ${(data as any).sent}, Failed: ${(data as any).failed}` });
    const { data: h } = await sb.from("whatsapp_broadcasts").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(20);
    setHistory((h as any) || []);
  };

  const filledPreview = useMemo(() => {
    if (!tmpl) return "";
    return tmpl.body_template.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] || `[${tmpl.placeholder_labels?.[Number(n) - 1] || `param_${n}`}]`);
  }, [tmpl, params]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Compose broadcast</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger><SelectValue placeholder="Choose template" /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Audience</Label>
            <Select value={audienceType} onValueChange={setAudienceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_parents">All parents</SelectItem>
                <SelectItem value="class">Specific class</SelectItem>
                <SelectItem value="defaulters">Fee defaulters</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {audienceType === "class" && (
            <div className="md:col-span-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Pick class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {tmpl && tmpl.placeholder_count > 0 && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: tmpl.placeholder_count }).map((_, i) => {
                const label = tmpl.placeholder_labels?.[i] || `Param ${i + 1}`;
                const isStudent = label === "student_name";
                return (
                  <div key={i}>
                    <Label>{`{{${i + 1}}} — ${label}`}</Label>
                    <Input
                      value={isStudent ? "(auto-filled per recipient)" : params[i] || ""}
                      disabled={isStudent}
                      onChange={(e) => { const np = [...params]; np[i] = e.target.value; setParams(np); }}
                    />
                  </div>
                );
              })}
            </div>
          )}
          {tmpl && (
            <div className="md:col-span-2">
              <Label>Preview</Label>
              <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{filledPreview}</div>
            </div>
          )}
          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Recipients with phone: <span className="font-medium text-foreground">{audienceType === "defaulters" ? "Resolved server-side" : recipients.length}</span></p>
            <Button onClick={send} disabled={!templateId || sending}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send broadcast</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent broadcasts</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Audience</TableHead><TableHead>Recipients</TableHead><TableHead>Sent</TableHead><TableHead>Failed</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {history.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs">{new Date(b.created_at).toLocaleString()}</TableCell>
                  <TableCell>{b.audience_type}</TableCell>
                  <TableCell>{b.recipient_count}</TableCell>
                  <TableCell>{b.sent_count}</TableCell>
                  <TableCell>{b.failed_count}</TableCell>
                  <TableCell><Badge variant={b.status === "completed" ? "default" : "secondary"}>{b.status}</Badge></TableCell>
                </TableRow>
              ))}
              {history.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No broadcasts yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ----------------------------- Inbox ----------------------------- */
function InboxTab({ schoolId }: { schoolId: string }) {
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [students, setStudents] = useState<Record<string, StudentLite>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from("whatsapp_messages").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(500);
    setMessages((data as any) || []);
    const ids = Array.from(new Set(((data as any[]) || []).map(m => m.student_id).filter(Boolean)));
    if (ids.length) {
      const { data: s } = await sb.from("students").select("id, first_name, last_name, grade, guardian_phone").in("id", ids);
      const map: Record<string, StudentLite> = {};
      for (const r of (s as any[]) || []) map[r.id] = r;
      setStudents(map);
    }
  }, [schoolId]);

  useEffect(() => {
    load();
    const ch = supabase.channel("wa-msgs").on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages", filter: `school_id=eq.${schoolId}` }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, schoolId]);

  const threads = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; phone: string; student_id: string | null; last: WaMessage; unread: number }>();
    for (const m of messages) {
      const phone = m.direction === "in" ? (m.from_phone || "") : (m.to_phone || "");
      const key = m.student_id || phone;
      if (!key) continue;
      const s = m.student_id ? students[m.student_id] : null;
      const label = s ? `${s.first_name} ${s.last_name}` : phone;
      const ex = groups.get(key);
      if (!ex || new Date(m.created_at) > new Date(ex.last.created_at)) {
        groups.set(key, { key, label, phone, student_id: m.student_id, last: m, unread: 0 });
      }
    }
    return Array.from(groups.values()).sort((a, b) => +new Date(b.last.created_at) - +new Date(a.last.created_at));
  }, [messages, students]);

  const thread = useMemo(() => {
    if (!activeKey) return [];
    return messages.filter(m => (m.student_id || m.from_phone || m.to_phone) === activeKey).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  }, [messages, activeKey]);

  const active = threads.find(t => t.key === activeKey);

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("whatsapp-send", {
      body: { to: active.phone, free_text: reply, student_id: active.student_id },
    });
    setSending(false);
    if (error || (data as any)?.error) return toast({ title: "Send failed", description: (data as any)?.error || error?.message, variant: "destructive" });
    setReply("");
    load();
  };

  return (
    <Card>
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
        <div className="border-r overflow-y-auto max-h-[600px]">
          {threads.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</div>}
          {threads.map(t => (
            <button key={t.key} onClick={() => setActiveKey(t.key)} className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 ${activeKey === t.key ? "bg-muted" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(t.last.created_at).toLocaleDateString()}</div>
              </div>
              <div className="text-xs text-muted-foreground truncate">{t.last.body}</div>
            </button>
          ))}
        </div>
        <div className="md:col-span-2 flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a conversation</div>
          ) : (
            <>
              <div className="border-b px-4 py-3"><div className="font-medium">{active.label}</div><div className="text-xs text-muted-foreground">{active.phone}</div></div>
              <div className="flex-1 overflow-y-auto max-h-[450px] p-4 space-y-2 bg-muted/20">
                {thread.map(m => (
                  <div key={m.id} className={`flex ${m.direction === "in" ? "justify-start" : "justify-end"}`}>
                    <div className={`rounded-lg px-3 py-2 max-w-[70%] text-sm ${m.direction === "in" ? "bg-background border" : "bg-primary text-primary-foreground"}`}>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className={`text-[10px] mt-1 ${m.direction === "in" ? "text-muted-foreground" : "opacity-70"}`}>{new Date(m.created_at).toLocaleTimeString()} · {m.status}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-3 flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply (24h session window)…" onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }} />
                <Button onClick={sendReply} disabled={sending || !reply.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}