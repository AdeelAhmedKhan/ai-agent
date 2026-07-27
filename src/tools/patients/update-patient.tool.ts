import { z } from 'zod';
import { AppError } from '../../lib/errors.js';
import type { PatientService } from '../../services/patient.service.js';
import { updatePatientSchema } from '../../validators/patient.validators.js';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = updatePatientSchema.and(
  z.object({
    patient_id: z.string().uuid(),
    confirmed: z.literal(true, {
      error: 'Caller must explicitly confirm before update_patient is called',
    }),
  }),
);

export class UpdatePatientTool implements IToolHandler {
  readonly definition = {
    name: 'update_patient',
    description:
      'Updates an existing patient after the caller confirms changes. Use when a returning caller opts to update. Pass confirmed=true only after explicit confirmation.',
    parameters: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Existing patient UUID' },
        confirmed: {
          type: 'boolean',
          description: 'Must be true only after the caller explicitly confirms the update.',
        },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        date_of_birth: { type: 'string' },
        sex: {
          type: 'string',
          enum: ['Male', 'Female', 'Other', 'Decline to Answer'],
        },
        phone_number: { type: 'string' },
        email: { type: 'string' },
        address_line_1: { type: 'string' },
        address_line_2: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zip_code: { type: 'string' },
        insurance_provider: { type: 'string' },
        insurance_member_id: { type: 'string' },
        preferred_language: { type: 'string' },
        emergency_contact_name: { type: 'string' },
        emergency_contact_phone: { type: 'string' },
      },
      required: ['patient_id', 'confirmed'],
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

    const { patient_id, confirmed: _confirmed, ...patch } = parsed.data;

    try {
      const patient = await this.patients.update(patient_id, patch);
      return {
        success: true,
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        message: `Update saved. Tell the caller: You're all set, ${patient.first_name}.`,
        patient,
      };
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'We could not update the registration right now.';
      return {
        success: false,
        error: 'persist_failed',
        message: `${message} Apologize and offer to try again or have them call back later.`,
      };
    }
  }
}
