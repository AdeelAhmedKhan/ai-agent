import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { sendError } from '../lib/http-envelope.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, 'Non-operational error');
    } else {
      logger.warn({ err, code: err.code }, err.message);
    }
    sendError(res, err.statusCode, {
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.issues,
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  sendError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  });
}
