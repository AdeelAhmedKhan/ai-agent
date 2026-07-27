import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'];
    const id = typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customProps: (req) => ({
    requestId: req.id,
  }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
  },
});

export function attachRequestId(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = typeof req.id === 'string' ? req.id : String(req.id ?? '');
  next();
}
