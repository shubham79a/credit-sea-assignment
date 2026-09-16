import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/db';

/**
 * Vercel serverless entry point.
 *
 * `vercel.json` rewrites every request to this function; Express then routes
 * on the original URL (`/api/...`). The Express app is built once per warm
 * instance and the Mongo connection is cached in `connectDatabase()`.
 *
 * Local development still uses `src/server.ts` (a normal long-running server).
 */
const app = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Database unavailable' }));
    return;
  }
  app(req, res);
}
