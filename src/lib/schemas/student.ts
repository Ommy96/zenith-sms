import { z } from "zod";

/** Canonical schema for creating/updating a student. Shared between admission form, Quick Add, and any edge function that ingests the same payload. */
export const studentSchema = z.object({
  first_name: z.string().trim().min(1, "First name required").max(80),
  last_name: z.string().trim().min(1, "Last name required").max(80),
  middle_name: z.string().trim().max(80).optional().or(z.literal("")),
  admission_number: z.string().trim().min(1, "Admission number required").max(40),
  gender: z.enum(["male", "female", "other"]).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD").optional().or(z.literal("")),
  grade: z.string().trim().max(40).optional().or(z.literal("")),
  class_id: z.string().uuid().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  guardian_name: z.string().trim().max(120).optional().or(z.literal("")),
  guardian_phone: z.string().trim().max(20).optional().or(z.literal("")),
  guardian_email: z.string().email().optional().or(z.literal("")),
  guardian_relationship: z.string().trim().max(40).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "graduated", "transferred"]).default("active"),
});

export type StudentInput = z.infer<typeof studentSchema>;

/** Minimal payload for the Quick Add card on the dashboard. */
export const studentQuickAddSchema = studentSchema.pick({
  first_name: true,
  last_name: true,
  admission_number: true,
  class_id: true,
  guardian_phone: true,
});
export type StudentQuickAddInput = z.infer<typeof studentQuickAddSchema>;