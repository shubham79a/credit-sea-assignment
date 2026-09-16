/** Multipart field name the client must use for the salary slip. */
export const SALARY_SLIP_FIELD = 'salarySlip';

/**
 * Allowed salary-slip mimetypes → the extension we store the file with.
 * The stored extension is derived from the validated mimetype, never from
 * the client-supplied filename.
 */
export const SALARY_SLIP_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export const SALARY_SLIP_ALLOWED_LABEL = 'PDF, JPG or PNG';
