import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = z.object({
  startsAt: z.string().min(1),
  partyName: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export class ScheduleAppointmentTool implements IToolHandler {
  readonly definition = {
    name: 'schedule_appointment',
    description: 'Schedules an appointment at the requested time (mocked).',
    parameters: {
      type: 'object',
      properties: {
        startsAt: {
          type: 'string',
          description: 'ISO-8601 start datetime',
        },
        partyName: {
          type: 'string',
          description: 'Name of the person booking',
        },
        notes: { type: 'string', description: 'Optional notes' },
      },
      required: ['startsAt'],
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  async execute(args: Record<string, unknown>, _context: ToolContext) {
    return {
      mocked: true,
      appointmentId: `apt_${randomUUID().slice(0, 8)}`,
      status: 'scheduled',
      startsAt: String(args.startsAt ?? ''),
      partyName: typeof args.partyName === 'string' ? args.partyName : null,
      notes: typeof args.notes === 'string' ? args.notes : null,
    };
  }
}
