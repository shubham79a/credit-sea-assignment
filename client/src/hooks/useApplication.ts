'use client';

import { getMyApplication } from '@/lib/applications';
import type { Application } from '@/types';
import { useAsyncData } from './useAsyncData';

interface UseApplicationResult {
  application: Application | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** The borrower's application (null until they submit personal details). */
export function useApplication(): UseApplicationResult {
  const { data, loading, error, refetch } = useAsyncData(
    getMyApplication,
    'Could not load your application',
  );
  return { application: data, loading, error, refetch };
}
