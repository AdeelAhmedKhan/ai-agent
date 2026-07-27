import type { Request, Response } from 'express';
import { sendSuccess } from '../lib/http-envelope.js';
import type { PatientService } from '../services/patient.service.js';
import type {
  CreatePatientBody,
  ListPatientsQuery,
  UpdatePatientBody,
} from '../validators/patient.validators.js';

export class PatientsController {
  constructor(private readonly patients: PatientService) {}

  async list(req: Request, res: Response): Promise<void> {
    const filters = req.query as unknown as ListPatientsQuery;
    const data = await this.patients.list(filters);
    sendSuccess(res, data, 200);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const data = await this.patients.getById(req.params.id as string);
    sendSuccess(res, data, 200);
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = await this.patients.create(req.body as CreatePatientBody);
    sendSuccess(res, data, 201);
  }

  async update(req: Request, res: Response): Promise<void> {
    const data = await this.patients.update(
      req.params.id as string,
      req.body as UpdatePatientBody,
    );
    sendSuccess(res, data, 200);
  }

  async softDelete(req: Request, res: Response): Promise<void> {
    const data = await this.patients.softDelete(req.params.id as string);
    sendSuccess(res, data, 200);
  }
}
