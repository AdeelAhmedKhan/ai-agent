import { NotFoundError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import type { PatientRepository } from '../db/repositories/patient.repository.js';
import type {
  CreatePatientInput,
  ListPatientsQuery,
  Patient,
  UpdatePatientInput,
} from '../types/patient.js';

export class PatientService {
  constructor(private readonly patients: PatientRepository) {}

  async list(filters: ListPatientsQuery = {}): Promise<Patient[]> {
    return this.patients.list(filters);
  }

  async getById(id: string): Promise<Patient> {
    const patient = await this.patients.findById(id);
    if (!patient) {
      throw new NotFoundError(`Patient ${id} not found`);
    }
    return patient;
  }

  async findByPhone(phoneNumber: string): Promise<Patient | null> {
    return this.patients.findByPhone(phoneNumber);
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    const patient = await this.patients.create(input);
    logger.info(
      { patientId: patient.patient_id, payload: patient },
      'Patient record created',
    );
    return patient;
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const patient = await this.patients.update(id, input);
    logger.info(
      { patientId: patient.patient_id, payload: patient },
      'Patient record updated',
    );
    return patient;
  }

  async softDelete(id: string): Promise<Patient> {
    const patient = await this.patients.softDelete(id);
    logger.info({ patientId: patient.patient_id }, 'Patient record soft-deleted');
    return patient;
  }
}
