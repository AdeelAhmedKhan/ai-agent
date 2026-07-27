import type { ToolExecutor } from '../tools/tool.executor.js';
import { toVapiResults } from '../tools/tool.formatter.js';
import type { ToolContext } from '../tools/tool.context.js';
import type { ToolCallRequest, ToolCallResult } from '../types/tools.js';
import type { VapiToolCallResult } from '../types/vapi.js';

export interface OrchestratedToolRun {
  outcomes: ToolCallResult[];
  vapiResults: VapiToolCallResult[];
}

/**
 * Owns validate → execute → format for tool calls.
 * Entry points (Vapi ToolService, future callers) should use this — not LlmService.
 */
export class ToolOrchestrator {
  constructor(private readonly executor: ToolExecutor) {}

  async executeRequestedTools(
    calls: ToolCallRequest[],
    context: ToolContext,
  ): Promise<ToolCallResult[]> {
    return this.executor.executeMany(calls, context);
  }

  async executeForVapi(
    calls: ToolCallRequest[],
    context: ToolContext,
  ): Promise<OrchestratedToolRun> {
    const outcomes = await this.executeRequestedTools(calls, context);
    return {
      outcomes,
      vapiResults: toVapiResults(outcomes),
    };
  }
}
