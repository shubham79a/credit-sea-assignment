/**
 * Salary-slip upload rules. Files travel browser → Cloudinary directly (signed
 * by this API), so validation happens on the asset Cloudinary reports back.
 */

/** Cloudinary folder prefix; a user's assets live under `<prefix>/<userId>/`. */
export const SALARY_SLIP_FOLDER = 'salary-slips';

/** Cloudinary `format` values we accept → the mimetype we record. */
export const SALARY_SLIP_FORMATS: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export const SALARY_SLIP_ALLOWED_LABEL = 'PDF, JPG or PNG';
