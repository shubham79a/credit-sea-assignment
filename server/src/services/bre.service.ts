import { BRE_RULES, type EmploymentMode } from '../constants/loan';

export type BreRule = 'AGE' | 'SALARY' | 'PAN' | 'EMPLOYMENT';

export interface BreFailure {
  rule: BreRule;
  message: string;
}

export interface BreResult {
  passed: boolean;
  failures: BreFailure[];
  evaluatedAt: Date;
}

export interface BreInput {
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

/** Full years elapsed between `dateOfBirth` and `today` (month/day aware). */
export function calculateAge(dateOfBirth: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDelta = today.getMonth() - dateOfBirth.getMonth();
  const birthdayNotYetReached = monthDelta < 0 || (monthDelta === 0 && today.getDate() < dateOfBirth.getDate());
  if (birthdayNotYetReached) age -= 1;
  return age;
}

const formatInr = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

/**
 * Business Rule Engine — the authoritative eligibility check.
 *
 * Pure and synchronous so it is trivially unit-testable. Every rule is
 * evaluated (no short-circuit) so the applicant sees all problems at once.
 * The client mirrors these rules for instant feedback, but only this result
 * gates the application.
 */
export function evaluateBre(input: BreInput): BreResult {
  const failures: BreFailure[] = [];

  const age = calculateAge(input.dateOfBirth);
  if (age < BRE_RULES.MIN_AGE || age > BRE_RULES.MAX_AGE) {
    failures.push({
      rule: 'AGE',
      message: `Applicant must be between ${BRE_RULES.MIN_AGE} and ${BRE_RULES.MAX_AGE} years old (current age: ${age})`,
    });
  }

  if (input.monthlySalary < BRE_RULES.MIN_MONTHLY_SALARY) {
    failures.push({
      rule: 'SALARY',
      message: `Monthly salary must be at least ${formatInr(BRE_RULES.MIN_MONTHLY_SALARY)} (provided: ${formatInr(input.monthlySalary)})`,
    });
  }

  if (!BRE_RULES.PAN_REGEX.test(input.pan)) {
    failures.push({
      rule: 'PAN',
      message: 'PAN must match the format AAAAA9999A (5 letters, 4 digits, 1 letter)',
    });
  }

  if (input.employmentMode === 'UNEMPLOYED') {
    failures.push({
      rule: 'EMPLOYMENT',
      message: 'Applicant must be salaried or self-employed',
    });
  }

  return { passed: failures.length === 0, failures, evaluatedAt: new Date() };
}
