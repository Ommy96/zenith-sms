import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useZodForm, ZodForm, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/forms/Form";

const schoolSchema = z.object({
  name: z.string().trim().min(2, "Enter the school name").max(120),
  registration_number: z.string().trim().max(60).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
});

type SchoolValues = z.infer<typeof schoolSchema>;

export function SchoolInfoTab() {
  const { tenant, has_permission, refresh } = useTenant();
  const tenantId = tenant?.id;
  const qc = useQueryClient();
  const canEdit = has_permission("tenant.edit") || has_permission("tenant.settings.edit");

  const school = useQuery({
    queryKey: [tenantId, "tenant_details"],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, registration_number, email, phone, address")
        .eq("id", tenantId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const form = useZodForm(schoolSchema, {
    defaultValues: { name: "", registration_number: "", email: "", phone: "", address: "" },
  });

  useEffect(() => {
    if (!school.data) return;
    form.reset({
      name: school.data.name ?? "",
      registration_number: school.data.registration_number ?? "",
      email: school.data.email ?? "",
      phone: school.data.phone ?? "",
      address: school.data.address ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school.data]);

  const save = useMutation({
    mutationFn: async (values: SchoolValues) => {
      if (!tenantId) throw new Error("No school selected");
      const { error } = await supabase
        .from("tenants")
        .update({
          name: values.name.trim(),
          registration_number: values.registration_number?.trim() || null,
          email: values.email?.trim() || null,
          phone: values.phone?.trim() || null,
          address: values.address?.trim() || null,
        })
        .eq("id", tenantId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("School details updated", { duration: 3000 });
      await qc.invalidateQueries({ queryKey: [tenantId, "tenant_details"] });
      await refresh();
    },
    onError: (e: any) => toast.error("Could not save the school details", { description: e.message }),
  });

  if (school.isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      </div>
    );
  }

  if (school.isError) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <p className="text-sm text-muted-foreground">We couldn't load your school details.</p>
        <Button size="sm" variant="outline" onClick={() => school.refetch()}>Try again</Button>
      </div>
    );
  }

  return (
    <ZodForm form={form} onSubmit={(v) => save.mutate(v)}>
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-card-foreground mb-4">School Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>School Name</FormLabel>
                <FormControl><Input {...field} disabled={!canEdit} placeholder="e.g. Karama Academy" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="registration_number" render={({ field }) => (
              <FormItem>
                <FormLabel>Registration number</FormLabel>
                <FormControl><Input {...field} disabled={!canEdit} placeholder="Ministry registration number" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} type="email" disabled={!canEdit} placeholder="office@school.ac.ke" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input {...field} disabled={!canEdit} placeholder="+254 700 000000" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl><Input {...field} disabled={!canEdit} placeholder="Physical address" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {!canEdit && (
          <p className="text-xs text-muted-foreground">
            You can view these details but only school administrators can change them.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!canEdit || save.isPending} className="gap-1.5">
            {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </ZodForm>
  );
}

export default SchoolInfoTab;
