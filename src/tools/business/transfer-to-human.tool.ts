import { z } from 'zod';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = z.object({
  reason: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
});

export class TransferToHumanTool implements IToolHandler {
  readonly definition = {
    name: 'transfer_to_human',
    description: 'Requests transfer of the call to a human agent (mocked).',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why the caller needs a human' },
        department: {
          type: 'string',
          description: 'Optional department or queue name',
        },
      },
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  async execute(args: Record<string, unknown>, context: ToolContext) {
    return {
      mocked: true,
      accepted: true,
      queue: typeof args.department === 'string' ? args.department : 'general',
      reason: typeof args.reason === 'string' ? args.reason : null,
      vapiCallId: context.vapiCallId ?? null,
      message: 'Transfer request accepted (mock). Replace with real telephony transfer later.',
    };
  }
}
