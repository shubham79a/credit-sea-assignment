import { Router } from 'express';
import { ROLES } from '../constants/roles';
import * as applicationController from '../controllers/application.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { requireEligibleApplication } from '../middleware/requireEligibleApplication';
import { validate } from '../middleware/validate';
import { linkSalarySlipSchema, personalDetailsSchema } from '../validators/application.validator';

const router = Router();

// The whole resource is the borrower's own application — borrowers only.
router.use(authenticate, authorize(ROLES.BORROWER));

/** GET /api/applications/me — current borrower's application (null if none yet) */
router.get('/me', applicationController.getMine);

/** PUT /api/applications/me/personal-details — upsert details + run BRE (422 on failure) */
router.put(
  '/me/personal-details',
  validate(personalDetailsSchema),
  applicationController.submitPersonalDetails,
);

/**
 * Salary slip — two-step, serverless-safe upload:
 *   POST /me/salary-slip/sign  → signed Cloudinary upload params (409 if BRE not passed)
 *   (browser uploads the file straight to Cloudinary)
 *   POST /me/salary-slip       → { publicId, originalName }; API verifies the asset and links it
 *                                 400 bad type/size/unknown asset · 409 BRE not passed
 */
router.post('/me/salary-slip/sign', requireEligibleApplication, applicationController.signSalarySlipUpload);
router.post(
  '/me/salary-slip',
  requireEligibleApplication,
  validate(linkSalarySlipSchema),
  applicationController.linkSalarySlip,
);

export default router;
