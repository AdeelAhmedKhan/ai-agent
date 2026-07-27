import { AppError, NotFoundError } from '../../lib/errors.js';
import type {
  CreatePatientInput,
  ListPatientsQuery,
  Patient,
  UpdatePatientInput,
} from '../../types/patient.js';
import type { Database } from '../../types/database.js';
import type { DbClient } from '../client.js';

type PatientRow = Database['public']['Tables']['patients']['Row'];
type PatientInsert = Database['public']['Tables']['patients']['Insert'];
type PatientUpdate = Database['public']['Tables']['patients']['Update'];

function toPatient(row: PatientRow): Patient {
  return {
    ...row,
    sex: row.sex as Patient['sex'],
  };
}

export class PatientRepository {
  constructor(private readonly db: DbClient) {}

  async list(filters: ListPatientsQuery = {}): Promise<Patient[]> {
    let query = this.db
      .from('patients')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filters.last_name) {
      query = query.ilike('last_name', filters.last_name);
    }
    if (filters.date_of_birth) {
      query = query.eq('date_of_birth', filters.date_of_birth);
    }
    if (filters.phone_number) {
      query = query.eq('phone_number', filters.phone_number);
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError('Failed to list patients', { cause: error, code: 'DB_ERROR' });
    }
    return (data ?? []).map(toPatient);
  }

  async findById(id: string, includeDeleted = false): Promise<Patient | null> {
    let query = this.db.from('patients').select('*').eq('patient_id', id);
    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }
    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new AppError('Failed to fetch patient', { cause: error, code: 'DB_ERROR' });
    }
    return data ? toPatient(data) : null;
  }

  async findByPhone(phoneNumber: string): Promise<Patient | null> {
    const { data, error } = await this.db
      .from('patients')
      .select('*')
      .eq('phone_number', phoneNumber)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch patient by phone', { cause: error, code: 'DB_ERROR' });
    }
    return data ? toPatient(data) : null;
  }

  async create(input: CreatePatientInput): Promise<Patient> {
    const row: PatientInsert = {
      first_name: input.first_name,
      last_name: input.last_name,
      date_of_birth: input.date_of_birth,
      sex: input.sex,
      phone_number: input.phone_number,
      email: input.email ?? null,
      address_line_1: input.address_line_1,
      address_line_2: input.address_line_2 ?? null,
      city: input.city,
      state: input.state,
      zip_code: input.zip_code,
      insurance_provider: input.insurance_provider ?? null,
      insurance_member_id: input.insurance_member_id ?? null,
      preferred_language: input.preferred_language ?? 'English',
      emergency_contact_name: input.emergency_contact_name ?? null,
      emergency_contact_phone: input.emergency_contact_phone ?? null,
    };

    const { data, error } = await this.db.from('patients').insert(row).select('*').single();
    if (error || !data) {
      if (error?.code === '23505') {
        throw new AppError('A patient with this phone number already exists', {
          statusCode: 422,
          code: 'DUPLICATE_PHONE',
          cause: error,
        });
      }
      throw new AppError('Failed to create patient', { cause: error, code: 'DB_ERROR' });
    }
    return toPatient(data);
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const patch: PatientUpdate = {};
    if (input.first_name !== undefined) patch.first_name = input.first_name;
    if (input.last_name !== undefined) patch.last_name = input.last_name;
    if (input.date_of_birth !== undefined) patch.date_of_birth = input.date_of_birth;
    if (input.sex !== undefined) patch.sex = input.sex;
    if (input.phone_number !== undefined) patch.phone_number = input.phone_number;
    if (input.email !== undefined) patch.email = input.email;
    if (input.address_line_1 !== undefined) patch.address_line_1 = input.address_line_1;
    if (input.address_line_2 !== undefined) patch.address_line_2 = input.address_line_2;
    if (input.city !== undefined) patch.city = input.city;
    if (input.state !== undefined) patch.state = input.state;
    if (input.zip_code !== undefined) patch.zip_code = input.zip_code;
    if (input.insurance_provider !== undefined) patch.insurance_provider = input.insurance_provider;
    if (input.insurance_member_id !== undefined) {
      patch.insurance_member_id = input.insurance_member_id;
    }
    if (input.preferred_language !== undefined) {
      patch.preferred_language = input.preferred_language ?? 'English';
    }
    if (input.emergency_contact_name !== undefined) {
      patch.emergency_contact_name = input.emergency_contact_name;
    }
    if (input.emergency_contact_phone !== undefined) {
      patch.emergency_contact_phone = input.emergency_contact_phone;
    }

    const { data, error } = await this.db
      .from('patients')
      .update(patch)
      .eq('patient_id', id)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('A patient with this phone number already exists', {
          statusCode: 422,
          code: 'DUPLICATE_PHONE',
          cause: error,
        });
      }
      throw new AppError('Failed to update patient', { cause: error, code: 'DB_ERROR' });
    }
    if (!data) {
      throw new NotFoundError(`Patient ${id} not found`);
    }
    return toPatient(data);
  }

  async softDelete(id: string): Promise<Patient> {
    const { data, error } = await this.db
      .from('patients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('patient_id', id)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to delete patient', { cause: error, code: 'DB_ERROR' });
    }
    if (!data) {
      throw new NotFoundError(`Patient ${id} not found`);
    }
    return toPatient(data);
  }
}
