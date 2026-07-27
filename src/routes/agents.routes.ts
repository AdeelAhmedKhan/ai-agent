import { Router } from 'express';
import type { AgentsController } from '../controllers/agents.controller.js';
import { asyncHandler } from '../lib/async-handler.js';
import { adminAuth } from '../middleware/admin-auth.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  agentIdParamsSchema,
  createAgentSchema,
  updateAgentSchema,
} from '../validators/agent.validators.js';

export function createAgentsRoutes(controller: AgentsController): Router {
  const router = Router();

  router.use(adminAuth);

  router.get('/', asyncHandler((req, res) => controller.list(req, res)));
  router.get(
    '/:id',
    validateRequest(agentIdParamsSchema, 'params'),
    asyncHandler((req, res) => controller.getById(req, res)),
  );
  router.post(
    '/',
    validateRequest(createAgentSchema),
    asyncHandler((req, res) => controller.create(req, res)),
  );
  router.patch(
    '/:id',
    validateRequest(agentIdParamsSchema, 'params'),
    validateRequest(updateAgentSchema),
    asyncHandler((req, res) => controller.update(req, res)),
  );

  return router;
}
