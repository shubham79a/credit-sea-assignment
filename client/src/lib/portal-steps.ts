import type { Application } from '@/types';

export type StepStatus = 'done' | 'current' | 'blocked' | 'locked';

export interface PortalStep {
  key: 'personal-details' | 'salary-slip' | 'loan' | 'track';
  title: string;
  description: string;
  href: string;
  status: StepStatus;
}

/**
 * Derives the borrower's progress from their application instead of storing a
 * "current step" counter — the data itself is the source of truth, so it can
 * never drift out of sync.
 *
 *   done     — step completed
 *   current  — the step the borrower should do next
 *   blocked  — step attempted but must be fixed (BRE failed)
 *   locked   — not reachable yet
 */
export function derivePortalSteps(application: Application | null): PortalStep[] {
  const detailsPassed = application?.bre.passed === true;
  const detailsFailed = application !== null && application?.bre.passed === false;

  const detailsStatus: StepStatus = detailsPassed ? 'done' : detailsFailed ? 'blocked' : 'current';
  // Later parts extend this: salary slip → loan → tracking.
  const salarySlipStatus: StepStatus = detailsPassed ? 'current' : 'locked';

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
      status: 'locked',
    },
    {
      key: 'track',
      title: 'Track application',
      description: 'Follow your loan from review through disbursement to closure.',
      href: '/portal/track',
      status: 'locked',
    },
  ];
}

/** The step the borrower should be sent to when they land on the portal. */
export function nextStep(steps: PortalStep[]): PortalStep {
  return steps.find((s) => s.status === 'current' || s.status === 'blocked') ?? steps[steps.length - 1];
}
