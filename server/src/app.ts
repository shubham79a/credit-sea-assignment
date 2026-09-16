import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRouter from './routes';

/**
 * CLIENT_ORIGIN entries may contain a `*` wildcard (e.g. `https://*.vercel.app`)
 * so Vercel preview deployments work without editing env vars each time.
 */
const originMatchers = env.clientOrigins.map((pattern) => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+');
  return new RegExp(`^${escaped}$`, 'i');
});

const isAllowedOrigin = (origin: string): boolean => originMatchers.some((re) => re.test(origin));

export function createApp(): express.Express {
  const app = express();

  // Behind Vercel's proxy — trust X-Forwarded-* so req.protocol / ip are right.
  app.set('trust proxy', 1);

  // --- Security & parsing -------------------------------------------------
  app.use(helmet());
  app.use(
    cors({
      // No Origin header (curl, server-to-server) → allow; browsers must match the list.
      origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (!env.isProduction) {
    app.use(morgan('dev'));
  }

  // --- API ----------------------------------------------------------------
  app.use('/api', apiRouter);

  // --- Errors -------------------------------------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
