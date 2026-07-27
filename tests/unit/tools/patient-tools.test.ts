import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Patient } from '../../../src/types/patient.js';
import type { PatientService } from '../../../src/services/patient.service.js';
import { LookupPatientByPhoneTool } from '../../../src/tools/patients/lookup-patient-by-phone.tool.js';
import { RegisterPatientTool } from '../../../src/tools/patients/register-patient.tool.js';
import { UpdatePatientTool } from '../../../src/tools/patients/update-patient.tool.js';
import { ToolExecutor } from '../../../src/tools/tool.executor.js';
import { ToolRegistry } from '../../../src/tools/tool.registry.js';
import { createPatientTools } from '../../../src/tools/patients/index.js';

const samplePatient: Patient = {
  patient_id: '11111111-1111-4111-8111-111111111111',
  first_name: 'Jane',
  last_name: 'Doe',
  date_of_birth: '1990-05-15',
  sex: 'Female',
  phone_number: '4155550101',
  email: 'jane.doe@example.com',
  address_line_1: '123 Market St',
  address_line_2: 'Apt 4B',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94105',
  insurance_provider: 'Example Health',
  insurance_member_id: 'MEM12345',
  preferred_language: 'English',
  emergency_contact_name: 'John Doe',
  emergency_contact_phone: '4155550199',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
};

function mockPatients(overrides: Partial<PatientService> = {}): PatientService {
  return {
    list: async () => [],
    getById: async () => samplePatient,
    findByPhone: async () => null,
    create: async () => samplePatient,
    update: async () => samplePatient,
    softDelete: async () => samplePatient,
    ...overrides,
  } as PatientService;
}

describe('patient tools', () => {
  it('lookup uses callerPhone from context when args omit phone', async () => {
    const tool = new LookupPatientByPhoneTool(
      mockPatients({
        findByPhone: async (phone) =>
          phone === '4155550101' ? samplePatient : null,
      }),
    );
    const result = (await tool.execute({}, { callerPhone: '+1 415 555 0101' })) as {
      found: boolean;
      patient?: { first_name: string };
    };
    assert.equal(result.found, true);
    assert.equal(result.patient?.first_name, 'Jane');
  });

  it('register_patient rejects when confirmed is missing via executor', async () => {
    const registry = new ToolRegistry();
    registry.registerMany(createPatientTools(mockPatients()));
    const executor = new ToolExecutor(registry);
    const outcome = await executor.executeOne(
      {
        id: 'tc1',
        name: 'register_patient',
        arguments: {
          first_name: 'Jane',
          last_name: 'Doe',
          date_of_birth: '05/15/1990',
          sex: 'Female',
          phone_number: '4155550199',
          address_line_1: '1 Main',
          city: 'SF',
          state: 'CA',
          zip_code: '94105',
        },
      },
      {},
    );
    assert.ok(outcome.error);
    assert.match(String(outcome.result), /Invalid arguments|confirmed/i);
  });

  it('register_patient creates when confirmed=true', async () => {
    let created = false;
    const tool = new RegisterPatientTool(
      mockPatients({
        create: async () => {
          created = true;
          return samplePatient;
        },
      }),
    );
    const result = (await tool.execute(
      {
        confirmed: true,
        first_name: 'Jane',
        last_name: 'Doe',
        date_of_birth: '05/15/1990',
        sex: 'Female',
        phone_number: '4155550199',
        address_line_1: '1 Main',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94105',
      },
      {},
    )) as { success: boolean; patient_id: string };
    assert.equal(result.success, true);
    assert.equal(created, true);
    assert.equal(result.patient_id, samplePatient.patient_id);
  });

  it('update_patient requires confirmed=true', async () => {
    const tool = new UpdatePatientTool(mockPatients());
    const result = (await tool.execute(
      {
        patient_id: samplePatient.patient_id,
        city: 'Oakland',
      },
      {},
    )) as { success: boolean; error?: string };
    assert.equal(result.success, false);
    assert.equal(result.error, 'validation_failed');
  });
});
