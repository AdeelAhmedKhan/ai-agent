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

export function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  const key = req.header('x-api-key');
  if (!key || !safeEqual(key, env.ADMIN_API_KEY)) {
    next(new UnauthorizedError('Invalid admin API key'));
    return;
  }
  next();
}
