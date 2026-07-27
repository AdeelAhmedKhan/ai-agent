import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import type { PatientService } from '../../services/patient.service.js';
import { createPatientSchema } from '../../validators/patient.validators.js';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = createPatientSchema.extend({
  confirmed: z.literal(true, {
    error: 'Caller must explicitly confirm before register_patient is called',
  }),
});

export class RegisterPatientTool implements IToolHandler {
  readonly definition = {
    name: 'register_patient',
    description:
      'Creates a new patient record AFTER reading back all fields and receiving explicit caller confirmation. Always pass confirmed=true only when the caller has confirmed.',
    parameters: {
      type: 'object',
      properties: {
        confirmed: {
          type: 'boolean',
          description: 'Must be true only after the caller explicitly confirms the read-back.',
        },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        date_of_birth: {
          type: 'string',
          description: 'MM/DD/YYYY or YYYY-MM-DD',
        },
        sex: {
          type: 'string',
          enum: ['Male', 'Female', 'Other', 'Decline to Answer'],
        },
        phone_number: { type: 'string' },
        email: { type: 'string' },
        address_line_1: { type: 'string' },
        address_line_2: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string', description: '2-letter U.S. state code' },
        zip_code: { type: 'string' },
        insurance_provider: { type: 'string' },
        insurance_member_id: { type: 'string' },
        preferred_language: { type: 'string' },
        emergency_contact_name: { type: 'string' },
        emergency_contact_phone: { type: 'string' },
      },
      required: [
        'confirmed',
        'first_name',
        'last_name',
        'date_of_birth',
        'sex',
        'phone_number',
        'address_line_1',
        'city',
        'state',
        'zip_code',
      ],
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  constructor(private readonly patients: PatientService) {}

  async execute(args: Record<string, unknown>, _context: ToolContext) {
    const parsed = inputSchema.safeParse(args);
    if (!parsed.success) {
      return {
        success: false,
        error: 'validation_failed',
        message:
          'Some fields are invalid. Re-prompt specifically for the invalid field(s) and try again after confirmation.',
        details: parsed.error.issues,
      };
    }

    const { confirmed: _confirmed, ...payload } = parsed.data;

    try {
      const existing = await this.patients.findByPhone(payload.phone_number);
      if (existing) {
        return {
          success: false,
          error: 'duplicate_phone',
          patient_id: existing.patient_id,
          first_name: existing.first_name,
          last_name: existing.last_name,
          message: `It looks like we already have a record for ${existing.first_name} ${existing.last_name}. Ask if they would like to update instead of creating a new record.`,
        };
      }

      const patient = await this.patients.create(payload);
      return {
        success: true,
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        message: `Registration saved. Tell the caller: You're all set, ${patient.first_name}.`,
        patient,
      };
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'We could not save the registration right now.';
      return {
        success: false,
        error: 'persist_failed',
        message: `${message} Apologize and offer to try again or have them call back later.`,
      };
    }
  }
}
