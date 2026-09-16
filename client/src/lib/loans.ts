import type { ApplyLoanInput, Loan } from '@/types';
import { api } from './api';

/** The borrower's loans, newest first. */
export async function getMyLoans(): Promise<Loan[]> {
  const { loans } = await api.get<{ loans: Loan[] }>('/loans/me');
  return loans;
}

/**
 * "Apply" — creates the loan in APPLIED. The server recomputes interest and
 * total from principal + tenure, so the returned loan is authoritative.
 * Throws `ApiError` 400 (out of range) or 409 (preconditions / active loan).
 */
export async function applyForLoan(input: ApplyLoanInput): Promise<Loan> {
  const { loan } = await api.post<{ loan: Loan }>('/loans', input);
  return loan;
}
