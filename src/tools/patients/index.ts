import type { PatientService } from '../../services/patient.service.js';
import type { IToolHandler } from '../tool.interface.js';
import { LookupPatientByPhoneTool } from './lookup-patient-by-phone.tool.js';
import { RegisterPatientTool } from './register-patient.tool.js';
import { UpdatePatientTool } from './update-patient.tool.js';

export function createPatientTools(patientService: PatientService): IToolHandler[] {
  return [
    new LookupPatientByPhoneTool(patientService),
    new RegisterPatientTool(patientService),
    new UpdatePatientTool(patientService),
  ];
}

export { LookupPatientByPhoneTool, RegisterPatientTool, UpdatePatientTool };
