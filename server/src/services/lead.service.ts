import { ROLES } from '../constants/roles';
import { Application } from '../models/Application';
import { Loan } from '../models/Loan';
import { User } from '../models/User';
import type { BreFailure } from './bre.service';

/**
 * Pre-application funnel, in order. A lead leaves the funnel the moment they
 * submit a loan — from then on the Sanction module owns them.
 */
export const LEAD_STAGES = ['REGISTERED', 'BRE_FAILED', 'DETAILS_DONE', 'DOCS_DONE'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export interface Lead {
  id: string;
  name: string;
  email: string;
  registeredAt: Date;
  stage: LeadStage;
  application: {
    fullName: string;
    monthlySalary: number;
    employmentMode: string;
    breFailures: BreFailure[];
    updatedAt: Date;
  } | null;
}

export interface LeadsResult {
  leads: Lead[];
  stats: { total: number; byStage: Record<LeadStage, number> };
}

export async function getLeads(): Promise<LeadsResult> {
  const [borrowers, applications, usersWithLoans] = await Promise.all([
    User.find({ role: ROLES.BORROWER }).sort({ createdAt: -1 }),
    Application.find(),
    Loan.distinct('user'),
  ]);

  const applied = new Set(usersWithLoans.map(String));
  const applicationByUser = new Map(applications.map((app) => [String(app.user), app]));

  const leads: Lead[] = borrowers
    .filter((user) => !applied.has(String(user._id)))
    .map((user) => {
      const app = applicationByUser.get(String(user._id));
      const stage: LeadStage = !app
        ? 'REGISTERED'
        : !app.bre.passed
          ? 'BRE_FAILED'
          : !app.salarySlip
            ? 'DETAILS_DONE'
            : 'DOCS_DONE';

      return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        registeredAt: user.createdAt,
        stage,
        application: app
          ? {
              fullName: app.personalDetails.fullName,
              monthlySalary: app.personalDetails.monthlySalary,
              employmentMode: app.personalDetails.employmentMode,
              breFailures: app.bre.failures,
              updatedAt: app.updatedAt,
            }
          : null,
      };
    });

  const byStage = Object.fromEntries(LEAD_STAGES.map((s) => [s, 0])) as Record<LeadStage, number>;
  for (const lead of leads) byStage[lead.stage] += 1;

  return { leads, stats: { total: leads.length, byStage } };
}
