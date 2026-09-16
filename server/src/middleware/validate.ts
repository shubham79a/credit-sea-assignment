import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type RequestPart = 'body' | 'params' | 'query';

/**
 * Validates one part of the request against a Zod schema and replaces it with
 * the parsed (coerced, defaulted, stripped) value. ZodErrors are forwarded to
 * the global error handler, which renders them as a 400.
 */
export function validate(schema: ZodType, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(result.error);
    }

    if (part === 'query') {
      // Express 5 exposes `req.query` as a getter; store the parsed copy separately.
      Object.assign(req.query, result.data);
    } else {
      req[part] = result.data as never;
    }
    next();
  };
}
