/**
 * Country-specific government ID field definitions for students and staff.
 * Components query getStudentGovIdFields(countryCode) to know which inputs to render.
 */

export interface GovIdField {
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
}

export const STUDENT_GOV_ID_FIELDS_BY_COUNTRY: Record<string, GovIdField[]> = {
  KE: [
    { key: "nemis_upi", label: "NEMIS UPI", placeholder: "6-character UPI", hint: "Unique Personal Identifier" },
    { key: "birth_certificate_number", label: "Birth Certificate No." },
    { key: "birth_certificate_serial", label: "BC Serial No." },
    { key: "knec_assessment_number", label: "KNEC Assessment No." },
    { key: "kcpe_index_number", label: "KCPE Index No." },
    { key: "kcse_index_number", label: "KCSE Index No." },
    { key: "huduma_number", label: "Huduma Number" },
    { key: "national_id_number", label: "National ID (adult learners)" },
  ],
  UG: [
    { key: "lin", label: "Learner Identification Number (LIN)" },
    { key: "une_index_number", label: "UNE Index Number" },
    { key: "birth_certificate_number", label: "Birth Certificate No." },
  ],
  TZ: [
    { key: "prems_number", label: "PREMS Number" },
    { key: "necta_index_number", label: "NECTA Index Number" },
    { key: "birth_certificate_number", label: "Birth Certificate No." },
  ],
  RW: [
    { key: "reb_student_id", label: "REB Student ID" },
    { key: "birth_certificate_number", label: "Birth Certificate No." },
  ],
  ET: [
    { key: "moe_student_id", label: "MOE Student ID" },
    { key: "birth_certificate_number", label: "Birth Certificate No." },
  ],
};

export function getStudentGovIdFields(countryCode?: string | null): GovIdField[] {
  if (!countryCode) return STUDENT_GOV_ID_FIELDS_BY_COUNTRY.KE;
  return STUDENT_GOV_ID_FIELDS_BY_COUNTRY[countryCode.toUpperCase()] ?? [
    { key: "national_id_number", label: "National ID Number" },
    { key: "birth_certificate_number", label: "Birth Certificate No." },
  ];
}

export const STAFF_GOV_ID_FIELDS_BY_COUNTRY: Record<string, GovIdField[]> = {
  KE: [
    { key: "tsc_number", label: "TSC Number", hint: "Teachers Service Commission" },
    { key: "kra_pin", label: "KRA PIN" },
    { key: "nssf_number", label: "NSSF Number" },
    { key: "nhif_or_shif_number", label: "NHIF / SHIF Number" },
    { key: "national_id_number", label: "National ID Number" },
  ],
  UG: [
    { key: "national_id_number", label: "NIN" },
    { key: "nhif_or_shif_number", label: "NSSF Number" },
  ],
  TZ: [
    { key: "national_id_number", label: "NIDA Number" },
    { key: "nhif_or_shif_number", label: "NSSF / NHIF" },
  ],
  RW: [{ key: "national_id_number", label: "National ID" }],
  ET: [{ key: "national_id_number", label: "National ID" }],
};

export function getStaffGovIdFields(countryCode?: string | null): GovIdField[] {
  if (!countryCode) return STAFF_GOV_ID_FIELDS_BY_COUNTRY.KE;
  return STAFF_GOV_ID_FIELDS_BY_COUNTRY[countryCode.toUpperCase()] ?? [
    { key: "national_id_number", label: "National ID Number" },
  ];
}