import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

export function identifyPostHogUser(
  user: { id: string; email?: string | null } | null,
  tenantId?: string | null,
) {
  if (!initialized) return;
  if (!user) {
    posthog.reset();
    return;
  }
  posthog.identify(user.id, { email: user.email ?? undefined, tenant_id: tenantId ?? undefined });
  if (tenantId) posthog.group("tenant", tenantId);
}

export type AppEvent =
  | "tenant_signed_up"
  | "student_added"
  | "fee_paid"
  | "invoice_generated"
  | "message_sent"
  | "ai_feature_used"
  | "payment_failed";

export function track(event: AppEvent, props?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, props);
}

export { posthog };