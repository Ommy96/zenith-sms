import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });
  initialized = true;
}

export function identifySentryUser(user: { id: string; email?: string | null } | null, tenantId?: string | null) {
  if (!initialized) return;
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: user.id, email: user.email ?? undefined });
  if (tenantId) Sentry.setTag("tenant_id", tenantId);
}

export { Sentry };