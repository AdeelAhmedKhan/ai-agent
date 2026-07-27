import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PatientRepository } from '../../../src/db/repositories/patient.repository.js';
import { PatientService } from '../../../src/services/patient.service.js';
import type { Patient } from '../../../src/types/patient.js';

const active: Patient = {
  patient_id: '22222222-2222-4222-8222-222222222222',
  first_name: 'John',
  last_name: 'Smith',
  date_of_birth: '1985-11-02',
  sex: 'Male',
  phone_number: '2125550142',
  email: null,
  address_line_1: '456 Broadway',
  address_line_2: null,
  city: 'New York',
  state: 'NY',
  zip_code: '10013',
  insurance_provider: null,
  insurance_member_id: null,
  preferred_language: 'English',
  emergency_contact_name: null,
  emergency_contact_phone: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
};

describe('PatientService', () => {
  it('lists and soft-deletes via repository', async () => {
    const deleted = { ...active, deleted_at: '2026-07-01T00:00:00.000Z' };
    const calls: string[] = [];
    const repo = {
      list: async (filters) => {
        calls.push(`list:${filters.last_name ?? ''}`);
        return [active];
      },
      softDelete: async (id) => {
        calls.push(`delete:${id}`);
        return deleted;
      },
      findById: async () => active,
      findByPhone: async () => null,
      create: async () => active,
      update: async () => active,
    } as unknown as PatientRepository;

    const service = new PatientService(repo);
    const listed = await service.list({ last_name: 'Smith' });
    assert.equal(listed.length, 1);
    const result = await service.softDelete(active.patient_id);
    assert.equal(result.deleted_at, deleted.deleted_at);
    assert.deepEqual(calls, ['list:Smith', `delete:${active.patient_id}`]);
  });
});
