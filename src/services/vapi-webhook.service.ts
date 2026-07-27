import { logger } from '../lib/logger.js';
import type { AgentService } from './agent.service.js';
import type { CallService } from './call.service.js';
import type { ToolService } from './tool.service.js';
import type { VapiMessage, VapiWebhookBody } from '../types/vapi.js';

export type VapiWebhookResponse =
  | { assistant: Record<string, unknown> }
  | { results: Array<{ toolCallId: string; result: string }> }
  | Record<string, never>;

export class VapiWebhookService {
  constructor(
    private readonly agents: AgentService,
    private readonly calls: CallService,
    private readonly tools: ToolService,
  ) {}

  async handle(body: VapiWebhookBody): Promise<VapiWebhookResponse> {
    const message = body.message;
    logger.info({ type: message.type, callId: message.call?.id }, 'Vapi webhook received');

    switch (message.type) {
      case 'assistant-request':
        return this.handleAssistantRequest(message);
      case 'tool-calls':
        return this.handleToolCalls(message);
      case 'status-update':
      case 'transcript':
      case 'hang':
      case 'end-of-call-report':
      case 'speech-update':
      case 'conversation-update':
        await this.calls.trackMessage(message);
        return {};
      default:
        await this.calls.trackMessage(message);
        logger.debug({ type: message.type }, 'Unhandled Vapi message type acknowledged');
        return {};
    }
  }

  private async handleAssistantRequest(message: VapiMessage): Promise<VapiWebhookResponse> {
    const agent = await this.agents.resolveForCall(message.call);
    if (message.call) {
      await this.calls.ensureFromCall(message.call, agent.id);
    }
    await this.calls.trackMessage(message, agent.id);
    const assistant = await this.agents.buildAssistantPayload(agent);
    return { assistant };
  }

  private async handleToolCalls(message: VapiMessage): Promise<VapiWebhookResponse> {
    const agent = message.call ? await this.agents.resolveForCall(message.call) : null;
    const call = message.call
      ? await this.calls.ensureFromCall(message.call, agent?.id ?? null)
      : null;

    await this.calls.trackMessage(message, agent?.id ?? null);

    const callerPhone =
      message.call?.customer?.number ??
      (typeof message.call?.phoneNumber?.number === 'string'
        ? message.call.phoneNumber.number
        : undefined);

    const metadata: Record<string, unknown> = {
      ...((message.call?.metadata as Record<string, unknown> | undefined) ?? {}),
    };
    if (callerPhone) {
      metadata.callerPhone = callerPhone;
    }

    return this.tools.handleToolCalls(message, {
      callId: call?.id,
      vapiCallId: message.call?.id,
      agent,
      callerPhone,
      metadata,
    });
  }
}
