import { ROLES, type Role } from './roles';

/**
 * Loan lifecycle:
 *
 *   APPLIED ──► SANCTIONED ──► DISBURSED ──► CLOSED
 *      │
 *      └──────► REJECTED
 */
export const LOAN_STATUS = {
  APPLIED: 'APPLIED',
  SANCTIONED: 'SANCTIONED',
  REJECTED: 'REJECTED',
  DISBURSED: 'DISBURSED',
  CLOSED: 'CLOSED',
} as const;

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];

export const ALL_LOAN_STATUSES = Object.values(LOAN_STATUS) as LoanStatus[];

/** A borrower may hold at most one loan in these states at a time. */
export const ACTIVE_LOAN_STATUSES: LoanStatus[] = [
  LOAN_STATUS.APPLIED,
  LOAN_STATUS.SANCTIONED,
  LOAN_STATUS.DISBURSED,
];

/**
 * Single source of truth for which transitions are legal and which role may
 * perform them. ADMIN is implicitly allowed everywhere by the RBAC middleware.
 */
export const LOAN_TRANSITIONS: Record<
  string,
  { from: LoanStatus; to: LoanStatus; allowedRoles: Role[] }
> = {
  SANCTION: { from: LOAN_STATUS.APPLIED, to: LOAN_STATUS.SANCTIONED, allowedRoles: [ROLES.SANCTION] },
  REJECT: { from: LOAN_STATUS.APPLIED, to: LOAN_STATUS.REJECTED, allowedRoles: [ROLES.SANCTION] },
  DISBURSE: { from: LOAN_STATUS.SANCTIONED, to: LOAN_STATUS.DISBURSED, allowedRoles: [ROLES.DISBURSEMENT] },
  CLOSE: { from: LOAN_STATUS.DISBURSED, to: LOAN_STATUS.CLOSED, allowedRoles: [ROLES.COLLECTION] },
};

/** Business constants from the assignment brief. */
export const LOAN_RULES = {
  MIN_AMOUNT: 50_000,
  MAX_AMOUNT: 500_000,
  MIN_TENURE_DAYS: 30,
  MAX_TENURE_DAYS: 365,
  ANNUAL_INTEREST_RATE: 12, // % p.a., fixed
} as const;

export const EMPLOYMENT_MODES = ['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED'] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

/** Business Rule Engine thresholds. */
export const BRE_RULES = {
  MIN_AGE: 23,
  MAX_AGE: 50,
  MIN_MONTHLY_SALARY: 25_000,
  /** 5 uppercase letters, 4 digits, 1 uppercase letter — e.g. ABCDE1234F */
  PAN_REGEX: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
} as const;
