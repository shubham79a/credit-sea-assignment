import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

/** POST /api/auth/register — public, creates a BORROWER account */
router.post('/register', validate(registerSchema), authController.register);

/** POST /api/auth/login — public, returns a JWT for any role */
router.post('/login', validate(loginSchema), authController.login);

/** GET /api/auth/me — any authenticated user */
router.get('/me', authenticate, authController.me);

export default router;
