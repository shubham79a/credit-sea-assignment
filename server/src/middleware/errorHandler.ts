import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { SALARY_SLIP_FIELD } from '../constants/upload';
import { ApiError } from '../utils/ApiError';

/** 404 for any route that no router claimed. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

interface ErrorBody {
  success: false;
  message: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Central error → HTTP mapping. Everything the app throws ends up here, so the
 * client always receives the same `{ success: false, message, errors? }` shape.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (isMongoDuplicateKeyError(err)) {
    statusCode = 409;
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    message = `A record with this ${field} already exists`;
  } else if (err instanceof MulterError) {
    statusCode = 400;
    message = multerMessage(err);
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body';
  }

  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
  }

  const body: ErrorBody = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  if (!env.isProduction && err instanceof Error && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
}

function isMongoDuplicateKeyError(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

function multerMessage(err: MulterError): string {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return `File exceeds the maximum size of ${env.MAX_FILE_SIZE_MB} MB`;
    case 'LIMIT_FILE_COUNT':
      return 'Only one file may be uploaded at a time';
    case 'LIMIT_UNEXPECTED_FILE':
      return `Unexpected file field "${err.field}" — use "${SALARY_SLIP_FIELD}"`;
    default:
      return err.message;
  }
}
