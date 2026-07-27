import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/index.js';
import { UnauthorizedError } from '../lib/errors.js';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Verifies Vapi webhook auth via Bearer token or x-vapi-secret header.
 * Configure the same secret in Vapi Custom Credentials (Bearer).
 */
export function vapiAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.header('authorization');
  const bearer =
    authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined;
  const headerSecret = req.header('x-vapi-secret') ?? undefined;

  const provided = bearer ?? headerSecret;
  if (!provided || !safeEqual(provided, env.VAPI_WEBHOOK_SECRET)) {
    next(new UnauthorizedError('Invalid Vapi webhook credentials'));
    return;
  }
  next();
}
