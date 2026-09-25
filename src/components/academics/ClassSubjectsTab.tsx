import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Option = { id: string; label: string; hint?: string };
type Row = {
  id: string; subject_id: string; teacher_id: string | null; lessons_per_week: number; is_active: boolean;
  subjects: { id: string; name: string; code: string | null } | null;
  staff: { first_name: string; last_name: string } | null;
};

const schema = z.object({
  subject_id: z.string().uuid({ message: "Choose a subject" }),
  teacher_id: z.string().uuid().nullable(),
  lessons_per_week: z.coerce.number().int("Whole number only").min(1, "At least 1").max(20, "At most 20"),
  is_active: z.boolean(),
});
type Values = z.infer<typeof schema>;

function SearchSelect({ value, onChange, options, placeholder, disabled, allowNone }: {
  value: string | null; onChange: (v: string | null) => void; options: Option[]; placeholder: string; disabled?: boolean; allowNone?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" disabled={disabled} className="w-full justify-between font-normal">
          <span className={cn(!selected && "text-muted-foreground")}>{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            <CommandGroup>
              {allowNone && (
                <CommandItem value={`__none ${allowNone}`} onSelect={() => { onChange(null); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value ? "opacity-0" : "opacity-100")} />{allowNone}
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem key={o.id} value={`${o.label} ${o.hint ?? ""} ${o.id}`} onSelect={() => { onChange(o.id); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")} />
                  {o.label}{o.hint && <span className="ml-2 text-xs text-muted-foreground">{o.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ClassSubjectsTab({ classId, className }: { classId: string; className: string }) {
  const { tenant, can } = useTenant();
  const tenantId = tenant?.id;
  const qc = useQueryClient();
  const canManage = can("subjects.manage");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [removing, setRemoving] = useState<Row | null>(null);

  const listQ = useQuery({
    queryKey: ["class-subjects", classId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subjects")
        .select("id,subject_id,teacher_id,lessons_per_week,is_active,subjects!class_subjects_subject_id_fkey(id,name,code),staff!class_subjects_teacher_id_fkey(first_name,last_name)")
        .eq("tenant_id", tenantId).eq("class_id", classId);
      if (error) throw error;
      return ((data ?? []) as Row[]).sort((a, b) => (a.subjects?.name ?? "").localeCompare(b.subjects?.name ?? ""));
    },
  });

  const subjectsQ = useQuery({
    queryKey: [tenantId, "subjects-options"],
    enabled: !!tenantId && canManage,
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id,name,code").eq("tenant_id", tenantId).eq("is_active", true).order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const teachersQ = useQuery({
    queryKey: [tenantId, "teacher-options"],
    enabled: !!tenantId && canManage,
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("id,first_name,last_name,role").eq("tenant_id", tenantId).eq("status", "active").ilike("role", "%teacher%").order("first_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = listQ.data ?? [];
  const assigned = useMemo(() => new Set(rows.map((r) => r.subject_id)), [rows]);
  const subjectOptions: Option[] = useMemo(() => (subjectsQ.data ?? [])
    .filter((s: any) => !assigned.has(s.id) || s.id === editing?.subject_id)
    .map((s: any) => ({ id: s.id, label: s.name, hint: s.code ?? undefined })), [subjectsQ.data, assigned, editing]);
  const teacherOptions: Option[] = (teachersQ.data ?? []).map((t: any) => ({ id: t.id, label: `${t.first_name} ${t.last_name}`, hint: t.role }));

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { subject_id: "", teacher_id: null, lessons_per_week: 5, is_active: true } });

  useEffect(() => {
    if (!dialogOpen) return;
    form.reset(editing
      ? { subject_id: editing.subject_id, teacher_id: editing.teacher_id, lessons_per_week: editing.lessons_per_week, is_active: editing.is_active }
      : { subject_id: "", teacher_id: null, lessons_per_week: 5, is_active: true });
  }, [dialogOpen, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: async (v: Values) => {
      if (editing) {
        const { error } = await supabase.from("class_subjects")
          .update({ teacher_id: v.teacher_id, lessons_per_week: v.lessons_per_week, is_active: v.is_active })
          .eq("tenant_id", tenantId).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("class_subjects").insert({
          tenant_id: tenantId, class_id: classId, subject_id: v.subject_id,
          teacher_id: v.teacher_id, lessons_per_week: v.lessons_per_week, is_active: v.is_active,
        });
        if (error) throw error;
      }
      return v;
    },
    onSuccess: (v) => {
      const name = (subjectsQ.data ?? []).find((s: any) => s.id === v.subject_id)?.name ?? editing?.subjects?.name ?? "Subject";
      toast({ title: editing ? `Updated ${name} in ${className}` : `Added ${name} to ${className}` });
      qc.invalidateQueries({ queryKey: ["class-subjects", classId] });
      setDialogOpen(false); setEditing(null);
    },
    onError: (e: any) => toast({
      title: "Could not save",
      description: e?.code === "23505" ? "This subject is already assigned to this class." : e?.message,
      variant: "destructive",
    }),
  });

  const toggleActive = useMutation({
    mutationFn: async (r: Row) => {
      const { error } = await supabase.from("class_subjects").update({ is_active: !r.is_active }).eq("tenant_id", tenantId).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-subjects", classId] }),
    onError: (e: any) => toast({ title: "Could not update", description: e?.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (r: Row) => {
      const { error } = await supabase.from("class_subjects").delete().eq("tenant_id", tenantId).eq("id", r.id);
      if (error) throw error;
      return r;
    },
    onSuccess: (r) => {
      toast({ title: `Removed ${r.subjects?.name ?? "subject"} from ${className}` });
      qc.invalidateQueries({ queryKey: ["class-subjects", classId] });
      setRemoving(null);
    },
    onError: (e: any) => toast({ title: "Could not remove", description: e?.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Subjects</CardTitle>
        {canManage && <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add subject</Button>}
      </CardHeader>
      <CardContent>
        {listQ.isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : listQ.isError ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Could not load subjects. <Button variant="link" onClick={() => listQ.refetch()}>Retry</Button></div>
        ) : !rows.length ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No subjects assigned yet — add subjects to build this class's curriculum</p>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Teacher</TableHead><TableHead>Lessons per week</TableHead><TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><span className="font-medium">{r.subjects?.name}</span>{r.subjects?.code && <Badge variant="outline" className="ml-2 font-mono text-xs">{r.subjects.code}</Badge>}</TableCell>
                  <TableCell>{r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : <span className="text-muted-foreground">Not assigned</span>}</TableCell>
                  <TableCell>{r.lessons_per_week}</TableCell>
                  <TableCell><Switch checked={r.is_active} disabled={!canManage || toggleActive.isPending} onCheckedChange={() => toggleActive.mutate(r)} aria-label="Active" /></TableCell>
                  <TableCell className="text-right">
                    {canManage && <>
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => setRemoving(r)}><Trash2 className="h-4 w-4" /></Button>
                    </>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.subjects?.name ?? "subject"} in ${className}` : `Add subject to ${className}`}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="subject_id" render={({ field }) => (
                <FormItem><FormLabel>Subject</FormLabel><FormControl>
                  <SearchSelect value={field.value || null} onChange={(v) => field.onChange(v ?? "")} options={editing ? [{ id: editing.subject_id, label: editing.subjects?.name ?? "", hint: editing.subjects?.code ?? undefined }] : subjectOptions} placeholder="Select a subject" disabled={!!editing} />
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="teacher_id" render={({ field }) => (
                <FormItem><FormLabel>Teacher (optional)</FormLabel><FormControl>
                  <SearchSelect value={field.value} onChange={field.onChange} options={teacherOptions} placeholder="Not assigned" allowNone="Not assigned" />
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lessons_per_week" render={({ field }) => (
                <FormItem><FormLabel>Lessons per week</FormLabel><FormControl><Input type="number" min={1} max={20} step={1} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border p-3"><FormLabel className="m-0">Active</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Save changes" : "Add subject"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.subjects?.name} from {className}?</AlertDialogTitle>
            <AlertDialogDescription>This will unassign the teacher for this class. Student results already recorded for this subject in this class are not affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); if (removing) remove.mutate(removing); }} disabled={remove.isPending}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
