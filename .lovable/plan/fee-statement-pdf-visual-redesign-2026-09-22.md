# Fee statement PDF visual redesign

## Scope
- Restyle only `generate-statement-pdf`; preserve its request payload, authorization, database queries, storage bucket/path, signed-link response, and client behavior.
- Keep A4 output with Helvetica/Helvetica Bold and selectable text.

## Implementation
- Define a centralized PDF palette and layout constants for amber branding, neutrals, semantic statuses, spacing, and 20 mm margins.
- Extend the existing tenant/student reads only with presentation fields already requested: tenant logo URL and the student's class name.
- Add a centered branded header with tenant-logo download from `tenant-logos`; safely fall back to an amber school-initial monogram when unavailable or unsupported.
- Add the centered title/date block and a two-column student summary with current balance.
- Render readable invoice and payment tables with shaded headers, alternating rows, aligned amounts, status/method chips, totals, and styled empty states.
- Add automatic page breaks with repeated section headers where needed, then stamp every page with an amber-rule footer, tenant name, page count, and statement reference.

## Validation
- Generate local fixture PDFs for both no-logo/empty-history and logo/populated-history cases using the same renderer structure.
- Render every page to images, inspect spacing, clipping, contrast, page breaks, logo/monogram behavior, tables, and footers, then correct any issues found.
- Deploy only this edge function and verify its unauthenticated request remains denied; authenticated end-to-end checks may require the user's external Supabase sign-in.
