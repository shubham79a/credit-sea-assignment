import type { NextFunction, Request, Response } from 'express';
import { ROLES, type Role } from '../constants/roles';
import { ApiError } from '../utils/ApiError';

/**
 * RBAC guard. Must run after `authenticate`.
 *
 *   router.get('/sanction/loans', authenticate, authorize(ROLES.SANCTION), handler)
 *
 * - 401 if there is no authenticated user (defensive; authenticate should catch it)
 * - 403 if the user is authenticated but their role is not in the allow-list
 * - ADMIN always passes.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    const { role } = req.user;
    if (role === ROLES.ADMIN || allowedRoles.includes(role)) {
      return next();
    }

    next(ApiError.forbidden(`Role ${role} is not allowed to access this resource`));
  };
}
