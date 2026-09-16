/**
 * Client-side mirror of server/src/services/loan-calculator.ts.
 * Drives the live calculation panel; the figures stored on a loan always come
 * from the server, which recomputes them from principal + tenure.
 */
export const LOAN_RULES = {
  MIN_AMOUNT: 50_000,
  MAX_AMOUNT: 500_000,
  AMOUNT_STEP: 5_000,
  MIN_TENURE_DAYS: 30,
  MAX_TENURE_DAYS: 365,
  ANNUAL_INTEREST_RATE: 12, // % p.a., fixed
} as const;

export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  /** Interest accrued per day, for the "what does this cost me" hint. */
  dailyInterest: number;
  /** Repayment due date if disbursed today. */
  dueDate: Date;
}

export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** SI = (P × R × T) / (365 × 100); Total = P + SI */
export function calculateLoan(
  principal: number,
  tenureDays: number,
  interestRate: number = LOAN_RULES.ANNUAL_INTEREST_RATE,
  today: Date = new Date(),
): LoanQuote {
  const interest = round2((principal * interestRate * tenureDays) / (365 * 100));
  const totalRepayment = round2(principal + interest);
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + tenureDays);
  return {
    principal,
    tenureDays,
    interestRate,
    interest,
    totalRepayment,
    dailyInterest: round2(interest / tenureDays),
    dueDate,
  };
}
