import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => Boolean(data.email || data.phone || data.name), {
    message: 'At least one of name, email, or phone is required',
  });

export class SaveLeadTool implements IToolHandler {
  readonly definition = {
    name: 'save_lead',
    description: 'Saves a lead / contact record (mocked).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Contact name' },
        email: { type: 'string', description: 'Contact email' },
        phone: { type: 'string', description: 'Contact phone' },
        notes: { type: 'string', description: 'Optional notes' },
      },
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  async execute(args: Record<string, unknown>, _context: ToolContext) {
    return {
      mocked: true,
      leadId: `lead_${randomUUID().slice(0, 8)}`,
      name: typeof args.name === 'string' ? args.name : null,
      email: typeof args.email === 'string' ? args.email : null,
      phone: typeof args.phone === 'string' ? args.phone : null,
      notes: typeof args.notes === 'string' ? args.notes : null,
      status: 'captured',
    };
  }
}
