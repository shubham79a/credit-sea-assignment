import type { AuthUser } from '../types/express';
import {
  ACTIVE_LOAN_STATUSES,
  LOAN_STATUS,
  LOAN_TRANSITIONS,
  statusesVisibleTo,
  type LoanAction,
  type LoanStatus,
} from '../constants/loan';
import { ROLES } from '../constants/roles';
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

// ---------------------------------------------------------------------------
// Executive side
// ---------------------------------------------------------------------------

/** Fields every dashboard module needs alongside the loan itself. */
const BORROWER_FIELDS = 'name email';
const APPLICATION_FIELDS = 'personalDetails salarySlip bre.passed';

/**
 * Lists loans in one status for a dashboard module. A role can only read the
 * statuses its module owns (`MODULE_STATUSES`); ADMIN reads everything.
 */
export async function listLoansForRole(actor: AuthUser, status: LoanStatus): Promise<LoanDocument[]> {
  if (!statusesVisibleTo(actor.role).includes(status)) {
    throw ApiError.forbidden(`Role ${actor.role} cannot view ${status} loans`);
  }
  return Loan.find({ status })
    .sort({ updatedAt: -1 })
    .populate('user', BORROWER_FIELDS)
    .populate('application', APPLICATION_FIELDS);
}

/** Single loan with relations, for detail views — same visibility rule as the list. */
export async function getLoanForRole(actor: AuthUser, loanId: string): Promise<LoanDocument> {
  const loan = await Loan.findById(loanId)
    .populate('user', BORROWER_FIELDS)
    .populate('application', APPLICATION_FIELDS);
  if (!loan) throw ApiError.notFound('Loan not found');

  const isOwner = actor.role === ROLES.BORROWER && String(loan.user._id ?? loan.user) === actor.id;
  if (!isOwner && !statusesVisibleTo(actor.role).includes(loan.status)) {
    throw ApiError.forbidden(`Role ${actor.role} cannot view this loan`);
  }
  return loan;
}

/**
 * The single place a loan changes status. `LOAN_TRANSITIONS` is the source of
 * truth for what is legal and who may do it; the update is conditional on the
 * current status so two executives can't both approve the same loan.
 */
export async function transitionLoan(
  loanId: string,
  action: LoanAction,
  actor: AuthUser,
  reason?: string,
): Promise<LoanDocument> {
  const { from, to, allowedRoles } = LOAN_TRANSITIONS[action];

  // Defence in depth — the route already ran authorize(), but never trust one layer.
  if (actor.role !== ROLES.ADMIN && !(allowedRoles as string[]).includes(actor.role)) {
    throw ApiError.forbidden(`Role ${actor.role} cannot ${action.toLowerCase()} loans`);
  }

  const updated = await Loan.findOneAndUpdate(
    { _id: loanId, status: from },
    {
      $set: { status: to },
      $push: { statusHistory: { from, to, by: actor.id, at: new Date(), ...(reason ? { reason } : {}) } },
    },
    { new: true },
  )
    .populate('user', BORROWER_FIELDS)
    .populate('application', APPLICATION_FIELDS);

  if (updated) return updated;

  // Distinguish "no such loan" from "wrong state" for a precise error.
  const current = await Loan.findById(loanId).select('status');
  if (!current) throw ApiError.notFound('Loan not found');
  throw ApiError.conflict(`Loan is ${current.status}; only ${from} loans can be ${to.toLowerCase()}`);
}

export interface DashboardSummary {
  loansByStatus: Partial<Record<LoanStatus, number>>;
  visibleStatuses: LoanStatus[];
}

/** Counts for the dashboard home, restricted to the statuses the role may see. */
export async function getSummaryForRole(actor: AuthUser): Promise<DashboardSummary> {
  const visibleStatuses = statusesVisibleTo(actor.role);
  const rows = await Loan.aggregate<{ _id: LoanStatus; count: number }>([
    { $match: { status: { $in: visibleStatuses } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const loansByStatus: Partial<Record<LoanStatus, number>> = {};
  for (const status of visibleStatuses) loansByStatus[status] = 0;
  for (const row of rows) loansByStatus[row._id] = row.count;
  return { loansByStatus, visibleStatuses };
}
