import type { Request, Response } from 'express';
import type { IntentService } from '../services/intent.service.js';

export class IntentsController {
  constructor(private readonly intents: IntentService) {}

  async detect(req: Request, res: Response): Promise<void> {
    const { text, model } = req.body as { text: string; model?: string };
    const result = await this.intents.detect(text, model);
    res.status(200).json({ data: result });
  }
}
