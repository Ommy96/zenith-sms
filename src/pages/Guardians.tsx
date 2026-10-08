import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { EmptyState } from "@/components/EmptyState";
import { GuardianFormDialog } from "@/components/sis/GuardianFormDialog";

export function portalStatus(g: any) {
  if (g.portal_user_id) return { label: "Active", className: "bg-success/15 text-success border-success/30" };
  return { label: "None", className: "bg-muted text-muted-foreground" };
}

/**
 * Relationship lives per link in student_guardians (guardians.relationship_default is usually empty).
 * Show the guardian-level default if set, else the relationship on their primary-contact link,
 * else their first link.
 */
export function guardianRelationship(g: any): string | null {
  if (g.relationship_default) return g.relationship_default;
  const links = g.student_guardians ?? [];
  return (links.find((l: any) => l.is_primary_contact) ?? links[0])?.relationship ?? null;
}

export default function Guardians() {
  const { tenant, can } = useTenant();
  const tid = tenant?.id;
  const navigate = useNavigate();
  const [rel, setRel] = useState("all");
  const [portal, setPortal] = useState("all");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<any>(undefined);
  const list = useQuery({
    queryKey: [tid, "guardians", "list"], enabled: !!tid,
    queryFn: async () => {
      const { data, error } = await supabase.from("guardians")
        .select("id,full_name,relationship_default,phone_primary,email,portal_user_id,student_guardians!student_guardians_guardian_id_fkey(relationship,is_primary_contact,students(id,first_name,last_name))")
        .eq("tenant_id", tid).order("full_name").limit(1000);
      if (error) throw error; return data ?? [];
    },
  });
  const rows = (list.data ?? []).filter((g: any) => {
    if (rel !== "all" && (rel === "other" ? ["father", "mother", "guardian"].includes(guardianRelationship(g) ?? "") : guardianRelationship(g) !== rel)) return false;
    if (portal !== "all" && (portal === "yes") !== !!g.portal_user_id) return false;
    const t = q.trim().toLowerCase();
    return !t || [g.full_name, g.phone_primary, g.email].some((v) => (v ?? "").toLowerCase().includes(t));
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Guardians</h1><p className="text-sm text-muted-foreground mt-1">{rows.length} shown</p></div>
        {can("students.edit") && <Button size="sm" onClick={() => setEdit(null)}><Plus className="h-4 w-4 mr-1" />New guardian</Button>}
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative w-72"><Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" /><Input className="pl-8 h-9" placeholder="Name, phone, email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={rel} onValueChange={setRel}><SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All relationships</SelectItem><SelectItem value="father">Father</SelectItem><SelectItem value="mother">Mother</SelectItem><SelectItem value="guardian">Guardian</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>
        <Select value={portal} onValueChange={setPortal}><SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any portal access</SelectItem><SelectItem value="yes">Has portal access</SelectItem><SelectItem value="no">No portal access</SelectItem></SelectContent></Select>
      </div>
      <Card>
        {list.isLoading ? <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          : !rows.length ? <EmptyState icon={<UserRound className="h-5 w-5" />} title="No guardians yet — add a guardian when creating a student or here directly" className="py-14" />
          : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Relationship</TableHead><TableHead>Primary phone</TableHead><TableHead>Email</TableHead><TableHead>Children</TableHead><TableHead>Portal</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{rows.map((g: any) => { const p = portalStatus(g); return (
              <TableRow key={g.id}>
                <TableCell><Link to={`/academics/guardians/${g.id}`} className="font-medium hover:text-primary">{g.full_name}</Link></TableCell>
                <TableCell className="capitalize">{guardianRelationship(g) ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{g.phone_primary ?? "—"}</TableCell>
                <TableCell>{g.email || "—"}</TableCell>
                <TableCell><div className="flex gap-1 flex-wrap">{(g.student_guardians ?? []).filter((l: any) => l.students).map((l: any) => <button key={l.students.id} onClick={() => navigate(`/academics/students/${l.students.id}`)} className="text-xs rounded-full border px-2 py-0.5 hover:border-primary">{l.students.first_name} {l.students.last_name}</button>)}</div></TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] ${p.className}`}>{p.label}</Badge></TableCell>
                <TableCell className="whitespace-nowrap"><Button size="sm" variant="ghost" onClick={() => navigate(`/academics/guardians/${g.id}`)}>View</Button>{can("students.edit") && <Button size="sm" variant="ghost" onClick={() => setEdit(g)}>Edit</Button>}</TableCell>
              </TableRow>); })}</TableBody>
          </Table>
        )}
      </Card>
      <GuardianFormDialog open={edit !== undefined} onOpenChange={(o) => !o && setEdit(undefined)} guardian={edit ?? undefined}
        onSaved={(id) => { if (!edit) navigate(`/academics/guardians/${id}`); else void list.refetch(); }} />
    </div>
  );
}
