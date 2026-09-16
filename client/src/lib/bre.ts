import type { BreFailure, EmploymentMode } from '@/types';
import { formatInr } from './format';

/**
 * Client-side mirror of the Business Rule Engine.
 *
 * This exists purely for instant feedback — the borrower sees eligibility
 * problems before a network round-trip. It is NOT the source of truth: the
 * server re-runs the same rules (server/src/services/bre.service.ts) and only
 * its verdict gates the application. Keep the two in sync.
 */
export const BRE_RULES = {
  MIN_AGE: 23,
  MAX_AGE: 50,
  MIN_MONTHLY_SALARY: 25_000,
  PAN_REGEX: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
} as const;

export function calculateAge(dateOfBirth: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDelta = today.getMonth() - dateOfBirth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

export interface BreInput {
  pan: string;
  dateOfBirth: string; // YYYY-MM-DD
  monthlySalary: number;
  employmentMode: EmploymentMode | '';
}

export function evaluateBre(input: BreInput): BreFailure[] {
  const failures: BreFailure[] = [];

  const dob = new Date(input.dateOfBirth);
  if (!Number.isNaN(dob.getTime())) {
    const age = calculateAge(dob);
    if (age < BRE_RULES.MIN_AGE || age > BRE_RULES.MAX_AGE) {
      failures.push({
        rule: 'AGE',
        message: `You must be between ${BRE_RULES.MIN_AGE} and ${BRE_RULES.MAX_AGE} years old (current age: ${age})`,
      });
    }
  }

  if (input.monthlySalary < BRE_RULES.MIN_MONTHLY_SALARY) {
    failures.push({
      rule: 'SALARY',
      message: `Monthly salary must be at least ${formatInr(BRE_RULES.MIN_MONTHLY_SALARY)}`,
    });
  }

  if (!BRE_RULES.PAN_REGEX.test(input.pan.trim().toUpperCase())) {
    failures.push({
      rule: 'PAN',
      message: 'PAN must match the format AAAAA9999A (5 letters, 4 digits, 1 letter)',
    });
  }

  if (input.employmentMode === 'UNEMPLOYED') {
    failures.push({ rule: 'EMPLOYMENT', message: 'You must be salaried or self-employed to apply' });
  }

  return failures;
}
