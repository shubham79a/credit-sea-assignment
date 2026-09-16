import { Router } from 'express';
import { ROLES } from '../constants/roles';
import * as loanController from '../controllers/loan.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { applyLoanSchema } from '../validators/loan.validator';

const router = Router();

router.use(authenticate);

/** POST /api/loans — borrower applies; 201 with the loan in APPLIED */
router.post('/', authorize(ROLES.BORROWER), validate(applyLoanSchema), loanController.apply);

/** GET /api/loans/me — borrower's own loans, newest first */
router.get('/me', authorize(ROLES.BORROWER), loanController.getMine);

// Executive routes (sanction / disburse / collect) are added by the dashboard modules.

export default router;
