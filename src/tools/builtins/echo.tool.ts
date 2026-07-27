import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

export class EchoTool implements IToolHandler {
  readonly definition = {
    name: 'echo',
    description: 'Echoes back the provided message. Useful for connectivity checks.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Message to echo back',
        },
      },
      required: ['message'],
    },
  };

  async execute(args: Record<string, unknown>, _context: ToolContext): Promise<string> {
    const message = typeof args.message === 'string' ? args.message : JSON.stringify(args);
    return message;
  }
}
