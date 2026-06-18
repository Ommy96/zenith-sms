import { useEffect, useState } from "react";
import { posthog } from "./posthog";

/**
 * Safe feature-flag hook. Returns `defaultValue` until PostHog flags load,
 * then returns the live value. No-ops when PostHog isn't initialised.
 */
export function useFeatureFlag(key: string, defaultValue = false): boolean {
  const [enabled, setEnabled] = useState<boolean>(defaultValue);

  useEffect(() => {
    if (!(posthog as any).__loaded) {
      // Try to read synchronously in case flags are already available.
      try {
        const v = posthog.isFeatureEnabled?.(key);
        if (typeof v === "boolean") setEnabled(v);
      } catch { /* noop */ }
    }
    let cancelled = false;
    try {
      posthog.onFeatureFlags?.(() => {
        if (cancelled) return;
        const v = posthog.isFeatureEnabled?.(key);
        setEnabled(typeof v === "boolean" ? v : defaultValue);
      });
    } catch { /* noop */ }
    return () => { cancelled = true; };
  }, [key, defaultValue]);

  return enabled;
}