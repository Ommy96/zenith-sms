import { describe, it, expect } from "vitest";
import { computeInvoiceTotals } from "../invoiceTotals";

describe("computeInvoiceTotals", () => {
  it("subtotal sums unit * qty across lines", () => {
    const r = computeInvoiceTotals({
      lines: [
        { unitAmount: 100, quantity: 2 },
        { unitAmount: 50 },
      ],
    });
    expect(r.subtotal).toBe(250);
    expect(r.total).toBe(250);
    expect(r.balance).toBe(250);
    expect(r.status).toBe("issued");
  });

  it("applies flat and percent discounts", () => {
    const r = computeInvoiceTotals({
      lines: [{ unitAmount: 1000 }],
      discounts: [
        { type: "percent", value: 10 }, // 100
        { type: "flat", value: 50 },
      ],
    });
    expect(r.discountTotal).toBe(150);
    expect(r.total).toBe(850);
  });

  it("clamps total at zero when discount exceeds subtotal", () => {
    const r = computeInvoiceTotals({
      lines: [{ unitAmount: 100 }],
      discounts: [{ type: "flat", value: 500 }],
    });
    expect(r.total).toBe(0);
  });

  it("marks partially-paid invoices as partial", () => {
    const r = computeInvoiceTotals({
      lines: [{ unitAmount: 1000 }],
      payments: [400],
    });
    expect(r.status).toBe("partial");
    expect(r.balance).toBe(600);
  });

  it("marks fully-paid invoices as paid", () => {
    const r = computeInvoiceTotals({
      lines: [{ unitAmount: 1000 }],
      payments: [600, 400],
    });
    expect(r.status).toBe("paid");
    expect(r.balance).toBe(0);
  });

  it("marks past-due unpaid invoices as overdue", () => {
    const r = computeInvoiceTotals({
      lines: [{ unitAmount: 1000 }],
      dueDate: "2020-01-01",
      today: new Date("2026-01-01"),
    });
    expect(r.status).toBe("overdue");
  });

  it("preserves void and draft statuses", () => {
    expect(
      computeInvoiceTotals({ lines: [{ unitAmount: 100 }], status: "void" })
        .status,
    ).toBe("void");
    expect(
      computeInvoiceTotals({ lines: [{ unitAmount: 100 }], status: "draft" })
        .status,
    ).toBe("draft");
  });
});