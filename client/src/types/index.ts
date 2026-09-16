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

export interface ApiFailure {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
