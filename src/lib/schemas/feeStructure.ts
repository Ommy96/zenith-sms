import { z } from "zod";

export const feeStructureItemSchema = z.object({
  category: z.string().trim().min(1, "Category required").max(80),
  name: z.string().trim().min(1, "Item name required").max(120),
  amount: z.number().nonnegative("Amount must be ≥ 0"),
  is_mandatory: z.boolean().default(true),
});

export const feeStructureSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  academic_year_id: z.string().uuid("Select an academic year"),
  term_id: z.string().uuid("Select a term"),
  currency: z.string().trim().length(3, "ISO currency code, e.g. KES").default("KES"),
  applies_to_grade: z.string().trim().max(40).optional().or(z.literal("")),
  items: z.array(feeStructureItemSchema).min(1, "Add at least one line item"),
});

export type FeeStructureInput = z.infer<typeof feeStructureSchema>;
export type FeeStructureItemInput = z.infer<typeof feeStructureItemSchema>;