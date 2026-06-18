/**
 * TypeScript reference implementation of the Postgres `calc_kenya_payroll`
 * function. Kept in lock-step with the SQL version so we can unit-test the
 * math without spinning up a database.
 *
 * Rates (Kenya, 2024 Finance Act):
 *   - SHIF:           2.75% of gross, minimum KES 300
 *   - NSSF:           Tier I 6% of first 8,000; Tier II 6% of 8,001..72,000
 *   - Housing Levy:   1.5% of gross
 *   - PAYE bands (monthly, on taxable pay after statutory deductions):
 *       0 .. 24,000           @ 10%
 *       24,001 .. 32,333      @ 25%
 *       32,334 .. 500,000     @ 30%
 *       500,001 .. 800,000    @ 32.5%
 *       > 800,000             @ 35%
 *   - Personal relief:  KES 2,400 / month (default)
 */

export interface PayrollInput {
  basic: number;
  house?: number;
  transport?: number;
  otherTaxable?: number;
  otherNonTax?: number;
  otherDeductions?: number;
  paysPaye?: boolean;
  paysShif?: boolean;
  paysNssf?: boolean;
  paysHousing?: boolean;
  personalRelief?: number;
  insuranceRelief?: number;
}

export interface PayrollResult {
  gross: number;
  taxableGross: number;
  taxable: number;
  shif: number;
  nssf: number;
  housingLevy: number;
  payeGross: number;
  paye: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcKenyaPayroll(input: PayrollInput): PayrollResult {
  const basic = input.basic ?? 0;
  const house = input.house ?? 0;
  const transport = input.transport ?? 0;
  const otherTax = input.otherTaxable ?? 0;
  const otherNon = input.otherNonTax ?? 0;
  const otherDed = input.otherDeductions ?? 0;
  const personalRelief = input.personalRelief ?? 2400;
  const insuranceRelief = input.insuranceRelief ?? 0;

  const gross = basic + house + transport + otherTax + otherNon;
  const taxableGross = basic + house + transport + otherTax;

  const shif = input.paysShif ? Math.max(r2(gross * 0.0275), 300) : 0;

  let nssf = 0;
  if (input.paysNssf) {
    const t1 = Math.min(gross, 8000) * 0.06;
    const t2 = Math.max(Math.min(gross, 72000) - 8000, 0) * 0.06;
    nssf = r2(t1 + t2);
  }

  const housingLevy = input.paysHousing ? r2(gross * 0.015) : 0;

  let taxable = taxableGross - shif - nssf - housingLevy;
  if (taxable < 0) taxable = 0;

  let payeGross = 0;
  let paye = 0;
  if (input.paysPaye) {
    if (taxable <= 24000) {
      payeGross = taxable * 0.10;
    } else if (taxable <= 32333) {
      payeGross = 24000 * 0.10 + (taxable - 24000) * 0.25;
    } else if (taxable <= 500000) {
      payeGross = 24000 * 0.10 + 8333 * 0.25 + (taxable - 32333) * 0.30;
    } else if (taxable <= 800000) {
      payeGross =
        24000 * 0.10 + 8333 * 0.25 + 467667 * 0.30 + (taxable - 500000) * 0.325;
    } else {
      payeGross =
        24000 * 0.10 +
        8333 * 0.25 +
        467667 * 0.30 +
        300000 * 0.325 +
        (taxable - 800000) * 0.35;
    }
    paye = Math.max(r2(payeGross - personalRelief - insuranceRelief), 0);
  }

  const totalDeductions = shif + nssf + housingLevy + paye + otherDed;
  const netPay = gross - totalDeductions;

  return {
    gross: r2(gross),
    taxableGross: r2(taxableGross),
    taxable: r2(taxable),
    shif,
    nssf,
    housingLevy,
    payeGross: r2(payeGross),
    paye,
    otherDeductions: otherDed,
    totalDeductions: r2(totalDeductions),
    netPay: r2(netPay),
  };
}