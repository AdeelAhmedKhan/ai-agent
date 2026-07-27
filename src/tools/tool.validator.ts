import { err, ok, type Result } from '../lib/result.js';
import type { IToolHandler } from './tool.interface.js';

export interface ToolValidationFailure {
  message: string;
  issues?: unknown;
}

export function validateToolArgs(
  handler: IToolHandler,
  args: Record<string, unknown>,
): Result<Record<string, unknown>, ToolValidationFailure> {
  if (!handler.inputSchema) {
    return ok(args);
  }

  const parsed = handler.inputSchema.safeParse(args);
  if (!parsed.success) {
    return err({
      message: `Invalid arguments for tool "${handler.definition.name}"`,
      issues: parsed.error.issues,
    });
  }

  const data = parsed.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return ok(data as Record<string, unknown>);
  }
  return ok(args);
}
