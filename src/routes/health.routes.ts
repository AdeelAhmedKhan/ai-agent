import { Router } from 'express';
import type { HealthController } from '../controllers/health.controller.js';
import { asyncHandler } from '../lib/async-handler.js';

export function createHealthRoutes(controller: HealthController): Router {
  const router = Router();
  router.get('/health', (req, res) => controller.liveness(req, res));
  router.get('/ready', asyncHandler((req, res) => controller.readiness(req, res)));
  return router;
}
