import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

/**
 * Reads `Authorization: Bearer <jwt>`, verifies it and attaches the principal
 * to `req.user`. Responds 401 when the token is missing, malformed or expired.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or invalid Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
