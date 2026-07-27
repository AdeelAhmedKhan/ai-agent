import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeDateOfBirth,
  normalizeUsPhone,
  tryNormalizeUsPhone,
} from '../../../src/lib/patient-normalize.js';
import {
  createPatientSchema,
  updatePatientSchema,
} from '../../../src/validators/patient.validators.js';

const validPatient = {
  first_name: "Mary-Anne",
  last_name: "O'Brien",
  date_of_birth: '03/15/1992',
  sex: 'Female' as const,
  phone_number: '(415) 555-0101',
  email: 'mary@example.com',
  address_line_1: '123 Main St',
  address_line_2: 'Unit 2',
  city: 'San Francisco',
  state: 'ca',
  zip_code: '94105',
};

describe('patient normalize helpers', () => {
  it('normalizes 10-digit and +1 US phones', () => {
    assert.equal(normalizeUsPhone('415-555-0101'), '4155550101');
    assert.equal(normalizeUsPhone('+1 (415) 555-0101'), '4155550101');
    assert.equal(tryNormalizeUsPhone('123'), null);
  });

  it('parses MM/DD/YYYY and rejects future DOB', () => {
    assert.equal(normalizeDateOfBirth('03/15/1992'), '1992-03-15');
    assert.equal(normalizeDateOfBirth('1992-03-15'), '1992-03-15');
    assert.throws(() => normalizeDateOfBirth('01/01/2999'));
  });
});

describe('createPatientSchema', () => {
  it('accepts a valid patient and normalizes fields', () => {
    const parsed = createPatientSchema.parse(validPatient);
    assert.equal(parsed.phone_number, '4155550101');
    assert.equal(parsed.date_of_birth, '1992-03-15');
    assert.equal(parsed.state, 'CA');
    assert.equal(parsed.preferred_language, 'English');
  });

  it('rejects invalid name, sex, state, and zip', () => {
    assert.equal(
      createPatientSchema.safeParse({ ...validPatient, first_name: 'Mary123' }).success,
      false,
    );
    assert.equal(
      createPatientSchema.safeParse({ ...validPatient, sex: 'Unknown' }).success,
      false,
    );
    assert.equal(
      createPatientSchema.safeParse({ ...validPatient, state: 'XX' }).success,
      false,
    );
    assert.equal(
      createPatientSchema.safeParse({ ...validPatient, zip_code: '9410' }).success,
      false,
    );
  });
});

describe('updatePatientSchema', () => {
  it('allows partial updates and rejects empty body', () => {
    assert.equal(updatePatientSchema.safeParse({ city: 'Oakland' }).success, true);
    assert.equal(updatePatientSchema.safeParse({}).success, false);
  });
});
