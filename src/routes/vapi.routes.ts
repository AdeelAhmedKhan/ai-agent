import { Router } from 'express';
import type { VapiWebhookController } from '../controllers/vapi-webhook.controller.js';
import { asyncHandler } from '../lib/async-handler.js';
import { validateRequest } from '../middleware/validate-request.js';
import { vapiAuth } from '../middleware/vapi-auth.js';
import { vapiWebhookSchema } from '../validators/vapi.validators.js';

export function createVapiRoutes(controller: VapiWebhookController): Router {
  const router = Router();
  router.post(
    '/webhooks/vapi',
    vapiAuth,
    validateRequest(vapiWebhookSchema),
    asyncHandler((req, res) => controller.handle(req, res)),
  );
  return router;
}
