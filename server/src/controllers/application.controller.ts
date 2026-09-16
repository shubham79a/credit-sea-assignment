import type { Request, Response } from 'express';
import * as applicationService from '../services/application.service';
import { sendSuccess } from '../utils/response';

export async function getMine(req: Request, res: Response): Promise<void> {
  const application = await applicationService.getMyApplication(req.user!.id);
  sendSuccess(res, { application });
}

export async function submitPersonalDetails(req: Request, res: Response): Promise<void> {
  const application = await applicationService.submitPersonalDetails(req.user!.id, req.body);
  sendSuccess(res, { application }, 200, 'Eligibility check passed');
}
