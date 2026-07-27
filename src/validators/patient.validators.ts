import { z } from 'zod';
import { normalizeDateOfBirth, tryNormalizeUsPhone } from '../lib/patient-normalize.js';
import { US_STATE_CODES } from '../lib/us-states.js';
import { PATIENT_SEX_VALUES } from '../types/patient.js';

const NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

const personName = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(NAME_PATTERN, 'Must be alphabetic with optional hyphens/apostrophes');

const usPhone = z.string().transform((val, ctx) => {
  const normalized = tryNormalizeUsPhone(val);
  if (!normalized) {
    ctx.addIssue({
      code: 'custom',
      message: 'Must be a valid U.S. 10-digit phone number',
    });
    return z.NEVER;
  }
  return normalized;
});

const dateOfBirth = z.string().transform((val, ctx) => {
  try {
    return normalizeDateOfBirth(val);
  } catch (error) {
    ctx.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'Invalid date_of_birth',
    });
    return z.NEVER;
  }
});

const usState = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine((val): val is (typeof US_STATE_CODES)[number] =>
    (US_STATE_CODES as readonly string[]).includes(val),
  {
    message: 'Must be a valid 2-letter U.S. state abbreviation',
  });

const zipCode = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, 'Must be 5-digit or ZIP+4 U.S. format');

const optionalEmail = z
  .union([z.string().trim().email(), z.literal(''), z.null()])
  .optional()
  .transform((val) => (val === '' || val === undefined ? null : val));

const optionalString = z
  .union([z.string().trim(), z.literal(''), z.null()])
  .optional()
  .transform((val) => (val === '' || val === undefined ? null : val));

export const createPatientSchema = z.object({
  first_name: personName,
  last_name: personName,
  date_of_birth: dateOfBirth,
  sex: z.enum(PATIENT_SEX_VALUES),
  phone_number: usPhone,
  email: optionalEmail,
  address_line_1: z.string().trim().min(1).max(200),
  address_line_2: optionalString,
  city: z.string().trim().min(1).max(100),
  state: usState,
  zip_code: zipCode,
  insurance_provider: optionalString,
  insurance_member_id: z
    .union([
      z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9-]+$/, 'Must be alphanumeric'),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .transform((val) => (val === '' || val === undefined ? null : val)),
  preferred_language: z
    .union([z.string().trim().min(1).max(50), z.literal(''), z.null()])
    .optional()
    .transform((val) => (val === '' || val === undefined || val === null ? 'English' : val)),
  emergency_contact_name: optionalString,
  emergency_contact_phone: z
    .union([z.string(), z.literal(''), z.null()])
    .optional()
    .transform((val, ctx) => {
      if (val === '' || val === undefined || val === null) return null;
      const normalized = tryNormalizeUsPhone(val);
      if (!normalized) {
        ctx.addIssue({
          code: 'custom',
          message: 'Must be a valid U.S. 10-digit phone number',
          path: ['emergency_contact_phone'],
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

export const updatePatientSchema = createPatientSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required for update' },
);

export const listPatientsQuerySchema = z.object({
  last_name: z.string().trim().min(1).optional(),
  date_of_birth: dateOfBirth.optional(),
  phone_number: usPhone.optional(),
});

export const patientIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreatePatientBody = z.infer<typeof createPatientSchema>;
export type UpdatePatientBody = z.infer<typeof updatePatientSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;
