import { Router } from 'express';
import { ROLES } from '../constants/roles';
import * as applicationController from '../controllers/application.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { personalDetailsSchema } from '../validators/application.validator';

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

export default router;
