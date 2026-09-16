import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env';
import {
  SALARY_SLIP_ALLOWED_LABEL,
  SALARY_SLIP_FIELD,
  SALARY_SLIP_MIME_TYPES,
} from '../constants/upload';
import { ApiError } from '../utils/ApiError';

/** Absolute path of the upload directory; created on first import. */
export const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_ROOT,
  filename(req, file, cb) {
    // Extension comes from the validated mimetype, never from the client name.
    const ext = SALARY_SLIP_MIME_TYPES[file.mimetype];
    const owner = req.user?.id ?? 'anonymous';
    cb(null, `${owner}-${randomUUID()}.${ext}`);
  },
});

const salarySlipUploader = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (SALARY_SLIP_MIME_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`Only ${SALARY_SLIP_ALLOWED_LABEL} files are allowed`));
    }
  },
});

/**
 * Accepts a single file in the `salarySlip` field. Type and size violations
 * surface as 400s via the global error handler; partial files are removed by
 * multer when the size limit trips.
 */
export const uploadSalarySlip = salarySlipUploader.single(SALARY_SLIP_FIELD);

/** Best-effort delete of a previously stored file; missing files are not an error. */
export async function removeStoredFile(fileName: string): Promise<void> {
  const target = path.join(UPLOAD_ROOT, path.basename(fileName));
  try {
    await fs.promises.unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`Could not remove stored file ${fileName}:`, error);
    }
  }
}

/** Public URL path under which a stored file is served by `express.static`. */
export const publicUrlFor = (fileName: string): string => `/uploads/${fileName}`;
