import type { IToolHandler } from '../tool.interface.js';
import type { ToolContext } from '../tool.context.js';

export class HealthTool implements IToolHandler {
  readonly definition = {
    name: 'health',
    description: 'Returns a simple health status payload for the voice agent backend.',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  };

  async execute(_args: Record<string, unknown>, context: ToolContext): Promise<Record<string, unknown>> {
    return {
      status: 'ok',
      service: 'voice-ai-agent',
      vapiCallId: context.vapiCallId ?? null,
      agentSlug: context.agent?.slug ?? null,
      timestamp: new Date().toISOString(),
    };
  }
}
