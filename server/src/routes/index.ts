import { Router } from 'express';
import authRoutes from './auth.routes';

/**
 * API root. Every feature router is mounted here so `app.ts` only needs to
 * know about a single `/api` prefix.
 */
const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

router.use('/auth', authRoutes);

export default router;
