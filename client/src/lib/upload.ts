import type { UploadSignature } from '@/types';

/**
 * Client-side mirror of the server's salary-slip upload rules
 * (server/src/constants/upload.ts + MAX_FILE_SIZE_MB). Gives instant feedback
 * before the request; the server re-validates the stored asset and is authoritative.
 */
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';
export const ALLOWED_LABEL = 'PDF, JPG or PNG';

/** Returns a human-readable problem, or null if the file is acceptable. */
export function validateSalarySlip(file: File): string | null {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return `Only ${ALLOWED_LABEL} files are allowed`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is ${formatBytes(file.size)} — the maximum is ${MAX_FILE_SIZE_MB} MB`;
  }
  if (file.size === 0) {
    return 'The selected file is empty';
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Sends the file straight to Cloudinary using a signature issued by our API.
 * The bytes never touch our server (keeps us under Vercel's request-body cap).
 * Resolves to Cloudinary's `public_id`; throws a readable Error on failure.
 */
export async function uploadToCloudinary(file: File, ticket: UploadSignature): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', ticket.apiKey);
  body.append('timestamp', String(ticket.timestamp));
  body.append('signature', ticket.signature);
  body.append('public_id', ticket.publicId);

  const response = await fetch(ticket.uploadUrl, { method: 'POST', body });
  const payload = (await response.json().catch(() => null)) as
    | { public_id?: string; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.public_id) {
    throw new Error(payload?.error?.message ?? 'Upload to storage failed. Please try again.');
  }
  return payload.public_id;
}
