import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * All environment variables are validated once at boot so that a
 * misconfigured deployment fails fast with a readable message instead of
 * crashing somewhere deep in a request handler.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(5),
  SEED_PASSWORD: z.string().min(6).default('Password@123'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  clientOrigins: parsed.data.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()),
};
