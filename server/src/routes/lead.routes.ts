import { Router } from 'express';
import { ROLES } from '../constants/roles';
import * as leadController from '../controllers/lead.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

/** GET /api/leads — Sales module: borrowers who registered but haven't applied yet */
router.get('/', authenticate, authorize(ROLES.SALES), leadController.list);

export default router;
