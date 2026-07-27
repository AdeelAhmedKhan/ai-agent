import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../lib/errors.js';

type RequestTarget = 'body' | 'query' | 'params';

/**
 * Express 5 exposes `req.query` / `req.params` as getter-only properties.
 * Replace them via defineProperty when direct assignment is not allowed.
 */
function assignValidated(req: Request, target: RequestTarget, data: unknown): void {
  try {
    (req as Request & Record<RequestTarget, unknown>)[target] = data;
    return;
  } catch {
    // fall through — Express 5 getter-only query/params
  }

  Object.defineProperty(req, target, {
    value: data,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

export function validateRequest<T>(schema: ZodType<T>, target: RequestTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[target]);
    if (!parsed.success) {
      next(
        new ValidationError('Request validation failed', {
          target,
          issues: parsed.error.issues,
        }),
      );
      return;
    }
    assignValidated(req, target, parsed.data);
    next();
  };
}
