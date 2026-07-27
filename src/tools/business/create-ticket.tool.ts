import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

export class CreateTicketTool implements IToolHandler {
  readonly definition = {
    name: 'create_ticket',
    description: 'Creates a support ticket (mocked).',
    parameters: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Short ticket subject' },
        description: { type: 'string', description: 'Detailed description' },
        priority: {
          type: 'string',
          enum: ['low', 'normal', 'high'],
          description: 'Ticket priority',
        },
      },
      required: ['subject'],
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  async execute(args: Record<string, unknown>, _context: ToolContext) {
    return {
      mocked: true,
      ticketId: `tkt_${randomUUID().slice(0, 8)}`,
      status: 'open',
      subject: String(args.subject ?? ''),
      description: typeof args.description === 'string' ? args.description : null,
      priority: typeof args.priority === 'string' ? args.priority : 'normal',
    };
  }
}
