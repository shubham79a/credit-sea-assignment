'use client';

import { getMyLoans } from '@/lib/loans';
import { ACTIVE_LOAN_STATUSES, type Loan } from '@/types';
import { useAsyncData } from './useAsyncData';

interface UseMyLoansResult {
  loans: Loan[];
  /** The in-flight loan (APPLIED / SANCTIONED / DISBURSED), if any. */
  activeLoan: Loan | null;
  /** Most recent loan regardless of status. */
  latestLoan: Loan | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY: Loan[] = [];

export function useMyLoans(): UseMyLoansResult {
  const { data, loading, error, refetch } = useAsyncData(getMyLoans, 'Could not load your loans');
  const loans = data ?? EMPTY;
  return {
    loans,
    activeLoan: loans.find((loan) => ACTIVE_LOAN_STATUSES.includes(loan.status)) ?? null,
    latestLoan: loans[0] ?? null,
    loading,
    error,
    refetch,
  };
}
