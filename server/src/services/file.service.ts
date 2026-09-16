import { randomUUID } from 'node:crypto';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { SALARY_SLIP_ALLOWED_LABEL, SALARY_SLIP_FOLDER, SALARY_SLIP_FORMATS } from '../constants/upload';
import { ApiError } from '../utils/ApiError';

/** Everything the browser needs to upload straight to Cloudinary. */
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  uploadUrl: string;
}

/** The subset of Cloudinary's resource description we persist. */
export interface VerifiedAsset {
  publicId: string;
  url: string;
  mimeType: string;
  size: number;
}

const userFolder = (userId: string): string => `${SALARY_SLIP_FOLDER}/${userId}`;

/** True if the public_id sits inside this user's namespace. */
export const ownsAsset = (userId: string, publicId: string): boolean =>
  publicId.startsWith(`${userFolder(userId)}/`);

/**
 * Signs a one-off upload for the borrower. The public_id is chosen server-side
 * and namespaced by user, so a client cannot upload into someone else's folder
 * or overwrite an arbitrary asset. The signature is only valid for these exact
 * parameters and expires after an hour (Cloudinary rule).
 */
export function createSalarySlipSignature(userId: string): UploadSignature {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${userFolder(userId)}/${randomUUID()}`;

  const signature = cloudinary.utils.api_sign_request(
    { public_id: publicId, timestamp },
    env.CLOUDINARY_API_SECRET,
  );

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}

/**
 * Confirms with Cloudinary's Admin API that the asset the client claims to have
 * uploaded really exists, belongs to this user, and satisfies the type/size
 * rules. This keeps the server authoritative even though the bytes bypassed it.
 * Rejected assets are destroyed so nothing orphaned lingers in the account.
 */
export async function verifySalarySlipAsset(userId: string, publicId: string): Promise<VerifiedAsset> {
  if (!ownsAsset(userId, publicId)) {
    throw ApiError.badRequest('Uploaded file does not belong to this account');
  }

  let resource: { format?: string; bytes: number; secure_url: string };
  try {
    resource = await cloudinary.api.resource(publicId, { resource_type: 'image' });
  } catch (error) {
    if (isCloudinaryNotFound(error)) {
      throw ApiError.badRequest('Uploaded file was not found — please upload again');
    }
    throw error;
  }

  const format = (resource.format ?? '').toLowerCase();
  const mimeType = SALARY_SLIP_FORMATS[format];
  const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

  if (!mimeType) {
    await destroyAsset(publicId);
    throw ApiError.badRequest(`Only ${SALARY_SLIP_ALLOWED_LABEL} files are allowed`);
  }
  if (resource.bytes > maxBytes) {
    await destroyAsset(publicId);
    throw ApiError.badRequest(`File exceeds the maximum size of ${env.MAX_FILE_SIZE_MB} MB`);
  }

  return { publicId, url: resource.secure_url, mimeType, size: resource.bytes };
}

/** Best-effort delete; a missing asset is not an error. */
export async function destroyAsset(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (error) {
    console.warn(`Could not destroy Cloudinary asset ${publicId}:`, error);
  }
}

function isCloudinaryNotFound(error: unknown): boolean {
  const httpCode = (error as { error?: { http_code?: number }; http_code?: number } | null)?.error
    ?.http_code ?? (error as { http_code?: number } | null)?.http_code;
  return httpCode === 404;
}
