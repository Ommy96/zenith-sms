# School logo access verification

## Diagnostic
- `tenant-logos.public` is false; 2 MB limit. Karama's stored value is the permanent path `ac6f5f1a-a81c-4ebd-9807-3b6d4b92b38e/logo.jpg` (not an expiring URL).
- `receipts`, `report-cards`, `message-attachments` are private, each with a 10 MB limit.
- Existing logo reads allow authenticated school members/super admins. Existing writes require school membership plus `tenant.settings.edit`.
- Public-setting attempt via the supported Storage tool returned `public_buckets_blocked`. No bucket settings changed. Workspace owner/admin can enable public buckets under Settings → Privacy & Security.

## Applied fallback
- All buckets stay private. No tenant logo values were changed.
- Added one authenticated read-only policy for logos in the caller's `portal_my_tenants()` school list; all existing write rules are unchanged.
- PortalContext resolves the active child's school logo using a 24-hour signed URL with a user-scoped in-memory cache and expiry refresh. The parent header renders it with initials fallback on image failure.
- Admin sidebar, Branding upload flow, PDF generators and other policies were not modified.

## Requested checks
1. **Public anonymous Karama logo: BLOCKED as expected for the fallback.** Browser request to the actual `logo.jpg` path returned HTTP 400; public access is still prohibited by workspace policy.
2. **Signed-in admin sidebar: UNVERIFIED.** External unmanaged sign-in unavailable; its source and logo helper were unchanged.
3. **Signed-in parent header: UNVERIFIED.** Needs a linked parent session; implementation is present, but real signed-in rendering is not claimed.
4. **Anonymous receipt denied: PASS.** Existing receipt public URL returned HTTP 400. All sensitive buckets confirmed private; report-card and attachment public probes also returned 400.
5. **Admin Branding upload: UNVERIFIED.** Needs a signed-in admin. Existing upload rules and screen unchanged.
6. **Non-admin upload rejected: UNVERIFIED live.** The original school membership and `tenant.settings.edit` conditions were read back unchanged; no real non-admin upload was attempted.

Seven portal unit tests pass, including concrete 86400-second expiry, caching, expiry refresh, user isolation and legacy URL path parsing. Preview build reports build OK. Twenty-four existing security findings predate this work; none introduced by this migration.