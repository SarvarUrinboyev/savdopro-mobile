// Generic data-fetching hook — mirrors desktop's src/hooks/useApi.js.
// Returns { data, loading, error, reload }.
// On dependency change or reload(), re-runs the async function.

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useApi<T>(
  fn: () => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any[],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Increment every call so stale responses from cancelled calls are dropped.
  const counter = useRef(0);

  const run = useCallback(async () => {
    const id = ++counter.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (counter.current === id) setData(result);
    } catch (err: unknown) {
      if (counter.current === id) {
        setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
      }
    } finally {
      if (counter.current === id) setLoading(false);
    }
  // deps supplied by caller; ESLint rule doesn't apply here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, loading, error, reload: run };
}
