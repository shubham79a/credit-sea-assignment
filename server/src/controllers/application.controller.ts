import type { Request, Response } from 'express';
import * as applicationService from '../services/application.service';
import { createSalarySlipSignature } from '../services/file.service';
import { assertNoActiveLoan } from '../services/loan.service';
import { sendSuccess } from '../utils/response';

export async function getMine(req: Request, res: Response): Promise<void> {
  const application = await applicationService.getMyApplication(req.user!.id);
  sendSuccess(res, { application });
}

export async function submitPersonalDetails(req: Request, res: Response): Promise<void> {
  const application = await applicationService.submitPersonalDetails(req.user!.id, req.body);
  sendSuccess(res, { application }, 200, 'Eligibility check passed');
}

/** Step 1 of the upload: hand the browser a signed, single-use upload ticket. */
export async function signSalarySlipUpload(req: Request, res: Response): Promise<void> {
  await assertNoActiveLoan(req.user!.id); // fail fast, before the browser uploads anything
  const signature = createSalarySlipSignature(req.user!.id);
  sendSuccess(res, { upload: signature });
}

/** Step 2 of the upload: verify the Cloudinary asset and link it to the application. */
export async function linkSalarySlip(req: Request, res: Response): Promise<void> {
  // `requireEligibleApplication` guarantees req.application on this route.
  const application = await applicationService.attachSalarySlip(req.application!, req.body);
  sendSuccess(res, { application }, 200, 'Salary slip uploaded');
}
