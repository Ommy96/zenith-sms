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

/* ------------------------------------------------------------------ */
/* Sectioned schemas — shared between admission wizard, full edit     */
/* page, and inline-edit cards on the profile.                        */
/* ------------------------------------------------------------------ */

const emptyToUndef = (v: unknown) =>
  v === "" || v === null ? undefined : v;

const optStr = (max = 200) =>
  z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
const optEmail = () =>
  z.preprocess(emptyToUndef, z.string().trim().email("Invalid email").max(255).optional());
const optPhoneE164 = () =>
  z.preprocess(
    emptyToUndef,
    z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{6,14}$/, "Use international format e.g. +254712345678")
      .optional(),
  );
const optDate = () =>
  z.preprocess(emptyToUndef, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD").optional());

export const identitySectionSchema = z
  .object({
    first_name: z.string().trim().min(1, "Required").max(80),
    middle_name: optStr(80),
    last_name: z.string().trim().min(1, "Required").max(80),
    preferred_name: optStr(80),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    date_of_birth: optDate(),
    nationality: optStr(80),
    photo_url: optStr(500),
  })
  .refine(
    (v) => !v.date_of_birth || new Date(v.date_of_birth) < new Date(),
    { path: ["date_of_birth"], message: "DOB must be in the past" },
  );

export const academicSectionSchema = z
  .object({
    admission_number: z.string().trim().min(1, "Required").max(40),
    admission_date: optDate(),
    admission_grade: optStr(40),
    expected_graduation_year: z.preprocess(
      (v) => (v === "" || v == null ? undefined : Number(v)),
      z.number().int().gte(1980).lte(2100).optional(),
    ),
    current_class_id: z.preprocess(emptyToUndef, z.string().uuid().optional()),
    stream: optStr(40),
    house: optStr(40),
    learner_category: z
      .enum(["day_scholar", "boarder", "weekly_boarder", "special_needs"])
      .optional(),
    previous_school: optStr(200),
    is_repeater: z.boolean().optional(),
    enrollment_status: z
      .enum(["active", "inactive", "graduated", "transferred", "suspended", "expelled"])
      .optional(),
  })
  .refine(
    (v) =>
      !v.expected_graduation_year ||
      !v.admission_date ||
      v.expected_graduation_year > new Date(v.admission_date).getFullYear(),
    { path: ["expected_graduation_year"], message: "Must be after admission year" },
  );

export const contactSectionSchema = z.object({
  email: optEmail(),
  phone: optPhoneE164(),
  residential_address: optStr(400),
  city: optStr(80),
  county_or_region: optStr(80),
  postal_code: optStr(20),
  emergency_contact_name: optStr(120),
  emergency_contact_phone: optPhoneE164(),
  emergency_contact_relation: optStr(40),
});

export const medicalSectionSchema = z.object({
  blood_group: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "unknown"]).optional(),
  allergies: optStr(400),
  chronic_conditions: optStr(400),
  medications: optStr(400),
  doctor_name: optStr(120),
  doctor_phone: optPhoneE164(),
  insurance_provider: optStr(120),
  insurance_policy_number: optStr(80),
  nhif_or_shif_number: optStr(40),
  last_medical_checkup: optDate(),
});

export const specialNeedsSectionSchema = z.object({
  has_special_needs: z.boolean().optional(),
  sne_category: optStr(80),
  special_needs_details: optStr(800),
  iep_on_file: z.boolean().optional(),
  accommodations: optStr(800),
});

/**
 * Country-aware government ID schema.
 * Kenya NEMIS UPI must be exactly 6 chars when present; everything else is
 * free-form. Country detection happens at the call site (uses tenant.country_code).
 */
export const governmentIdsSectionSchema = z.object({
  // Kenya
  nemis_upi: z
    .preprocess(
      emptyToUndef,
      z
        .string()
        .trim()
        .length(6, "NEMIS UPI must be exactly 6 characters")
        .optional(),
    ),
  birth_certificate_number: optStr(40),
  birth_certificate_serial: optStr(40),
  knec_assessment_number: optStr(40),
  kcpe_index_number: optStr(40),
  kcse_index_number: optStr(40),
  huduma_number: optStr(40),
  national_id_number: optStr(40),
  // Uganda
  lin: optStr(40),
  une_index_number: optStr(40),
  uneb_index_number: optStr(40),
  // Tanzania
  prems_number: optStr(40),
  necta_index_number: optStr(40),
  // Rwanda
  reb_student_id: optStr(40),
  // Ethiopia
  moe_student_id: optStr(40),
});

/** Single guardian link payload (junction + guardian fields, denormalized). */
export const guardianLinkSchema = z.object({
  guardian_id: z.string().uuid().optional(),
  full_name: z.string().trim().min(1, "Required").max(120),
  relationship: z.enum([
    "father", "mother", "guardian", "grandparent",
    "uncle", "aunt", "sibling", "other",
  ]),
  phone_primary: optPhoneE164(),
  whatsapp_number: optPhoneE164(),
  email: optEmail(),
  national_id_number: optStr(40),
  occupation: optStr(120),
  is_primary_contact: z.boolean().default(false),
  has_pickup_authorization: z.boolean().default(true),
  has_financial_responsibility: z.boolean().default(false),
  receives_communications: z.boolean().default(true),
});

export type IdentitySection = z.infer<typeof identitySectionSchema>;
export type AcademicSection = z.infer<typeof academicSectionSchema>;
export type ContactSection = z.infer<typeof contactSectionSchema>;
export type MedicalSection = z.infer<typeof medicalSectionSchema>;
export type SpecialNeedsSection = z.infer<typeof specialNeedsSectionSchema>;
export type GovernmentIdsSection = z.infer<typeof governmentIdsSectionSchema>;
export type GuardianLink = z.infer<typeof guardianLinkSchema>;