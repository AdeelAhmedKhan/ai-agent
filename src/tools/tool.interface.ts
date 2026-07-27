import type { ZodTypeAny } from 'zod';
import type { ToolCallResult, ToolDefinition } from '../types/tools.js';
import type { ToolContext } from './tool.context.js';

export interface IToolHandler {
  readonly definition: ToolDefinition;
  /** Optional Zod schema for runtime arg validation */
  readonly inputSchema?: ZodTypeAny;
  execute(
    args: Record<string, unknown>,
    context: ToolContext,
  ): Promise<string | Record<string, unknown>>;
}

export type { ToolCallResult, ToolDefinition };
