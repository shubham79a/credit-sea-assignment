import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRouter from './routes';

export function createApp(): express.Express {
  const app = express();

  // --- Security & parsing -------------------------------------------------
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (!env.isProduction) {
    app.use(morgan('dev'));
  }

  // --- Static: uploaded salary slips --------------------------------------
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  // --- API ----------------------------------------------------------------
  app.use('/api', apiRouter);

  // --- Errors -------------------------------------------------------------
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
