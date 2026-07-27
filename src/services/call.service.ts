import type { CallRepository } from '../db/repositories/call.repository.js';
import type { EventRepository } from '../db/repositories/event.repository.js';
import type { Json } from '../types/common.js';
import type { VapiCall, VapiMessage } from '../types/vapi.js';

export class CallService {
  constructor(
    private readonly calls: CallRepository,
    private readonly events: EventRepository,
  ) {}

  async trackMessage(message: VapiMessage, agentId?: string | null): Promise<void> {
    const vapiCallId = message.call?.id;
    let callId: string | null = null;

    if (vapiCallId) {
      const call = await this.calls.ensureCall({
        vapiCallId,
        agentId,
        status: message.status ?? message.call?.status ?? 'in-progress',
        phoneNumber: message.call?.phoneNumber?.number ?? null,
        customerNumber: message.call?.customer?.number ?? null,
        raw: (message.call ?? {}) as Json,
      });
      callId = call.id;

      if (message.type === 'status-update' && message.status) {
        await this.calls.updateByVapiCallId(vapiCallId, { status: message.status });
      }

      if (message.type === 'end-of-call-report') {
        await this.calls.updateByVapiCallId(vapiCallId, {
          status: 'ended',
          ended_at: new Date().toISOString(),
          raw: message as unknown as Json,
        });
      }
    }

    await this.events.append({
      callId,
      vapiCallId: vapiCallId ?? null,
      eventType: message.type,
      payload: message as unknown as Json,
    });
  }

  async ensureFromCall(call: VapiCall, agentId?: string | null) {
    return this.calls.ensureCall({
      vapiCallId: call.id,
      agentId,
      status: call.status ?? 'in-progress',
      phoneNumber: call.phoneNumber?.number ?? null,
      customerNumber: call.customer?.number ?? null,
      raw: call as unknown as Json,
    });
  }
}
