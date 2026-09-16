import { ACTIVE_LOAN_STATUSES, type Application, type Loan } from '@/types';

export type StepStatus = 'done' | 'current' | 'blocked' | 'locked';

export interface PortalStep {
  key: 'personal-details' | 'salary-slip' | 'loan' | 'track';
  title: string;
  description: string;
  href: string;
  status: StepStatus;
}

/**
 * Derives the borrower's progress from their data instead of storing a
 * "current step" counter — the data itself is the source of truth, so it can
 * never drift out of sync.
 *
 *   done     — step completed
 *   current  — the step the borrower should do next
 *   blocked  — step attempted but must be fixed (BRE failed)
 *   locked   — not reachable yet
 */
export function derivePortalSteps(application: Application | null, loans: Loan[] = []): PortalStep[] {
  const detailsPassed = application?.bre.passed === true;
  const detailsFailed = application !== null && application?.bre.passed === false;
  const slipUploaded = detailsPassed && Boolean(application?.salarySlip);
  const activeLoan = loans.find((loan) => ACTIVE_LOAN_STATUSES.includes(loan.status));
  const hasAnyLoan = loans.length > 0;

  const detailsStatus: StepStatus = detailsPassed ? 'done' : detailsFailed ? 'blocked' : 'current';
  const salarySlipStatus: StepStatus = slipUploaded ? 'done' : detailsPassed ? 'current' : 'locked';
  // A rejected/closed loan re-opens the loan step so the borrower can apply again.
  const loanStatus: StepStatus = activeLoan ? 'done' : slipUploaded ? 'current' : 'locked';
  const trackStatus: StepStatus = activeLoan ? 'current' : hasAnyLoan ? 'done' : 'locked';

  return [
    {
      key: 'personal-details',
      title: 'Personal details',
      description: 'Identity, income and employment — checked against our eligibility rules.',
      href: '/portal/personal-details',
      status: detailsStatus,
    },
    {
      key: 'salary-slip',
      title: 'Salary slip',
      description: 'Upload your latest salary slip (PDF, JPG or PNG, up to 5 MB).',
      href: '/portal/salary-slip',
      status: salarySlipStatus,
    },
    {
      key: 'loan',
      title: 'Loan configuration',
      description: 'Choose amount and tenure, review interest, and apply.',
      href: '/portal/loan',
      status: loanStatus,
    },
    {
      key: 'track',
      title: 'Track application',
      description: 'Follow your loan from review through disbursement to closure.',
      href: '/portal/track',
      status: trackStatus,
    },
  ];
}

/** The step the borrower should be sent to when they land on the portal. */
export function nextStep(steps: PortalStep[]): PortalStep {
  return steps.find((s) => s.status === 'current' || s.status === 'blocked') ?? steps[steps.length - 1];
}
