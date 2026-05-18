import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { extractVariables } from "@/lib/messaging/audience";

const CHANNELS = ["sms", "whatsapp", "email", "in_app"];
const CATEGORIES = ["fee_reminder","attendance_alert","exam_result","announcement","payment_receipt","meeting","emergency","custom"];

export function TemplatesTab({ tenantId }: { tenantId: string | undefined }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: "", slug: "", channel: "sms", category: "custom", subject: "", body: "" });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["msg-templates", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("category").order("channel");
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });

  const startCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", channel: "sms", category: "custom", subject: "", body: "" });
    setOpen(true);
  };
  const startEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, slug: t.slug, channel: t.channel, category: t.category, subject: t.subject || "", body: t.body });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("No school selected");
      if (!form.name || !form.body) throw new Error("Name and body required");
      const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      const variables = extractVariables(form.body);
      const payload = { ...form, slug, variables, tenant_id: tenantId };
      if (editing) {
        const { error } = await supabase.from("message_templates").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("message_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["msg-templates"] });
      toast.success(editing ? "Template updated" : "Template created");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["msg-templates"] });
      toast.success("Template deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} templates · Use {"{{variable}}"} syntax for merge fields</p>
        <Button size="sm" onClick={startCreate} className="gap-1.5"><Plus className="h-4 w-4" /> New template</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No templates yet. Click "New template" to create one.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t: any) => (
            <div key={t.id} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <p className="font-medium text-sm">{t.name}</p>
                    <Badge variant="outline" className="text-[10px] uppercase">{t.channel}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                    {t.is_system && <Badge variant="outline" className="text-[10px]">system</Badge>}
                  </div>
                  {t.subject && <p className="text-xs text-muted-foreground mt-1 font-medium">{t.subject}</p>}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-line">{t.body}</p>
                  {Array.isArray(t.variables) && t.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.variables.map((v: string) => (
                        <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{`{{${v}}}`}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  {!t.is_system && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => del.mutate(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Slug (optional)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" /></div>
              <div>
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {form.channel === "email" && (
              <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            )}
            <div>
              <Label>Body</Label>
              <Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Hi {{guardian_name}}, ..." />
              <p className="text-[10px] text-muted-foreground mt-1">Detected variables: {extractVariables(form.body).join(", ") || "none"}</p>
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editing ? "Update template" : "Create template")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}