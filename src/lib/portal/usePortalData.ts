import { useCallback, useEffect, useState } from "react";

/**
 * Loads portal data and keeps the last good copy in localStorage, so a parent
 * with a weak connection still sees cached data with a "last updated" note.
 */
export function usePortalData<T>(key: string | null, loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const run = useCallback(async () => {
    if (!key) return;
    setLoading(true); setError(false);
    try {
      const fresh = await loader();
      setData(fresh); setCachedAt(null);
      try { localStorage.setItem(`portal_cache:${key}`, JSON.stringify({ at: Date.now(), data: fresh })); } catch { /* quota */ }
    } catch {
      setError(true);
      try {
        const raw = localStorage.getItem(`portal_cache:${key}`);
        if (raw) { const c = JSON.parse(raw); setData(c.data); setCachedAt(c.at); }
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, [key]); // eslint-disable-line

  useEffect(() => { run(); }, [run]);
  return { data, loading, error, cachedAt, retry: run };
}

/** Throws on a Supabase error so usePortalData can fall back to cache. */
export function must<T>(res: { data: T | null; error: any }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? ([] as unknown)) as T;
}
