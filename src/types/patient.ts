export const PATIENT_SEX_VALUES = [
  'Male',
  'Female',
  'Other',
  'Decline to Answer',
] as const;

export type PatientSex = (typeof PATIENT_SEX_VALUES)[number];

export interface Patient {
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: PatientSex;
  phone_number: string;
  email: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  zip_code: string;
  insurance_provider: string | null;
  insurance_member_id: string | null;
  preferred_language: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreatePatientInput {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: PatientSex;
  phone_number: string;
  email?: string | null;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  insurance_provider?: string | null;
  insurance_member_id?: string | null;
  preferred_language?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export type UpdatePatientInput = Partial<CreatePatientInput>;

export interface ListPatientsQuery {
  last_name?: string;
  date_of_birth?: string;
  phone_number?: string;
}
