import { Router } from 'express';
import type { IntentsController } from '../controllers/intents.controller.js';
import { asyncHandler } from '../lib/async-handler.js';
import { adminAuth } from '../middleware/admin-auth.js';
import { validateRequest } from '../middleware/validate-request.js';
import { detectIntentSchema } from '../validators/intent.validators.js';

export function createIntentsRoutes(controller: IntentsController): Router {
  const router = Router();

  router.use(adminAuth);

  router.post(
    '/detect',
    validateRequest(detectIntentSchema),
    asyncHandler((req, res) => controller.detect(req, res)),
  );

  return router;
}
