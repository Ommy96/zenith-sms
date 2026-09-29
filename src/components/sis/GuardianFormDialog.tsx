import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { kenyaPhone, normalizeKenyaPhone, optionalKenyaPhone } from "@/lib/sis/people";

export const RELATIONSHIPS = ["father", "mother", "guardian", "grandparent", "uncle", "aunt", "sibling", "other"] as const;
const schema = z.object({
  full_name: z.string().trim().min(2, "Required").max(120),
  relationship_default: z.enum(RELATIONSHIPS),
  phone_primary: kenyaPhone,
  phone_secondary: optionalKenyaPhone,
  email: z.string().trim().email("Invalid email").max(255).or(z.literal("")),
  national_id_number: z.string().trim().max(40),
  residential_address: z.string().trim().max(400),
  occupation: z.string().trim().max(120),
});
type Values = z.infer<typeof schema>;
const empty: Values = { full_name: "", relationship_default: "mother", phone_primary: "", phone_secondary: "", email: "", national_id_number: "", residential_address: "", occupation: "" };

interface Props { open: boolean; onOpenChange: (o: boolean) => void; guardian?: any; onSaved: (id: string) => void }

/** Links students to a guardian; first guardian of a student becomes primary. */
export async function linkStudents(tenantId: string, guardianId: string, relationship: string, studentIds: string[]) {
  for (const sid of studentIds) {
    const { count } = await supabase.from("student_guardians").select("id", { count: "exact", head: true }).eq("student_id", sid);
    const { error } = await supabase.from("student_guardians").upsert({ tenant_id: tenantId, student_id: sid, guardian_id: guardianId, relationship, is_primary_contact: !count }, { onConflict: "student_id,guardian_id", ignoreDuplicates: true });
    if (error) throw error;
  }
}

export function GuardianFormDialog({ open, onOpenChange, guardian, onSaved }: Props) {
  const { tenant } = useTenant();
  const tid = tenant?.id;
  const qc = useQueryClient();
  const [linkIds, setLinkIds] = useState<string[]>([]);
  const [dupe, setDupe] = useState<{ existing: any; values: Values } | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  useEffect(() => {
    if (!open) return;
    setLinkIds([]);
    form.reset(guardian ? Object.fromEntries(Object.keys(empty).map((k) => [k, guardian[k] ?? (empty as any)[k]])) as Values : empty);
  }, [open, guardian]); // eslint-disable-line react-hooks/exhaustive-deps

  const students = useQuery({
    queryKey: [tid, "students", "picker"], enabled: open && !guardian && !!tid,
    queryFn: async () => (await supabase.from("students").select("id,first_name,last_name,admission_number").eq("tenant_id", tid).eq("enrollment_status", "active").order("first_name").limit(500)).data ?? [],
  });

  const persist = async (v: Values, linkTo?: any) => {
    const payload = { ...v, phone_primary: normalizeKenyaPhone(v.phone_primary), phone_secondary: normalizeKenyaPhone(v.phone_secondary), email: v.email || null, national_id_number: v.national_id_number || null, residential_address: v.residential_address || null, occupation: v.occupation || null };
    let id = linkTo?.id ?? guardian?.id;
    if (!linkTo) {
      const res = guardian
        ? await supabase.from("guardians").update(payload).eq("id", guardian.id).eq("tenant_id", tid).select("id").single()
        : await supabase.from("guardians").insert({ ...payload, tenant_id: tid }).select("id").single();
      if (res.error) return toast.error(res.error.message);
      id = res.data.id;
    }
    try { if (linkIds.length) await linkStudents(tid!, id, v.relationship_default, linkIds); } catch (e: any) { return toast.error(e.message); }
    qc.invalidateQueries({ queryKey: [tid, "guardians"] });
    qc.invalidateQueries({ queryKey: [tid, "students"] });
    toast.success(linkTo ? `Linked to existing guardian ${linkTo.full_name}` : guardian ? "Guardian updated" : "Guardian created");
    setDupe(null); onOpenChange(false); onSaved(id);
  };

  const submit = form.handleSubmit(async (v) => {
    const phone = normalizeKenyaPhone(v.phone_primary);
    let query = supabase.from("guardians").select("id,full_name").eq("tenant_id", tid).eq("phone_primary", phone).limit(1);
    if (guardian) query = query.neq("id", guardian.id);
    const { data } = await query;
    if (data?.[0]) return setDupe({ existing: data[0], values: v });
    await persist(v);
  });

  const f = (name: keyof Values, label: string, props: any = {}) => (
    <div className="grid gap-1.5"><Label>{label}</Label><Input {...form.register(name)} {...props} />{form.formState.errors[name] && <p className="text-xs text-destructive">{form.formState.errors[name]?.message as string}</p>}</div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{guardian ? "Edit guardian" : "New guardian"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {f("full_name", "Full name")}
              <div className="grid gap-1.5"><Label>Relationship</Label>
                <Select value={form.watch("relationship_default")} onValueChange={(v) => form.setValue("relationship_default", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RELATIONSHIPS.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {f("phone_primary", "Primary phone", { placeholder: "+254712345678" })}
              {f("phone_secondary", "Alternate phone")}
              {f("email", "Email", { type: "email" })}
              {f("national_id_number", "National ID")}
              {f("occupation", "Occupation")}
              {f("residential_address", "Address")}
            </div>
            {!guardian && (
              <div className="grid gap-1.5"><Label>Link to students (optional)</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  {(students.data ?? []).map((s: any) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm"><Checkbox checked={linkIds.includes(s.id)} onCheckedChange={(c) => setLinkIds(c ? [...linkIds, s.id] : linkIds.filter((x) => x !== s.id))} />{s.first_name} {s.last_name} <span className="font-mono text-xs text-muted-foreground">{s.admission_number}</span></label>
                  ))}
                  {!students.data?.length && <p className="text-xs text-muted-foreground">No active students.</p>}
                </div>
              </div>
            )}
            <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : "Save"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!dupe} onOpenChange={(o) => !o && setDupe(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Guardian already exists</AlertDialogTitle>
            <AlertDialogDescription>A guardian with this phone already exists: <b>{dupe?.existing.full_name}</b>. Link to this guardian instead?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => dupe && persist(dupe.values)}>Create new anyway</AlertDialogCancel>
            <AlertDialogAction onClick={() => dupe && persist(dupe.values, dupe.existing)}>Link</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
