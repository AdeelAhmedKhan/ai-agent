import type { Logger } from '../lib/logger.js';

declare global {
  namespace Express {
    interface Request {
      log?: Logger;
      requestId?: string;
    }
  }
}

export {};
