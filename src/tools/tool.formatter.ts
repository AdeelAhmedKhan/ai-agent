import type { ToolCallResult } from '../types/tools.js';
import type { VapiToolCallResult } from '../types/vapi.js';

export function formatToolSuccess(value: string | Record<string, unknown>): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

export function formatToolError(
  message: string,
  details?: unknown,
): string {
  return JSON.stringify({
    error: message,
    ...(details !== undefined ? { details } : {}),
  });
}

export function toVapiResults(outcomes: ToolCallResult[]): VapiToolCallResult[] {
  return outcomes.map((outcome) => ({
    toolCallId: outcome.toolCallId,
    result: outcome.error
      ? formatToolError(outcome.error, typeof outcome.result === 'string' ? undefined : outcome.result)
      : typeof outcome.result === 'string'
        ? outcome.result
        : formatToolSuccess(outcome.result as Record<string, unknown>),
  }));
}
