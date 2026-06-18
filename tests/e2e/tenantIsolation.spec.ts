/**
 * Tenant isolation regression test (Playwright).
 *
 * Goal: prove that RLS on every tenant-scoped table actually fences a user
 * inside their own tenant. We do this end-to-end through the deployed app
 * so we exercise the same auth + PostgREST path the real UI uses.
 *
 * Required environment (put in `.env.test`, never committed):
 *   E2E_BASE_URL                 — e.g. http://localhost:8080
 *   E2E_TENANT_A_EMAIL / PASSWORD
 *   E2E_TENANT_B_EMAIL / PASSWORD
 *   E2E_TENANT_A_STUDENT_ADMISSION  — a known admission number in tenant A
 *   E2E_TENANT_B_STUDENT_ADMISSION  — a known admission number in tenant B
 *
 * The test logs in as user A, navigates to each scoped page (Students,
 * Finance, Attendance, Messaging, Audit Log) and asserts that NONE of
 * tenant B's identifiers appear anywhere in the rendered HTML. It then
 * repeats the inverse for user B.
 *
 * Run: bunx playwright test tests/e2e/tenantIsolation.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const A = {
  email: process.env.E2E_TENANT_A_EMAIL ?? "",
  password: process.env.E2E_TENANT_A_PASSWORD ?? "",
  admission: process.env.E2E_TENANT_A_STUDENT_ADMISSION ?? "",
};
const B = {
  email: process.env.E2E_TENANT_B_EMAIL ?? "",
  password: process.env.E2E_TENANT_B_PASSWORD ?? "",
  admission: process.env.E2E_TENANT_B_STUDENT_ADMISSION ?? "",
};

const SCOPED_ROUTES = [
  "/students",
  "/finance",
  "/attendance",
  "/messaging",
  "/admin/audit",
];

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 15_000 });
}

async function assertNoLeak(page: Page, forbiddenNeedle: string) {
  for (const route of SCOPED_ROUTES) {
    await page.goto(`${BASE}${route}`);
    await page.waitForLoadState("networkidle");
    const html = await page.content();
    expect(
      html.includes(forbiddenNeedle),
      `Leak on ${route}: found "${forbiddenNeedle}" while logged in as the OTHER tenant`,
    ).toBe(false);
  }
}

test.describe("Tenant isolation", () => {
  test.skip(
    !A.email || !B.email,
    "E2E_TENANT_* credentials not provided — see file header.",
  );

  test("user A never sees tenant B's data", async ({ page }) => {
    await login(page, A.email, A.password);
    await assertNoLeak(page, B.admission);
  });

  test("user B never sees tenant A's data", async ({ page }) => {
    await login(page, B.email, B.password);
    await assertNoLeak(page, A.admission);
  });
});