import { Router } from 'express';
import type { PatientsController } from '../controllers/patients.controller.js';
import { asyncHandler } from '../lib/async-handler.js';
import { adminAuth } from '../middleware/admin-auth.js';
import { validateRequest } from '../middleware/validate-request.js';
import {
  createPatientSchema,
  listPatientsQuerySchema,
  patientIdParamsSchema,
  updatePatientSchema,
} from '../validators/patient.validators.js';

export function createPatientsRoutes(controller: PatientsController): Router {
  const router = Router();

  router.use(adminAuth);

  router.get(
    '/',
    validateRequest(listPatientsQuerySchema, 'query'),
    asyncHandler((req, res) => controller.list(req, res)),
  );

  router.get(
    '/:id',
    validateRequest(patientIdParamsSchema, 'params'),
    asyncHandler((req, res) => controller.getById(req, res)),
  );

  router.post(
    '/',
    validateRequest(createPatientSchema),
    asyncHandler((req, res) => controller.create(req, res)),
  );

  router.put(
    '/:id',
    validateRequest(patientIdParamsSchema, 'params'),
    validateRequest(updatePatientSchema),
    asyncHandler((req, res) => controller.update(req, res)),
  );

  router.delete(
    '/:id',
    validateRequest(patientIdParamsSchema, 'params'),
    asyncHandler((req, res) => controller.softDelete(req, res)),
  );

  return router;
}
