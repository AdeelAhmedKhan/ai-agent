import { z } from 'zod';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = z.object({
  timezone: z.string().min(1).optional(),
});

export class GetBusinessHoursTool implements IToolHandler {
  readonly definition = {
    name: 'get_business_hours',
    description: 'Returns the business operating hours for a given timezone (mocked).',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'IANA timezone, e.g. America/Los_Angeles',
        },
      },
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  async execute(args: Record<string, unknown>, _context: ToolContext) {
    const timezone =
      typeof args.timezone === 'string' && args.timezone.length > 0
        ? args.timezone
        : 'UTC';

    return {
      mocked: true,
      timezone,
      hours: {
        monday: '09:00-17:00',
        tuesday: '09:00-17:00',
        wednesday: '09:00-17:00',
        thursday: '09:00-17:00',
        friday: '09:00-17:00',
        saturday: 'closed',
        sunday: 'closed',
      },
    };
  }
}
