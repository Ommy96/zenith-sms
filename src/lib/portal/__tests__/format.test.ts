import { describe, it, expect } from "vitest";
import { money, shortDate, buildLedger } from "../format";

describe("portal formatting", () => {
  it("formats amounts as KES 15,000", () => expect(money(15000)).toBe("KES 15,000"));
  it("formats dates as 15 Oct 2026", () => expect(shortDate("2026-10-15")).toBe("15 Oct 2026"));
  it("ledger runs invoice debit minus payment credit", () => {
    const rows = buildLedger(
      [{ issue_date: "2026-09-01", invoice_number: "INV-1", total: 20000 }],
      [{ paid_at: "2026-09-10T08:00:00Z", amount: 5000 }],
    );
    expect(rows.map((r) => r.balance)).toEqual([20000, 15000]);
  });
});
