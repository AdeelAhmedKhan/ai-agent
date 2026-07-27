import { z } from 'zod';
import { tryNormalizeUsPhone } from '../../lib/patient-normalize.js';
import type { PatientService } from '../../services/patient.service.js';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = z.object({
  phone_number: z.string().min(1).optional(),
});

export class LookupPatientByPhoneTool implements IToolHandler {
  readonly definition = {
    name: 'lookup_patient_by_phone',
    description:
      'Looks up an existing active patient by U.S. phone number. Use early when the caller provides a phone or when caller ID is available. If found, ask whether they want to update instead of create.',
    parameters: {
      type: 'object',
      properties: {
        phone_number: {
          type: 'string',
          description:
            'U.S. phone number to look up. Optional if telephony caller ID is already known.',
        },
      },
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  constructor(private readonly patients: PatientService) {}

  async execute(args: Record<string, unknown>, context: ToolContext) {
    const raw =
      (typeof args.phone_number === 'string' && args.phone_number) ||
      context.callerPhone ||
      (typeof context.metadata?.callerPhone === 'string'
        ? context.metadata.callerPhone
        : undefined);

    if (!raw) {
      return {
        found: false,
        error: 'phone_required',
        message: 'A phone number is required to look up a patient.',
      };
    }

    const phone = tryNormalizeUsPhone(raw);
    if (!phone) {
      return {
        found: false,
        error: 'invalid_phone',
        message: 'That phone number does not look like a valid U.S. 10-digit number.',
      };
    }

    const patient = await this.patients.findByPhone(phone);
    if (!patient) {
      return {
        found: false,
        phone_number: phone,
        message: 'No existing patient found for this phone number.',
      };
    }

    return {
      found: true,
      phone_number: phone,
      patient: {
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth,
        phone_number: patient.phone_number,
      },
      message: `It looks like we already have a record for ${patient.first_name} ${patient.last_name}. Ask if they would like to update their information instead.`,
    };
  }
}
