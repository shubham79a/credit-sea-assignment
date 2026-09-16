'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { getMyApplication } from '@/lib/applications';
import type { Application } from '@/types';

interface UseApplicationResult {
  application: Application | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Loads the borrower's application once on mount; exposes `refetch` for after mutations. */
export function useApplication(): UseApplicationResult {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getMyApplication();
      setApplication(result);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your application');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMyApplication()
      .then((result) => {
        if (cancelled) return;
        setApplication(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not load your application');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { application, loading, error, refetch: load };
}
