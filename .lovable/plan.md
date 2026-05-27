## Phase H: Compliance & Government Integrations

Massive scope (10 sub-areas across 5 countries + DPA + audit reports). I'll deliver in 4 sequential sub-phases so each ships working code rather than 60 half-built files. Confirm the breakdown before I start, or tell me to merge/skip.

### H1 — Kenya statutory core (this turn)
The highest-leverage chunk for current/likely tenants:
- **NEMIS module** (`System → Integrations → NEMIS`)
  - Settings page: encrypted NEMIS credentials (stored via edge function + pgsodium-style symmetric encryption using a project secret)
  - UPI coverage widget: "X% of students have NEMIS UPI"
  - **Export**: CSV in NEMIS column format (M/D/YYYY dates, birth-cert names, gender M/F, etc.)
  - **Import**: parse returned progression CSV, update `students.nemis_upi` + any returned fields, show diff before commit
  - NEMIS Reports: Enrolment by class & gender, SNE enrolment, repeats, dropouts, transfers in/out, capitation tracking (all date-range parameterised, exportable)
- **TSC**: `staff.tsc_number`, `tsc_job_group`, `tsc_subjects[]`; teacher-returns CSV; subject-mismatch report (TSC-registered vs assigned)
- **KRA / Statutory payroll exports** (extend existing payroll):
  - P9A per employee (annual), P10 monthly, iTax CSV, SHIF, NSSF Tier I+II, AHL, HELB
  - Compliance dashboard tile: PAYE/SHIF/NSSF/AHL filed ✓ with last filing date + reference (new `statutory_filings` table)

### H2 — Other East African countries
- Uganda: LIN, EMIS export, UNEB candidate CSV, URA payroll (PAYE UG + NSSF UG)
- Tanzania: PREMS, NECTA (CSEE/ACSEE) export, TRA payroll
- Rwanda: REB student ID, national-exam CSV, RRA payroll, FR/EN toggle
- Ethiopia: MoE ID, Amharic strings, Ethiopian calendar option on date pickers
- Country detection from `tenants.country` — only show relevant modules

### H3 — Data Protection & DPA compliance
- `tenant_dpo` table (name, email, phone, registration #)
- Subject Access Request workflow: parent/staff submits → admin reviews → packaged ZIP export (student record, attendance, fees, messages, exam results)
- Right-to-erasure workflow with full audit trail (`erasure_requests`)
- Cookie/consent banner on portal
- Tenant-customisable privacy policy + ToS (markdown templates)
- DPIA template (downloadable .docx)
- "Data hosted in: [region]" surfaced in Settings (read from env)

### H4 — Exam bodies + Audit-ready PDF packs
- Generic exam-body export framework: KNEC, UNEB, NECTA, REB, Cambridge/IB formats
- KNEC results import (CSV → `student_exam_results` by index #)
- One-click PDF packs (server-rendered via edge function + react-pdf or puppeteer-deno):
  - QASO visit pack
  - Internal audit pack
  - BoM report
  - PTA report
- All date-range parameterised, school letterhead, charts via QuickChart, reproducible

### Schema additions (H1 only, this turn)
```
ALTER students ADD nemis_upi, birth_cert_no, sne_category, is_repeater, exit_reason, exit_date
ALTER staff   ADD tsc_number, tsc_job_group, tsc_subjects text[]
CREATE statutory_filings (tenant, type, period, reference, filed_at, filed_by, file_url)
CREATE nemis_credentials (tenant, username, password_encrypted) -- service_role only
CREATE compliance_reports_log (audit trail of generated exports)
```

### Tech notes
- Encryption for NEMIS credentials: edge function uses `Deno.env.get('ENCRYPTION_KEY')` + AES-GCM; only service role reads ciphertext
- All CSV generators in edge functions (server-side, avoids browser CSV quirks with UTF-8 BOM for Excel)
- Country gating via `useTenantCountry()` hook reading `tenants.country`

**Reply with**:
- `go` → I start H1 (Kenya statutory core) now
- `merge X+Y` → combine sub-phases
- `skip X` → drop sub-phase
- Any scope edits
