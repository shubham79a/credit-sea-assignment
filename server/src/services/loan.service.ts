import { ACTIVE_LOAN_STATUSES, LOAN_STATUS } from '../constants/loan';
import { Application } from '../models/Application';
import { Loan, type LoanDocument } from '../models/Loan';
import { ApiError } from '../utils/ApiError';
import type { ApplyLoanInput } from '../validators/loan.validator';
import { calculateLoan } from './loan-calculator';

/** The borrower's in-flight loan (APPLIED / SANCTIONED / DISBURSED), if any. */
export async function findActiveLoan(userId: string): Promise<LoanDocument | null> {
  return Loan.findOne({ user: userId, status: { $in: ACTIVE_LOAN_STATUSES } });
}

/**
 * Personal details and the salary slip are frozen while a loan is in progress —
 * the executives reviewing it must see exactly what was applied with.
 */
export async function assertNoActiveLoan(userId: string): Promise<void> {
  if (await findActiveLoan(userId)) {
    throw ApiError.conflict('Details are locked while a loan application is in progress');
  }
}

export async function getMyLoans(userId: string): Promise<LoanDocument[]> {
  return Loan.find({ user: userId }).sort({ createdAt: -1 });
}

/**
 * "Apply" — creates the loan in APPLIED. Preconditions, in order:
 *   application exists → BRE passed → salary slip uploaded → no active loan.
 * Money figures are computed here from the validated inputs; the client's
 * live panel is only a preview.
 */
export async function applyForLoan(userId: string, input: ApplyLoanInput): Promise<LoanDocument> {
  const application = await Application.findOne({ user: userId });
  if (!application) throw ApiError.conflict('Complete your personal details first');
  if (!application.bre.passed) throw ApiError.conflict('Your eligibility check has not passed yet');
  if (!application.salarySlip) throw ApiError.conflict('Upload your salary slip first');

  if (await findActiveLoan(userId)) {
    throw ApiError.conflict('You already have an active loan application');
  }

  const quote = calculateLoan(input.principal, input.tenureDays);

  return Loan.create({
    user: userId,
    application: application._id,
    ...quote,
    amountPaid: 0,
    status: LOAN_STATUS.APPLIED,
    statusHistory: [{ from: null, to: LOAN_STATUS.APPLIED, by: userId, at: new Date() }],
  });
}
