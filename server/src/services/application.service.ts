import { publicUrlFor, removeStoredFile } from '../middleware/upload';
import { Application, type ApplicationDocument } from '../models/Application';
import { ApiError } from '../utils/ApiError';
import type { PersonalDetailsInput } from '../validators/application.validator';
import { evaluateBre } from './bre.service';

export async function getMyApplication(userId: string): Promise<ApplicationDocument | null> {
  return Application.findOne({ user: userId });
}

/**
 * Upserts the borrower's personal details and runs the BRE.
 *
 * The attempt is persisted even when the BRE fails so the borrower can come
 * back and correct it, and so the Sales team can see why a lead stalled.
 * A failed verdict is then surfaced as 422 with every failed rule.
 */
export async function submitPersonalDetails(
  userId: string,
  input: PersonalDetailsInput,
): Promise<ApplicationDocument> {
  const bre = evaluateBre(input);

  const application = await Application.findOneAndUpdate(
    { user: userId },
    { $set: { personalDetails: input, bre } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

  if (!bre.passed) {
    throw ApiError.unprocessable('Eligibility check failed', bre.failures);
  }

  return application;
}

/**
 * Links an uploaded salary slip to the application. Re-uploading replaces the
 * previous file (best-effort removal from disk) rather than accumulating copies.
 */
export async function attachSalarySlip(
  application: ApplicationDocument,
  file: Express.Multer.File,
): Promise<ApplicationDocument> {
  const previous = application.salarySlip?.fileName;

  application.salarySlip = {
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: publicUrlFor(file.filename),
    uploadedAt: new Date(),
  };
  await application.save();

  if (previous && previous !== file.filename) {
    await removeStoredFile(previous);
  }

  return application;
}
