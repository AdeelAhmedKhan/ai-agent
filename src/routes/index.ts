import { Router } from 'express';
import type { AgentsController } from '../controllers/agents.controller.js';
import type { HealthController } from '../controllers/health.controller.js';
import type { IntentsController } from '../controllers/intents.controller.js';
import type { PatientsController } from '../controllers/patients.controller.js';
import type { VapiWebhookController } from '../controllers/vapi-webhook.controller.js';
import { createAgentsRoutes } from './agents.routes.js';
import { createHealthRoutes } from './health.routes.js';
import { createIntentsRoutes } from './intents.routes.js';
import { createPatientsRoutes } from './patients.routes.js';
import { createVapiRoutes } from './vapi.routes.js';

export function createRoutes(deps: {
  healthController: HealthController;
  vapiWebhookController: VapiWebhookController;
  agentsController: AgentsController;
  intentsController: IntentsController;
  patientsController: PatientsController;
}): Router {
  const router = Router();
  router.use(createHealthRoutes(deps.healthController));
  router.use(createVapiRoutes(deps.vapiWebhookController));
  router.use('/patients', createPatientsRoutes(deps.patientsController));
  router.use('/api/agents', createAgentsRoutes(deps.agentsController));
  router.use('/api/intents', createIntentsRoutes(deps.intentsController));
  return router;
}
