import type { Request, Response } from 'express';
import type { VapiWebhookService } from '../services/vapi-webhook.service.js';
import type { VapiWebhookBody } from '../types/vapi.js';

export class VapiWebhookController {
  constructor(private readonly webhookService: VapiWebhookService) {}

  async handle(req: Request, res: Response): Promise<void> {
    const body = req.body as VapiWebhookBody;
    const response = await this.webhookService.handle(body);

    if (Object.keys(response).length === 0) {
      res.status(200).end();
      return;
    }

    res.status(200).json(response);
  }
}
