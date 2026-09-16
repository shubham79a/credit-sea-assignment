import type { Request, Response } from 'express';
import { SALARY_SLIP_ALLOWED_LABEL } from '../constants/upload';
import * as applicationService from '../services/application.service';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/response';

export async function getMine(req: Request, res: Response): Promise<void> {
  const application = await applicationService.getMyApplication(req.user!.id);
  sendSuccess(res, { application });
}

export async function submitPersonalDetails(req: Request, res: Response): Promise<void> {
  const application = await applicationService.submitPersonalDetails(req.user!.id, req.body);
  sendSuccess(res, { application }, 200, 'Eligibility check passed');
}

export async function uploadSalarySlip(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw ApiError.badRequest(`Attach a salary slip (${SALARY_SLIP_ALLOWED_LABEL})`);
  }
  // `requireEligibleApplication` guarantees req.application on this route.
  const application = await applicationService.attachSalarySlip(req.application!, req.file);
  sendSuccess(res, { application }, 200, 'Salary slip uploaded');
}
