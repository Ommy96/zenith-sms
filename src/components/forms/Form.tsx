/**
 * Zod-resolved form wrapper. Standardises react-hook-form + zod across
 * the app so callers don't repeat the boilerplate.
 *
 * Usage:
 *   const form = useZodForm(studentAdmissionSchema, { defaultValues });
 *   <ZodForm form={form} onSubmit={(values) => mutate(values)}>...</ZodForm>
 */
import { ReactNode } from "react";
import { useForm, UseFormProps, UseFormReturn, FieldValues, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType, infer as zInfer } from "zod";
import { Form } from "@/components/ui/form";

export function useZodForm<Schema extends ZodType<FieldValues>>(
  schema: Schema,
  options?: Omit<UseFormProps<zInfer<Schema>>, "resolver">,
): UseFormReturn<zInfer<Schema>> {
  return useForm<zInfer<Schema>>({
    ...options,
    resolver: zodResolver(schema),
  });
}

interface ZodFormProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  onSubmit: SubmitHandler<TValues>;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function ZodForm<TValues extends FieldValues>({
  form, onSubmit, children, className, id,
}: ZodFormProps<TValues>) {
  return (
    <Form {...form}>
      <form id={id} className={className} onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {children}
      </form>
    </Form>
  );
}

export { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";