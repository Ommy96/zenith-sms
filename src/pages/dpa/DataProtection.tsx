import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, Globe, FileText, Mail, Phone } from "lucide-react";

export default function DataProtection() {
  const { tenant, refresh } = useTenant();
  const [dpo, setDpo] = useState<any>({ full_name: "", email: "", phone: "", registration_number: "" });
  const [region, setRegion] = useState(tenant?.["data_hosting_region" as keyof typeof tenant] as string || "EU (Frankfurt)");
  const [retention, setRetention] = useState<number>((tenant as any)?.data_retention_years ?? 7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    setRegion((tenant as any).data_hosting_region || "EU (Frankfurt)");
    setRetention((tenant as any).data_retention_years ?? 7);
    supabase.from("tenant_dpo").select("*").eq("tenant_id", tenant.id).maybeSingle()
      .then(({ data }) => { if (data) setDpo(data); setLoading(false); });
  }, [tenant]);

  const saveDpo = async () => {
    if (!tenant) return;
    const payload = { ...dpo, tenant_id: tenant.id };
    const { error } = await supabase.from("tenant_dpo").upsert(payload, { onConflict: "tenant_id" });
    if (error) return toast.error(error.message);
    toast.success("DPO contact saved");
  };

  const saveRegion = async () => {
    if (!tenant) return;
    const { error } = await supabase.from("tenants").update({
      data_hosting_region: region, data_retention_years: retention,
    } as any).eq("id", tenant.id);
    if (error) return toast.error(error.message);
    toast.success("Data disclosure updated");
    refresh();
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" /> Data Protection</h1>
        <p className="text-muted-foreground mt-1">Manage your school's data protection officer, hosting disclosure, and compliance documents.</p>
      </div>

      <Tabs defaultValue="dpo">
        <TabsList>
          <TabsTrigger value="dpo">DPO Contact</TabsTrigger>
          <TabsTrigger value="region">Hosting & Retention</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="dpo" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Data Protection Officer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={dpo.full_name || ""} onChange={(e) => setDpo({ ...dpo, full_name: e.target.value })} />
                </div>
                <div>
                  <Label>Registration number (with regulator)</Label>
                  <Input value={dpo.registration_number || ""} onChange={(e) => setDpo({ ...dpo, registration_number: e.target.value })} placeholder="e.g. ODPC/REG/123" />
                </div>
                <div>
                  <Label><Mail className="inline h-3 w-3 mr-1" />Email</Label>
                  <Input type="email" value={dpo.email || ""} onChange={(e) => setDpo({ ...dpo, email: e.target.value })} />
                </div>
                <div>
                  <Label><Phone className="inline h-3 w-3 mr-1" />Phone</Label>
                  <Input value={dpo.phone || ""} onChange={(e) => setDpo({ ...dpo, phone: e.target.value })} />
                </div>
              </div>
              <Textarea placeholder="Internal notes" value={dpo.notes || ""} onChange={(e) => setDpo({ ...dpo, notes: e.target.value })} />
              <Button onClick={saveDpo}>Save DPO</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="region" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Data Hosting & Retention</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Hosting region (disclosed to data subjects)</Label>
                  <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="EU (Frankfurt)" />
                </div>
                <div>
                  <Label>Default retention (years)</Label>
                  <Input type="number" value={retention} onChange={(e) => setRetention(parseInt(e.target.value) || 7)} />
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-1">Current disclosure</p>
                <p>This school's personal data is stored in <Badge variant="secondary">{region}</Badge> and retained for <Badge variant="secondary">{retention} years</Badge> after a learner exits, unless required otherwise by statute.</p>
              </div>
              <Button onClick={saveRegion}>Save disclosure</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Privacy Policy & Terms</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Manage your tenant-customisable privacy policy, terms of service, cookie policy, and DPIAs.</p>
              <Button onClick={() => window.location.href = "/dpa/policies"}>Manage Policies</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}