import { describe, it, expect } from "vitest";
import { studentSchema, studentQuickAddSchema } from "../student";
import { feeStructureSchema } from "../feeStructure";
import { invoiceSchema } from "../invoice";
import { payrollPeriodSchema } from "../payrollPeriod";
import { mpesaConfigSchema } from "../mpesaConfig";

describe("studentSchema", () => {
  it("accepts a minimal valid student", () => {
    const r = studentSchema.safeParse({
      first_name: "Ada", last_name: "Lovelace", admission_number: "ADM-001",
    });
    expect(r.success).toBe(true);
  });
  it("rejects empty first_name", () => {
    const r = studentSchema.safeParse({ first_name: " ", last_name: "X", admission_number: "A" });
    expect(r.success).toBe(false);
  });
  it("quick add requires admission + names", () => {
    expect(studentQuickAddSchema.safeParse({ first_name: "A", last_name: "B", admission_number: "1" }).success).toBe(true);
    expect(studentQuickAddSchema.safeParse({ first_name: "", last_name: "B", admission_number: "1" }).success).toBe(false);
  });
});

describe("feeStructureSchema", () => {
  const uuid = "00000000-0000-4000-8000-000000000000";
  it("requires at least one line item", () => {
    const r = feeStructureSchema.safeParse({
      name: "Term 1", academic_year_id: uuid, term_id: uuid, currency: "KES", items: [],
    });
    expect(r.success).toBe(false);
  });
  it("accepts a valid structure", () => {
    const r = feeStructureSchema.safeParse({
      name: "Term 1", academic_year_id: uuid, term_id: uuid, currency: "KES",
      items: [{ category: "tuition", name: "Tuition", amount: 25000, is_mandatory: true }],
    });
    expect(r.success).toBe(true);
  });
});

describe("invoiceSchema", () => {
  const uuid = "00000000-0000-4000-8000-000000000000";
  it("rejects past-format due date", () => {
    const r = invoiceSchema.safeParse({
      student_id: uuid, due_date: "tomorrow",
      lines: [{ description: "Tuition", quantity: 1, unit_amount: 1000, tax_rate: 0 }],
    });
    expect(r.success).toBe(false);
  });
  it("accepts a valid invoice", () => {
    const r = invoiceSchema.safeParse({
      student_id: uuid, due_date: "2026-09-01",
      lines: [{ description: "Tuition", quantity: 1, unit_amount: 1000, tax_rate: 0 }],
    });
    expect(r.success).toBe(true);
  });
});

describe("payrollPeriodSchema", () => {
  it("enforces date ordering", () => {
    const r = payrollPeriodSchema.safeParse({
      name: "Jun 2026", month: 6, year: 2026,
      pay_date: "2026-06-25", starts_on: "2026-06-30", ends_on: "2026-06-01", currency: "KES",
    });
    expect(r.success).toBe(false);
  });
  it("accepts a valid period", () => {
    const r = payrollPeriodSchema.safeParse({
      name: "Jun 2026", month: 6, year: 2026,
      pay_date: "2026-06-30", starts_on: "2026-06-01", ends_on: "2026-06-30", currency: "KES",
    });
    expect(r.success).toBe(true);
  });
});

describe("mpesaConfigSchema", () => {
  const base = {
    environment: "sandbox" as const, shortcode: "174379", shortcode_type: "paybill" as const,
    consumer_key: "abcdefghij", consumer_secret: "abcdefghij", passkey: "abcdefghij",
    callback_url: "https://example.com/cb",
  };
  it("accepts a valid config", () => {
    expect(mpesaConfigSchema.safeParse(base).success).toBe(true);
  });
  it("rejects non-HTTPS callback", () => {
    const r = mpesaConfigSchema.safeParse({ ...base, callback_url: "http://example.com/cb" });
    expect(r.success).toBe(false);
  });
  it("rejects bad shortcode", () => {
    const r = mpesaConfigSchema.safeParse({ ...base, shortcode: "abc" });
    expect(r.success).toBe(false);
  });
});