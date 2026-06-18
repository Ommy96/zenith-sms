# Edge Function Auth Audit

Last audited: **2026-06-18**

Buckets:

- **Public** — accepts unauthenticated traffic (webhooks, uptime, public reads).
  Auth enforced by signature, shared secret, or callback URL secrecy.
- **User** — verifies bearer JWT via `_shared/auth.ts` → `requireAuth()` and
  authorizes via tenant memberships + permissions.
- **Service** — verifies `x-internal-secret` against `INTERNAL_FUNCTION_SECRET`.

| Function                       | Bucket  | Auth mechanism                       | Reason                                                         | Status |
|--------------------------------|---------|--------------------------------------|----------------------------------------------------------------|--------|
| `health`                       | Public  | none                                 | Uptime probe (Better Stack / Pingdom)                          | ✅ |
| `mpesa-c2b-callback`           | Public  | Safaricom callback URL secrecy       | Safaricom POSTs receipts; idempotent via DB unique             | ✅ |
| `mpesa-stk-callback`           | Public  | Safaricom callback URL secrecy       | Safaricom POSTs STK result                                     | ✅ |
| `whatsapp-webhook`             | Public  | Meta verify-token + X-Hub-Signature  | Meta WhatsApp Cloud inbound webhook                            | ✅ |
| `portal-send-otp`              | Public  | rate-limit + phone validation        | Pre-login flow (no session yet)                                | ✅ |
| `portal-verify-otp`            | Public  | OTP is the credential                | Exchanges OTP for parent session                               | ✅ |
| `ical-feed`                    | Public  | per-tenant unguessable feed key      | iCal subscribers cannot carry a JWT                            | ✅ |
| `get-education-system`         | Public  | none                                 | Read-only catalogue                                            | ✅ |
| `mpesa-stk-push`               | User    | `requireAuth` + `payments.write`     | Cashier-initiated charge                                       | ⚠️ retrofit |
| `mpesa-test-connection`        | User    | `requireAuth` + tenant admin         | Tests Daraja creds                                             | ⚠️ retrofit |
| `send-email`                   | User    | `requireAuth` + `comms.send`         | Staff-triggered email                                          | ⚠️ retrofit |
| `send-sms`                     | User    | `requireAuth` + `comms.send`         | Staff-triggered SMS                                            | ⚠️ retrofit |
| `send-whatsapp`                | User    | `requireAuth` + `comms.send`         | Staff-triggered WhatsApp                                       | ⚠️ retrofit |
| `whatsapp-send`                | User    | `requireAuth` + `comms.send`         | Single-recipient WhatsApp                                      | ⚠️ retrofit |
| `whatsapp-broadcast`           | User    | `requireAuth` + `comms.broadcast`    | Bulk WhatsApp                                                  | ⚠️ retrofit |
| `whatsapp-test-connection`     | User    | `requireAuth` + tenant admin         | Tests Meta creds                                               | ⚠️ retrofit |
| `audit-report-pdf`             | User    | `requireAuth` + `compliance.read`    | Renders PII-bearing audit reports                              | 🔴 must verify |
| `compliance-export`            | User    | `requireAuth` + `compliance.read`    | Exports compliance dataset                                     | 🔴 must verify |
| `sar-export`                   | User    | `requireAuth` + `dpo.read`           | Subject-access dossier (full PII)                              | 🔴 must verify |
| `accounting-export`            | User    | `requireAuth` + `finance.read`       | GL export                                                      | 🔴 must verify |
| `nemis-credentials`            | User    | `requireAuth` + `integrations.manage`| Reads/writes encrypted gov-portal creds                        | 🔴 must verify |
| `nemis-import`                 | User    | `requireAuth` + `integrations.manage`| Pulls roster from NEMIS                                        | 🔴 must verify |
| `knec-results-import`          | User    | `requireAuth` + `exams.manage`       | Imports KCSE/KCPE results                                      | 🔴 must verify |
| `generate-report-cards`        | User    | `requireAuth` + `exams.manage`       | Batch report-card PDFs                                         | 🔴 must verify |
| `generate-statement-pdf`       | User    | `requireAuth` + `finance.read`       | Fee statements with PII                                        | 🔴 must verify |
| `process-fee-reminders`        | Service | `INTERNAL_FUNCTION_SECRET`           | Cron — sends reminders                                         | 🔴 must verify |
| `dispatch-messages`            | Service | `INTERNAL_FUNCTION_SECRET`           | Cron — drains messages queue                                   | 🔴 must verify |
| `auto-timetable`               | User    | `requireAuth` + `timetable.manage`   | Computes timetable                                             | ⚠️ retrofit |
| `auto-timetable-optimize`      | User    | `requireAuth` + `timetable.manage`   | Async optimizer run                                            | ⚠️ retrofit |
| `draft-lesson-plan`            | User    | `requireAuth` + `lessons.write`      | AI lesson-plan draft                                           | ⚠️ retrofit |
| `suggest-import-mapping`       | User    | `requireAuth` + `students.import`    | CSV column mapper                                              | ⚠️ retrofit |
| `generate-report-comment`      | User    | `requireAuth` + `exams.manage`       | AI report-card comment                                         | ⚠️ retrofit |
| `ai-invoke`                    | User    | `requireAuth` + quota check          | Generic AI proxy                                               | ⚠️ retrofit |
| `ai-copilot`                   | User    | `requireAuth` + quota check          | Copilot chat                                                   | ⚠️ retrofit |
| `ai-fee-predictor`             | User    | `requireAuth` + `finance.read`       | Fee-risk model                                                 | ⚠️ retrofit |
| `ai-ocr-grader`                | User    | `requireAuth` + `exams.manage`       | OCR script scoring                                             | ⚠️ retrofit |
| `ai-admission-screener`        | User    | `requireAuth` + `admissions.review`  | Application scoring                                            | ⚠️ retrofit |
| `ai-face-attendance`           | User    | `requireAuth` + `attendance.mark`    | Face attendance                                                | ⚠️ retrofit |
| `ai-document-draft`            | User    | `requireAuth` + `docs.write`         | AI document drafting                                           | ⚠️ retrofit |
| `ai-parent-bot`                | Public  | parent-portal session cookie         | Parent chat                                                    | ⚠️ retrofit |
| `ai-study-buddy`               | Public  | parent-portal session cookie         | Student chat                                                   | ⚠️ retrofit |

✅ verified · ⚠️ retrofit (use `_shared/auth.ts`) · 🔴 sensitive — verify before next release.

## Adding auth to a function

```ts
import { requireAuth, requirePerm, authErrorResponse } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const ctx = await requireAuth(req);
    requirePerm(ctx, "finance.read");
    // ... handler ...
  } catch (e) {
    return authErrorResponse(e, corsHeaders);
  }
});
```