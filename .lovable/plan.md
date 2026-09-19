# Zenith Public Experience — ApexOS-Inspired Redesign

## Goal
Redesign the landing page, six staff-auth pages, and parent portal sign-in with a restrained dark amber visual system, without changing existing authentication, tenant, OTP, or backend flows beyond the explicitly approved form behavior updates.

## Public visual system
- Add a route-scoped `zenith-public` token theme in `src/index.css`, with dark as the default and a persisted light mode. This keeps the authenticated application’s existing indigo tokens unchanged.
- Remove the remote font import. Use bundled/system sans fallbacks and the existing mono fallback so first paint does not depend on an external font request.
- Build reusable public-page pieces: Zenith wordmark, theme toggle, low-opacity SVG topographic backdrop, auth shell, split marketing panel, Google scaffold button, password visibility control, password strength meter, and public footer.
- Use 8px controls, 12px panels, subtle borders/shadows, amber focus states, 200ms entrance motion, and reduced-motion/mobile static fallbacks.

## Auth pages
- **Login:** split staff sign-in layout; keep the existing email/password request, error mapping, and successful redirect. Add remember-me presentation, password visibility, parent portal link, and a Google button that reports “Google sign-in not yet configured.”
- **Signup:** split account-creation layout; keep the existing signup and tenant-creation flow. Add password visibility/strength, required terms acceptance, and the Google scaffold.
- **Forgot password:** focused single-card page around the current reset-email request.
- **Reset password:** add confirmation and password strength while keeping the current Supabase password update; after success, redirect to `/auth/login` as approved.
- **Verify email:** focused mail-confirmation page around the existing resend request and setup-provisioning callback.
- Do not configure Google OAuth or change Supabase provider settings in this shipment.

## Parent portal login
- Restyle the current phone → six-digit OTP flow inside the shared split shell.
- Keep both existing edge-function calls, OTP verification, error handling, and `/portal` redirect unchanged.
- Use parent-specific benefits and retain the staff-login link.

## Landing page
- Replace the current broad comparison-heavy page with the requested public story: responsive navigation, full-width topographic hero, country/curriculum trust signals, three alternating feature showcases, three-tier pricing preview, final call to action, and legal/company footer.
- Use lightweight CSS/UI mockups rather than external images to keep assets local and first paint fast.
- Keep truthful placeholder wording for social proof and use a `mailto:` demo action.

## Verification
- Check all eight routes at desktop and 375px mobile widths, including navigation, form visibility, OTP state, and persistent dark/light choice.
- Emulate reduced motion and confirm the topographic movement is disabled.
- Exercise non-destructive validation paths and the unconfigured Google toast; verify existing auth/OTP calls remain intact in source.
- Run focused tests/type checks through the project harness, inspect current build/runtime/console diagnostics, grep redesigned components for raw color values, and measure landing first paint under a Slow 3G browser profile.
- Authenticated credential and real SMS/email checks will be reported as externally blocked if no usable test session is available.

## Out of scope
Supabase OAuth configuration, auth email templates, authenticated application pages, tenant/setup logic, remaining Settings tabs, Stage 2 integration work, and any edge function or database changes.
