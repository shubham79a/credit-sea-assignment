import type { Response } from 'express';

/**
 * Every successful API response has the same envelope so the client can
 * rely on `data` unconditionally:  { success: true, message?, data }
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}
