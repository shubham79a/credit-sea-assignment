import type { Application, PersonalDetailsInput } from '@/types';
import { api } from './api';

/** The signed-in borrower's application, or null if they haven't started. */
export async function getMyApplication(): Promise<Application | null> {
  const { application } = await api.get<{ application: Application | null }>('/applications/me');
  return application;
}

/**
 * Upserts personal details and runs the server-side BRE.
 * Throws `ApiError` with status 422 (and `ruleErrors`) when eligibility fails.
 */
export async function submitPersonalDetails(input: PersonalDetailsInput): Promise<Application> {
  const { application } = await api.put<{ application: Application }>(
    '/applications/me/personal-details',
    input,
  );
  return application;
}

/**
 * Uploads (or replaces) the salary slip as multipart/form-data.
 * Throws `ApiError` 400 for type/size problems, 409 if the BRE hasn't passed.
 */
export async function uploadSalarySlip(file: File): Promise<Application> {
  const body = new FormData();
  body.append('salarySlip', file);
  const { application } = await api.post<{ application: Application }>(
    '/applications/me/salary-slip',
    body,
  );
  return application;
}
