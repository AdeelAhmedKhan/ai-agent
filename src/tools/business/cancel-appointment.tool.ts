import { z } from 'zod';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().optional(),
});

export class CancelAppointmentTool implements IToolHandler {
  readonly definition = {
    name: 'cancel_appointment',
    description: 'Cancels an existing appointment by id (mocked).',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: {
          type: 'string',
          description: 'Appointment identifier to cancel',
        },
        reason: { type: 'string', description: 'Optional cancellation reason' },
      },
      required: ['appointmentId'],
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  async execute(args: Record<string, unknown>, _context: ToolContext) {
    return {
      mocked: true,
      appointmentId: String(args.appointmentId ?? ''),
      status: 'cancelled',
      reason: typeof args.reason === 'string' ? args.reason : null,
    };
  }
}
