import { Router } from 'express';
import { EXECUTIVE_ROLES, ROLES } from '../constants/roles';
import * as loanController from '../controllers/loan.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  applyLoanSchema,
  listLoansQuerySchema,
  loanIdParamSchema,
  rejectLoanSchema,
} from '../validators/loan.validator';
import { recordPaymentSchema } from '../validators/payment.validator';

const router = Router();

router.use(authenticate);

// --- Borrower ---------------------------------------------------------------

/** POST /api/loans — borrower applies; 201 with the loan in APPLIED */
router.post('/', authorize(ROLES.BORROWER), validate(applyLoanSchema), loanController.apply);

/** GET /api/loans/me — borrower's own loans, newest first */
router.get('/me', authorize(ROLES.BORROWER), loanController.getMine);

// --- Executives -------------------------------------------------------------
// authorize() gates the module; the service additionally scopes which statuses
// each role may read (MODULE_STATUSES) and which transitions it may perform.

/** GET /api/loans/summary — counts by status for the dashboard home */
router.get('/summary', authorize(...EXECUTIVE_ROLES), loanController.summary);

/** GET /api/loans?status=APPLIED — module queue (403 if the role doesn't own that status) */
router.get('/', authorize(...EXECUTIVE_ROLES), validate(listLoansQuerySchema, 'query'), loanController.list);

/** GET /api/loans/:id — detail (executives by status scope; borrowers their own) */
router.get('/:id', validate(loanIdParamSchema, 'params'), loanController.getOne);

/** Sanction module: APPLIED → SANCTIONED | REJECTED */
router.post('/:id/sanction', authorize(ROLES.SANCTION), validate(loanIdParamSchema, 'params'), loanController.sanction);
router.post(
  '/:id/reject',
  authorize(ROLES.SANCTION),
  validate(loanIdParamSchema, 'params'),
  validate(rejectLoanSchema),
  loanController.reject,
);

/** Disbursement module: SANCTIONED → DISBURSED */
router.post('/:id/disburse', authorize(ROLES.DISBURSEMENT), validate(loanIdParamSchema, 'params'), loanController.disburse);

/** Collection module: payments on DISBURSED loans; auto-close on full repayment */
router.get('/:id/payments', authorize(ROLES.COLLECTION), validate(loanIdParamSchema, 'params'), loanController.listPayments);
router.post(
  '/:id/payments',
  authorize(ROLES.COLLECTION),
  validate(loanIdParamSchema, 'params'),
  validate(recordPaymentSchema),
  loanController.recordPayment,
);

export default router;
