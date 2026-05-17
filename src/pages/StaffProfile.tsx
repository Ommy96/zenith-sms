import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, Phone, Briefcase, Calendar, Shield, GraduationCap, Users as UsersIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Money } from "@/components/Money";
import { DateTime } from "@/components/DateTime";
import { toast } from "@/hooks/use-toast";

type AnyRec = Record<string, unknown>;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function StaffProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { can } = useTenant();
  const [staff, setStaff] = useState<AnyRec | null>(null);
  const [docs, setDocs] = useState<AnyRec[]>([]);
  const [loading, setLoading] = useState(true);

  const canSensitive = can("staff.view_sensitive");

  useEffect(() => {
    (async () => {
      if (!id || !profile?.tenant_id) return;
      setLoading(true);
      const { data, error } = await supabase.from("staff").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast({ title: "Staff not found", variant: "destructive" }); navigate("/staff"); return; }
      setStaff(data as AnyRec);
      const { data: dd } = await supabase.from("documents").select("*").eq("owner_type", "staff").eq("owner_id", id).order("created_at", { ascending: false });
      setDocs(dd ?? []);
      setLoading(false);
    })();
  }, [id, profile?.tenant_id, navigate]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!staff) return null;

  const fn = String(staff.first_name ?? "");
  const ln = String(staff.last_name ?? "");
  const initials = `${fn[0] || ""}${ln[0] || ""}`.toUpperCase();
  const subjects = Array.isArray(staff.subjects_taught) ? (staff.subjects_taught as string[]) : [];
  const classes = Array.isArray(staff.classes_taught) ? (staff.classes_taught as string[]) : [];
  const certs = Array.isArray(staff.professional_certifications) ? (staff.professional_certifications as string[]) : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/staff")} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back to staff</Button>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
              {staff.photo_url ? <img src={String(staff.photo_url)} alt="" className="h-full w-full object-cover rounded-2xl" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{fn} {staff.middle_name as string} {ln}</h1>
                <Badge variant="outline" className="capitalize">{String(staff.status ?? "active")}</Badge>
                {staff.employment_type ? <Badge variant="secondary" className="capitalize">{String(staff.employment_type).replace("_", " ")}</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {staff.job_title ? `${staff.job_title} · ` : ""}{staff.department || "—"} · {staff.staff_number || "no staff #"}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {staff.email ? <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{String(staff.email)}</span> : null}
                {staff.phone ? <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{String(staff.phone)}</span> : null}
                {staff.hire_date ? <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Hired <DateTime value={String(staff.hire_date)} mode="date" /></span> : null}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview"><Briefcase className="h-4 w-4 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="teaching"><GraduationCap className="h-4 w-4 mr-1.5" />Teaching</TabsTrigger>
          <TabsTrigger value="payroll" disabled={!canSensitive}><Shield className="h-4 w-4 mr-1.5" />Payroll & IDs</TabsTrigger>
          <TabsTrigger value="nok"><UsersIcon className="h-4 w-4 mr-1.5" />Next of Kin</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-1.5" />Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Gender" value={staff.gender as string} />
            <Field label="Date of Birth" value={staff.date_of_birth ? <DateTime value={String(staff.date_of_birth)} mode="date" /> : null} />
            <Field label="Address" value={staff.address as string} />
            <Field label="Date Employed" value={staff.date_employed ? <DateTime value={String(staff.date_employed)} mode="date" /> : null} />
            <Field label="Date of Confirmation" value={staff.date_of_confirmation ? <DateTime value={String(staff.date_of_confirmation)} mode="date" /> : null} />
            <Field label="Highest Qualification" value={staff.highest_qualification as string} />
            <Field label="Institution" value={staff.institution as string} />
            <Field label="Year Qualified" value={staff.year_qualified as number} />
          </Card>
        </TabsContent>

        <TabsContent value="teaching" className="mt-4">
          <Card className="p-6 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Subjects Taught</p>
              <div className="flex flex-wrap gap-1.5">
                {subjects.length ? subjects.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>) : <p className="text-sm text-muted-foreground">None recorded</p>}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Classes Taught</p>
              <div className="flex flex-wrap gap-1.5">
                {classes.length ? classes.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>) : <p className="text-sm text-muted-foreground">None recorded</p>}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Certifications</p>
              <div className="flex flex-wrap gap-1.5">
                {certs.length ? certs.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>) : <p className="text-sm text-muted-foreground">None recorded</p>}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          {canSensitive ? (
            <Card className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="National ID" value={staff.national_id_number as string} />
              <Field label="TSC Number" value={staff.tsc_number as string} />
              <Field label="KRA PIN" value={staff.kra_pin as string} />
              <Field label="NSSF" value={staff.nssf_number as string} />
              <Field label="NHIF / SHIF" value={staff.nhif_or_shif_number as string} />
              <Field label="Bank" value={staff.bank_name as string} />
              <Field label="Bank Branch" value={staff.bank_branch as string} />
              <Field label="Account #" value={staff.bank_account_number as string} />
              <Field label="Salary Scale" value={staff.salary_scale as string} />
              <Field label="Gross Salary" value={staff.gross_salary != null ? <Money amount={Number(staff.gross_salary)} /> : null} />
            </Card>
          ) : (
            <Card className="p-10 text-center text-sm text-muted-foreground">You do not have permission to view sensitive staff data.</Card>
          )}
        </TabsContent>

        <TabsContent value="nok" className="mt-4">
          <Card className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Next of Kin" value={staff.next_of_kin_name as string} />
            <Field label="Phone" value={staff.next_of_kin_phone as string} />
            <Field label="Relation" value={staff.next_of_kin_relation as string} />
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card className="p-6">
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {docs.map((d) => (
                  <li key={String(d.id)} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{String(d.file_name)}</p>
                      <p className="text-xs text-muted-foreground">{String(d.doc_type)} · <DateTime value={String(d.created_at)} mode="date" /></p>
                    </div>
                    <a href={String(d.file_url)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open</a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}