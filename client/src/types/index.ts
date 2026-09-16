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

export interface SalarySlip {
  publicId: string; // Cloudinary public_id
  originalName: string;
  mimeType: string;
  size: number; // bytes
  url: string; // absolute Cloudinary URL
  uploadedAt: string;
}

/** Signed, single-use ticket from the API for a direct browser → Cloudinary upload. */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  uploadUrl: string;
}

export interface Application {
  id: string;
  user: string;
  personalDetails: PersonalDetails;
  bre: BreResult;
  salarySlip?: SalarySlip;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Loans (mirrors server/src/models/Loan.ts + constants/loan.ts)
// ---------------------------------------------------------------------------

export const LOAN_STATUS = {
  APPLIED: 'APPLIED',
  SANCTIONED: 'SANCTIONED',
  REJECTED: 'REJECTED',
  DISBURSED: 'DISBURSED',
  CLOSED: 'CLOSED',
} as const;

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  APPLIED: 'Applied',
  SANCTIONED: 'Sanctioned',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  CLOSED: 'Closed',
};

export const ACTIVE_LOAN_STATUSES: LoanStatus[] = ['APPLIED', 'SANCTIONED', 'DISBURSED'];

export interface StatusHistoryEntry {
  from: LoanStatus | null;
  to: LoanStatus;
  by: string;
  at: string;
  reason?: string;
}

export interface Loan {
  id: string;
  user: string;
  application: string;
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  outstanding: number;
  status: LoanStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplyLoanInput {
  principal: number;
  tenureDays: number;
}

// ---------------------------------------------------------------------------
// Dashboard (executive) shapes
// ---------------------------------------------------------------------------

/** Loan as returned to executives: user/application populated. */
export interface LoanWithRelations extends Omit<Loan, 'user' | 'application'> {
  user: { id: string; name: string; email: string };
  application: {
    id: string;
    personalDetails: PersonalDetails;
    salarySlip?: SalarySlip;
    bre: { passed: boolean };
  };
}

export const LEAD_STAGES = ['REGISTERED', 'BRE_FAILED', 'DETAILS_DONE', 'DOCS_DONE'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  REGISTERED: 'Registered',
  BRE_FAILED: 'Not eligible',
  DETAILS_DONE: 'Details submitted',
  DOCS_DONE: 'Ready to apply',
};

export interface Lead {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  stage: LeadStage;
  application: {
    fullName: string;
    monthlySalary: number;
    employmentMode: EmploymentMode;
    breFailures: RuleFailure[];
    updatedAt: string;
  } | null;
}

export interface LeadsResult {
  leads: Lead[];
  stats: { total: number; byStage: Record<LeadStage, number> };
}

export interface Payment {
  id: string;
  loan: string;
  borrower: string;
  utr: string;
  amount: number;
  paidAt: string;
  recordedBy: string;
  createdAt: string;
}

export interface RecordPaymentInput {
  utr: string;
  amount: number;
  paidAt: string; // YYYY-MM-DD
}

export interface DashboardSummary {
  loansByStatus: Partial<Record<LoanStatus, number>>;
  visibleStatuses: LoanStatus[];
}
