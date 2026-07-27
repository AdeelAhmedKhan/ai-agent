import { z } from 'zod';
import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

const inputSchema = z.object({
  query: z.string().min(1),
});

export class LookupKnowledgeTool implements IToolHandler {
  readonly definition = {
    name: 'lookup_knowledge',
    description: 'Looks up an answer from a knowledge base for the given query (mocked).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query or user question',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  };

  readonly inputSchema = inputSchema;

  async execute(args: Record<string, unknown>, _context: ToolContext) {
    const query = String(args.query ?? '');
    return {
      mocked: true,
      query,
      results: [
        {
          id: 'kb_mock_1',
          title: 'General information',
          snippet: `Placeholder knowledge result for: "${query}". Replace with a real KB search later.`,
          score: 0.42,
        },
      ],
    };
  }
}
