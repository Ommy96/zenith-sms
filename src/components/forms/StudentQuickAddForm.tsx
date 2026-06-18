/**
 * Reference implementation of the new react-hook-form + zod pattern.
 * Use this as the template when migrating remaining forms.
 */
import { useZodForm, ZodForm, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/forms/Form";
import { studentQuickAddSchema, StudentQuickAddInput } from "@/lib/schemas/student";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface StudentQuickAddFormProps {
  defaultValues?: Partial<StudentQuickAddInput>;
  onSubmit: (values: StudentQuickAddInput) => Promise<void> | void;
  submitting?: boolean;
}

export function StudentQuickAddForm({ defaultValues, onSubmit, submitting }: StudentQuickAddFormProps) {
  const form = useZodForm(studentQuickAddSchema, {
    defaultValues: {
      first_name: "", last_name: "", admission_number: "",
      class_id: null, guardian_phone: "",
      ...defaultValues,
    },
  });

  return (
    <ZodForm form={form} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="first_name" render={({ field }) => (
          <FormItem><FormLabel>First name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="last_name" render={({ field }) => (
          <FormItem><FormLabel>Last name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="admission_number" render={({ field }) => (
        <FormItem><FormLabel>Admission #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="guardian_phone" render={({ field }) => (
        <FormItem><FormLabel>Guardian phone</FormLabel>
          <FormControl><Input {...field} value={field.value ?? ""} placeholder="+2547..." /></FormControl>
          <FormMessage /></FormItem>
      )} />
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Add Student"}
      </Button>
    </ZodForm>
  );
}