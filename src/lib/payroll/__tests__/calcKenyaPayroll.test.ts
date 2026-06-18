import { describe, it, expect } from "vitest";
import { calcKenyaPayroll } from "../calcKenyaPayroll";

const base = {
  paysPaye: true,
  paysShif: true,
  paysNssf: true,
  paysHousing: true,
  personalRelief: 2400,
  insuranceRelief: 0,
};

describe("calcKenyaPayroll — statutory rates", () => {
  it("SHIF is 2.75% of gross with a 300 floor", () => {
    const low = calcKenyaPayroll({ ...base, basic: 5000 });
    expect(low.shif).toBe(300); // 2.75% of 5000 = 137.5, floored to 300

    const mid = calcKenyaPayroll({ ...base, basic: 50000 });
    expect(mid.shif).toBe(1375); // 50000 * 0.0275
  });

  it("NSSF computes Tier I + Tier II caps correctly", () => {
    expect(calcKenyaPayroll({ ...base, basic: 5000 }).nssf).toBe(300); // 6% of 5000
    expect(calcKenyaPayroll({ ...base, basic: 8000 }).nssf).toBe(480); // Tier I cap
    expect(calcKenyaPayroll({ ...base, basic: 20000 }).nssf).toBe(1200); // 480 + 6% of 12000
    expect(calcKenyaPayroll({ ...base, basic: 100000 }).nssf).toBe(4320); // 480 + 6% of 64000 = 4320 (cap)
  });

  it("Housing Levy is 1.5% of gross", () => {
    expect(calcKenyaPayroll({ ...base, basic: 50000 }).housingLevy).toBe(750);
    expect(calcKenyaPayroll({ ...base, basic: 100000 }).housingLevy).toBe(1500);
  });
});

describe("calcKenyaPayroll — PAYE bands", () => {
  // Pre-computed reference values (taxable = basic - shif - nssf - housing).
  // We assert PAYE within ±1 KES for rounding tolerance.
  // Reference values computed from the same formulas this file ports
  // from Postgres. They pin behaviour — any drift fails the suite.
  const cases: Array<{ income: number; expectedPaye: number }> = [
    { income: 20000,  expectedPaye: 0 },
    { income: 50000,  expectedPaye: 5845.85 },
    { income: 100000, expectedPaye: 19812.35 },
    { income: 250000, expectedPaye: 62899.85 },
    { income: 500000, expectedPaye: 134712.35 },
  ];

  for (const c of cases) {
    it(`income ${c.income} produces PAYE ≈ ${c.expectedPaye}`, () => {
      const r = calcKenyaPayroll({ ...base, basic: c.income });
      // Allow ±2 KES tolerance for the SQL/TS rounding boundary.
      expect(Math.abs(r.paye - c.expectedPaye)).toBeLessThan(2);
    });
  }

  it("PAYE is never negative", () => {
    expect(calcKenyaPayroll({ ...base, basic: 10000 }).paye).toBe(0);
  });

  it("net pay = gross - all deductions", () => {
    const r = calcKenyaPayroll({ ...base, basic: 100000 });
    expect(r.netPay).toBeCloseTo(r.gross - r.totalDeductions, 2);
  });
});

describe("calcKenyaPayroll — toggles", () => {
  it("skips all statutory when toggles are off", () => {
    const r = calcKenyaPayroll({ basic: 100000 });
    expect(r.shif).toBe(0);
    expect(r.nssf).toBe(0);
    expect(r.housingLevy).toBe(0);
    expect(r.paye).toBe(0);
    expect(r.netPay).toBe(100000);
  });
});