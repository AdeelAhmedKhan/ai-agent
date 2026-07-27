import type { ToolInvocationRepository } from '../db/repositories/tool-invocation.repository.js';
import { logger } from '../lib/logger.js';
import type { ToolContext } from '../tools/tool.context.js';
import type { Json } from '../types/common.js';
import type { ToolCallRequest } from '../types/tools.js';
import type { VapiMessage, VapiToolCall, VapiToolCallResult } from '../types/vapi.js';
import type { ToolOrchestrator } from './tool-orchestrator.service.js';

function parseArguments(raw: string | Record<string, unknown>): Record<string, unknown> {
  if (typeof raw === 'object' && raw !== null) {
    return raw;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return { raw };
  }
}

function extractToolCalls(message: VapiMessage): VapiToolCall[] {
  if (Array.isArray(message.toolCallList) && message.toolCallList.length > 0) {
    return message.toolCallList;
  }
  if (Array.isArray(message.toolCalls) && message.toolCalls.length > 0) {
    return message.toolCalls;
  }
  return [];
}

export class ToolService {
  constructor(
    private readonly orchestrator: ToolOrchestrator,
    private readonly invocations: ToolInvocationRepository,
  ) {}

  async handleToolCalls(
    message: VapiMessage,
    context: ToolContext,
  ): Promise<{ results: VapiToolCallResult[] }> {
    const toolCalls = extractToolCalls(message);
    const requests: ToolCallRequest[] = toolCalls.map((call) => ({
      id: call.id,
      name: call.function.name,
      arguments: parseArguments(call.function.arguments),
    }));

    const started = Date.now();
    const { outcomes, vapiResults } = await this.orchestrator.executeForVapi(requests, context);

    await Promise.all(
      outcomes.map(async (outcome, index) => {
        const request = requests[index];
        if (!request) return;
        try {
          await this.invocations.create({
            callId: context.callId ?? null,
            vapiCallId: context.vapiCallId ?? null,
            toolName: request.name,
            toolCallId: request.id,
            args: request.arguments as Json,
            result: (outcome.error
              ? { error: outcome.error }
              : typeof outcome.result === 'string'
                ? { value: outcome.result }
                : outcome.result) as Json,
            status: outcome.error ? 'error' : 'success',
            latencyMs: Date.now() - started,
            errorMessage: outcome.error ?? null,
          });
        } catch (error) {
          logger.warn({ err: error }, 'Failed to persist tool invocation');
        }
      }),
    );

    return { results: vapiResults };
  }
}
