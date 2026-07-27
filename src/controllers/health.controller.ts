import type { Request, Response } from 'express';
import { pingDatabase } from '../db/client.js';

export class HealthController {
  liveness(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      service: 'voice-ai-agent',
      timestamp: new Date().toISOString(),
    });
  }

  async readiness(_req: Request, res: Response): Promise<void> {
    const dbOk = await pingDatabase();
    if (!dbOk) {
      res.status(503).json({
        status: 'unavailable',
        checks: { database: 'fail' },
      });
      return;
    }
    res.status(200).json({
      status: 'ready',
      checks: { database: 'ok' },
    });
  }
}
