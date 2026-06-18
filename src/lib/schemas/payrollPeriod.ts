import { z } from "zod";

export const payrollPeriodSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  pay_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  currency: z.string().trim().length(3).default("KES"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
}).refine((v) => v.starts_on <= v.ends_on, {
  message: "Period start must be before end", path: ["ends_on"],
}).refine((v) => v.ends_on <= v.pay_date, {
  message: "Pay date must be on or after period end", path: ["pay_date"],
});

export type PayrollPeriodInput = z.infer<typeof payrollPeriodSchema>;