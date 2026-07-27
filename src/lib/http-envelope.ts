import type { Response } from 'express';

export interface SuccessEnvelope<T> {
  data: T;
  error: null;
}

export interface ErrorEnvelope {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: SuccessEnvelope<T> = { data, error: null };
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  error: { code: string; message: string; details?: unknown },
): void {
  const body: ErrorEnvelope = { data: null, error };
  res.status(status).json(body);
}
