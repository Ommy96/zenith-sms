
- In-app PDF downloads go through the `download-document` edge function and `downloadDocument()` (bytes saved via blob), never by opening Storage signed links — ad blockers block `/storage/v1/object/sign/` URLs. Emailed receipts attach the PDF directly, since email clients are not affected.
- Fee reminders use function-local rules and a service-only atomic database reservation; this prevents duplicate daily sends across concurrent runs without changing portal or channel primitives.
- Reminder messages start in sending or dry_run, never queued; the generic dispatcher does not carry Meta template parameters.
- Tenant reminder preferences use tenant_settings key/value entries; preserve its shared settings structure.
- Parent portal logo links are resolved in PortalContext for the active child's school, using user-scoped in-memory 24-hour signed-link caching; keep the admin logo helper unchanged to avoid regressions while public buckets are blocked.
