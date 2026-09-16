import type { NextFunction, Request, Response } from 'express';
import { Application } from '../models/Application';
import { ApiError } from '../utils/ApiError';

/**
 * Guards steps that come after the eligibility check (salary slip, loan
 * request). Runs BEFORE multer so an ineligible borrower can't write to disk.
 *
 * - 409 if the borrower has not submitted personal details yet
 * - 409 if their BRE verdict is a fail
 * Attaches the application to `req.application` for the downstream handler.
 */
export async function requireEligibleApplication(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const application = await Application.findOne({ user: req.user!.id });

    if (!application) {
      return next(ApiError.conflict('Complete your personal details first'));
    }
    if (!application.bre.passed) {
      return next(ApiError.conflict('Your eligibility check has not passed yet'));
    }

    req.application = application;
    next();
  } catch (error) {
    next(error);
  }
}
