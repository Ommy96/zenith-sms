import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Generic list-page state machine: rows, loading, refresh, error.
 *
 * Pass a `fetch` function that returns rows; the hook handles loading
 * state, error toast, and exposes `refresh()` for after-mutation reloads.
 */
export function useEntityList<T>(
  fetcher: () => Promise<T[]>,
  deps: ReadonlyArray<unknown> = [],
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher();
      setRows(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { void load(); }, [load]);

  return { rows, loading, error, refresh: load, setRows };
}