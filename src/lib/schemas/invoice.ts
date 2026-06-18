import { z } from "zod";

export const invoiceLineSchema = z.object({
  description: z.string().trim().min(1, "Description required").max(200),
  quantity: z.number().int().positive("Qty must be > 0").default(1),
  unit_amount: z.number().nonnegative("Unit amount must be ≥ 0"),
  tax_rate: z.number().min(0).max(100).default(0),
});

export const invoiceSchema = z.object({
  student_id: z.string().uuid("Select a student"),
  fee_structure_id: z.string().uuid().optional().nullable(),
  term_id: z.string().uuid().optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  currency: z.string().trim().length(3).default("KES"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  lines: z.array(invoiceLineSchema).min(1, "Add at least one line"),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;