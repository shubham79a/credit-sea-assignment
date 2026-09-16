/**
 * Roles are stored as a string enum on the User document.
 * Executive roles map 1:1 to a dashboard module; ADMIN can access every module.
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  SANCTION: 'SANCTION',
  DISBURSEMENT: 'DISBURSEMENT',
  COLLECTION: 'COLLECTION',
  BORROWER: 'BORROWER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES = Object.values(ROLES) as Role[];

/** Roles that can log into the operations dashboard. */
export const EXECUTIVE_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.SALES,
  ROLES.SANCTION,
  ROLES.DISBURSEMENT,
  ROLES.COLLECTION,
];

export const isExecutiveRole = (role: Role): boolean => EXECUTIVE_ROLES.includes(role);
