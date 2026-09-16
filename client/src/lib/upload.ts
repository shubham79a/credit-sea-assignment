/**
 * Client-side mirror of the server's salary-slip upload rules
 * (server/src/constants/upload.ts + MAX_FILE_SIZE_MB). Gives instant feedback
 * before the request; the server re-validates and is authoritative.
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
 * Uploaded files are served by the API server (not Next.js), so a
 * server-relative `/uploads/...` path must be prefixed with the API origin.
 */
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api').replace(
  /\/api\/?$/,
  '',
);

export const fileUrl = (path: string): string => `${API_ORIGIN}${path}`;
