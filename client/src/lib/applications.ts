import type { Application, PersonalDetailsInput, UploadSignature } from '@/types';
import { api } from './api';
import { uploadToCloudinary } from './upload';

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
 * Uploads (or replaces) the salary slip in three steps:
 *   1. ask our API for a signed upload ticket (409 if the BRE hasn't passed)
 *   2. send the file straight to Cloudinary with that ticket
 *   3. tell our API the Cloudinary public_id; it verifies the asset and links it
 * Throws `ApiError` (steps 1/3) or a plain `Error` (step 2) with a readable message.
 */
export async function uploadSalarySlip(file: File): Promise<Application> {
  const { upload } = await api.post<{ upload: UploadSignature }>('/applications/me/salary-slip/sign');
  const publicId = await uploadToCloudinary(file, upload);
  const { application } = await api.post<{ application: Application }>('/applications/me/salary-slip', {
    publicId,
    originalName: file.name,
  });
  return application;
}
