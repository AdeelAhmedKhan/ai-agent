import { logger } from '../lib/logger.js';
import type { ToolCallRequest, ToolCallResult } from '../types/tools.js';
import { formatToolError, formatToolSuccess } from './tool.formatter.js';
import type { ToolContext } from './tool.context.js';
import type { ToolRegistry } from './tool.registry.js';
import { validateToolArgs } from './tool.validator.js';

export class ToolExecutor {
  constructor(private readonly registry: ToolRegistry) {}

  async executeOne(call: ToolCallRequest, context: ToolContext): Promise<ToolCallResult> {
    const started = Date.now();
    const handler = this.registry.get(call.name);

    if (!handler) {
      logger.warn({ tool: call.name, toolCallId: call.id }, 'Unknown tool requested');
      return {
        toolCallId: call.id,
        result: formatToolError(`Unknown tool: ${call.name}`),
        error: `Unknown tool: ${call.name}`,
      };
    }

    const validation = validateToolArgs(handler, call.arguments);
    if (!validation.ok) {
      logger.warn(
        { tool: call.name, toolCallId: call.id, issues: validation.error.issues },
        'Tool argument validation failed',
      );
      return {
        toolCallId: call.id,
        result: formatToolError(validation.error.message, validation.error.issues),
        error: validation.error.message,
      };
    }

    try {
      const raw = await handler.execute(validation.value, context);
      const result = formatToolSuccess(raw);
      logger.info(
        { tool: call.name, toolCallId: call.id, latencyMs: Date.now() - started },
        'Tool executed',
      );
      return { toolCallId: call.id, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tool execution failed';
      logger.error({ err: error, tool: call.name, toolCallId: call.id }, 'Tool execution error');
      return {
        toolCallId: call.id,
        result: formatToolError(message),
        error: message,
      };
    }
  }

  async executeMany(calls: ToolCallRequest[], context: ToolContext): Promise<ToolCallResult[]> {
    return Promise.all(calls.map((call) => this.executeOne(call, context)));
  }
}
