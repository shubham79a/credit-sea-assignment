'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';

export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Loads `loader()` once on mount and exposes `refetch` for after mutations.
 * `loader` must be referentially stable (module-level function or memoised),
 * otherwise the effect would re-run every render.
 */
export function useAsyncData<T>(loader: () => Promise<T>, fallbackError: string): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toMessage = useCallback(
    (err: unknown) => (err instanceof ApiError ? err.message : fallbackError),
    [fallbackError],
  );

  const refetch = useCallback(async () => {
    try {
      setData(await loader());
      setError(null);
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, [loader, toMessage]);

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loader, toMessage]);

  return { data, loading, error, refetch };
}
