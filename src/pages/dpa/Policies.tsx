import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText } from "lucide-react";

const KINDS = [
  { key: "privacy_policy", label: "Privacy Policy" },
  { key: "terms_of_service", label: "Terms of Service" },
  { key: "cookie_policy", label: "Cookie Policy" },
  { key: "dpia", label: "DPIA Template" },
];

const TEMPLATES: Record<string, string> = {
  privacy_policy: `# Privacy Policy\n\n## 1. Who we are\n[School name], with offices at [address], is the data controller for personal data described below.\n\n## 2. Data we collect\n- Learner identity, contact, academic, health, and financial records\n- Guardian identity and contact details\n- Staff HR and payroll records\n\n## 3. Lawful basis\nPerformance of contract, legal obligation (statutory reporting), and legitimate interest.\n\n## 4. Retention\nLearner records are retained for [N] years after exit. Statutory records follow national law.\n\n## 5. Your rights\nYou may request access, rectification, erasure, restriction, or portability. Contact our DPO: [DPO email].\n\n## 6. Hosting\nYour data is hosted in [region].\n`,
  terms_of_service: `# Terms of Service\n\n## 1. Acceptance\nBy using this platform you agree to these terms.\n\n## 2. Acceptable use\n...\n\n## 3. Account security\n...\n`,
  cookie_policy: `# Cookie Policy\n\nWe use only essential cookies for authentication and session management.\n`,
  dpia: `# Data Protection Impact Assessment\n\n## Processing activity\n...\n\n## Necessity & proportionality\n...\n\n## Risks identified\n...\n\n## Mitigations\n...\n`,
};

export default function Policies() {
  const { tenant } = useTenant();
  const [, setPolicies] = useState<any[]>([]);
  const [active, setActive] = useState("privacy_policy");
  const [draft, setDraft] = useState<any>({ title: "", version: "1.0", body_markdown: "", is_published: false });

  const load = async () => {
    if (!tenant) return;
    const { data } = await supabase.from("privacy_policies").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false });
    setPolicies(data || []);
    const latest = (data || []).find(p => p.kind === active);
    if (latest) setDraft({ title: latest.title, version: latest.version, body_markdown: latest.body_markdown, is_published: latest.is_published, id: latest.id });
    else setDraft({ title: KINDS.find(k => k.key === active)?.label || "", version: "1.0", body_markdown: TEMPLATES[active] || "", is_published: false });
  };

  useEffect(() => { load(); }, [tenant?.id, active]);

  const save = async () => {
    if (!tenant) return;
    const payload: any = { ...draft, tenant_id: tenant.id, kind: active };
    if (draft.is_published && !draft.published_at) payload.published_at = new Date().toISOString();
    const { error } = draft.id
      ? await supabase.from("privacy_policies").update(payload).eq("id", draft.id)
      : await supabase.from("privacy_policies").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved"); load();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-7 w-7 text-primary" /> Policies</h1>
        <p className="text-muted-foreground mt-1">Customise your privacy policy, terms, cookie policy, and DPIA. Published versions are public.</p>
      </div>

      <Tabs value={active} onValueChange={setActive}>
        <TabsList>
          {KINDS.map(k => <TabsTrigger key={k.key} value={k.key}>{k.label}</TabsTrigger>)}
        </TabsList>
        {KINDS.map(k => (
          <TabsContent key={k.key} value={k.key}>
            <Card>
              <CardHeader><CardTitle className="flex items-center justify-between">
                {k.label}
                {draft.is_published && <Badge variant="default">Published</Badge>}
              </CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div><Label>Title</Label><Input value={draft.title || ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
                  <div><Label>Version</Label><Input value={draft.version || ""} onChange={(e) => setDraft({ ...draft, version: e.target.value })} /></div>
                  <div>
                    <Label>Status</Label>
                    <Select value={draft.is_published ? "published" : "draft"} onValueChange={(v) => setDraft({ ...draft, is_published: v === "published" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Body (markdown)</Label>
                  <Textarea rows={20} className="font-mono text-sm" value={draft.body_markdown || ""} onChange={(e) => setDraft({ ...draft, body_markdown: e.target.value })} />
                </div>
                <Button onClick={save}>Save {draft.is_published ? "& Publish" : "Draft"}</Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}