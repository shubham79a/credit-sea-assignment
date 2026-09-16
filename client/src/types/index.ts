/** Mirrors `server/src/constants/roles.ts` — keep both in sync. */
export const ROLES = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  SANCTION: 'SANCTION',
  DISBURSEMENT: 'DISBURSEMENT',
  COLLECTION: 'COLLECTION',
  BORROWER: 'BORROWER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const EXECUTIVE_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.SALES,
  ROLES.SANCTION,
  ROLES.DISBURSEMENT,
  ROLES.COLLECTION,
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// Envelope returned by every API endpoint.
export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

/**
 * Error detail item. Validation errors (400) carry `field`; BRE failures (422)
 * carry `rule`.
 */
export interface ApiErrorDetail {
  field?: string;
  rule?: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: ApiErrorDetail[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ---------------------------------------------------------------------------
// Borrower application (mirrors server/src/models/Application.ts)
// ---------------------------------------------------------------------------

export const EMPLOYMENT_MODES = ['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED'] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

export const EMPLOYMENT_MODE_LABELS: Record<EmploymentMode, string> = {
  SALARIED: 'Salaried',
  SELF_EMPLOYED: 'Self-Employed',
  UNEMPLOYED: 'Unemployed',
};

export interface PersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: string; // ISO string from the API
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

/** What the form sends — same shape, DOB as `YYYY-MM-DD`. */
export type PersonalDetailsInput = PersonalDetails;

export type BreRule = 'AGE' | 'SALARY' | 'PAN' | 'EMPLOYMENT';

/** Loosely-typed rule failure as it arrives over the wire. */
export interface RuleFailure {
  rule: string;
  message: string;
}

export interface BreFailure extends RuleFailure {
  rule: BreRule;
}

export interface BreResult {
  passed: boolean;
  failures: BreFailure[];
  evaluatedAt: string;
}

export interface Application {
  id: string;
  user: string;
  personalDetails: PersonalDetails;
  bre: BreResult;
  createdAt: string;
  updatedAt: string;
}
