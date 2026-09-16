import { LOAN_STATUS, ROLES, type LoanStatus, type Role } from '@/types';

export type ModuleKey = 'sales' | 'sanction' | 'disbursement' | 'collection';

export interface DashboardModule {
  key: ModuleKey;
  label: string;
  href: string;
  description: string;
  /** Executive role that owns the module. ADMIN sees every module. */
  role: Role;
  /** Loan statuses the module works with (empty for Sales — it tracks leads). */
  statuses: LoanStatus[];
}

/**
 * Single source of truth for the dashboard: nav items, home cards, per-page
 * guards and the edge redirect in proxy.ts all read from here.
 */
export const MODULES: DashboardModule[] = [
  {
    key: 'sales',
    label: 'Sales',
    href: '/dashboard/sales',
    description: 'Leads — borrowers who registered but have not applied yet.',
    role: ROLES.SALES,
    statuses: [],
  },
  {
    key: 'sanction',
    label: 'Sanction',
    href: '/dashboard/sanction',
    description: 'Review applied loans and approve or reject them.',
    role: ROLES.SANCTION,
    statuses: [LOAN_STATUS.APPLIED, LOAN_STATUS.SANCTIONED, LOAN_STATUS.REJECTED],
  },
  {
    key: 'disbursement',
    label: 'Disbursement',
    href: '/dashboard/disbursement',
    description: 'Release funds for sanctioned loans.',
    role: ROLES.DISBURSEMENT,
    statuses: [LOAN_STATUS.SANCTIONED, LOAN_STATUS.DISBURSED],
  },
  {
    key: 'collection',
    label: 'Collection',
    href: '/dashboard/collection',
    description: 'Record repayments on disbursed loans; loans auto-close when fully repaid.',
    role: ROLES.COLLECTION,
    statuses: [LOAN_STATUS.DISBURSED, LOAN_STATUS.CLOSED],
  },
];

export const canAccessModule = (role: Role, module: DashboardModule): boolean =>
  role === ROLES.ADMIN || role === module.role;

export const modulesForRole = (role: Role): DashboardModule[] =>
  MODULES.filter((m) => canAccessModule(role, m));

export const findModuleByPath = (pathname: string): DashboardModule | undefined =>
  MODULES.find((m) => pathname === m.href || pathname.startsWith(`${m.href}/`));
