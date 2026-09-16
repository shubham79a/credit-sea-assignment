import { Application, type ApplicationDocument } from '../models/Application';
import { ApiError } from '../utils/ApiError';
import type { LinkSalarySlipInput, PersonalDetailsInput } from '../validators/application.validator';
import { evaluateBre } from './bre.service';
import { destroyAsset, ownsAsset, verifySalarySlipAsset } from './file.service';
import { assertNoActiveLoan } from './loan.service';

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
  await assertNoActiveLoan(userId);

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
 * Links a salary slip the browser uploaded directly to Cloudinary. The asset is
 * verified against Cloudinary first (ownership, type, size); re-uploading
 * replaces the previous asset rather than accumulating copies.
 */
export async function attachSalarySlip(
  application: ApplicationDocument,
  input: LinkSalarySlipInput,
): Promise<ApplicationDocument> {
  const userId = String(application.user);
  try {
    await assertNoActiveLoan(userId);
  } catch (error) {
    // The asset is already in Cloudinary — don't leave it orphaned. Only ever
    // destroy assets inside this user's own namespace.
    if (ownsAsset(userId, input.publicId)) await destroyAsset(input.publicId);
    throw error;
  }

  const asset = await verifySalarySlipAsset(userId, input.publicId);
  const previous = application.salarySlip?.publicId;

  application.salarySlip = {
    publicId: asset.publicId,
    originalName: input.originalName,
    mimeType: asset.mimeType,
    size: asset.size,
    url: asset.url,
    uploadedAt: new Date(),
  };
  await application.save();

  if (previous && previous !== asset.publicId) {
    await destroyAsset(previous);
  }

  return application;
}
