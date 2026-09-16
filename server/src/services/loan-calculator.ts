import { LOAN_RULES } from '../constants/loan';

export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interestRate: number; // % per annum
  interest: number;
  totalRepayment: number;
}

/** Round to paise (2 dp) without floating-point drift like 0.1 + 0.2. */
export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Simple Interest, exactly as the brief specifies:
 *
 *   SI = (P × R × T) / (365 × 100)      T in days, R in % p.a.
 *   Total Repayment = P + SI
 *
 * Pure function — the client mirrors it for the live panel, but the values
 * persisted on a Loan always come from here.
 */
export function calculateLoan(
  principal: number,
  tenureDays: number,
  interestRate: number = LOAN_RULES.ANNUAL_INTEREST_RATE,
): LoanQuote {
  const interest = round2((principal * interestRate * tenureDays) / (365 * 100));
  const totalRepayment = round2(principal + interest);
  return { principal, tenureDays, interestRate, interest, totalRepayment };
}
