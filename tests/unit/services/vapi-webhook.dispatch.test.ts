import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { VapiWebhookService } from '../../../src/services/vapi-webhook.service.js';

describe('VapiWebhookService dispatch', () => {
  it('returns assistant payload for assistant-request', async () => {
    const agents = {
      resolveForCall: mock.fn(async () => ({
        id: 'agent-1',
        slug: 'default',
        name: 'Default',
      })),
      buildAssistantPayload: mock.fn(async () => ({ name: 'Default' })),
    };
    const calls = {
      ensureFromCall: mock.fn(async () => ({ id: 'call-1' })),
      trackMessage: mock.fn(async () => undefined),
    };
    const tools = {
      handleToolCalls: mock.fn(),
    };

    const service = new VapiWebhookService(
      agents as never,
      calls as never,
      tools as never,
    );

    const response = await service.handle({
      message: {
        type: 'assistant-request',
        call: { id: 'vapi-call-1' },
      },
    });

    assert.deepEqual(response, { assistant: { name: 'Default' } });
    assert.equal(agents.buildAssistantPayload.mock.calls.length, 1);
  });

  it('delegates tool-calls to ToolService', async () => {
    const agents = {
      resolveForCall: mock.fn(async () => ({ id: 'agent-1', slug: 'default' })),
      buildAssistantPayload: mock.fn(),
    };
    const calls = {
      ensureFromCall: mock.fn(async () => ({ id: 'call-1' })),
      trackMessage: mock.fn(async () => undefined),
    };
    const tools = {
      handleToolCalls: mock.fn(async () => ({
        results: [{ toolCallId: 't1', result: 'ok' }],
      })),
    };

    const service = new VapiWebhookService(
      agents as never,
      calls as never,
      tools as never,
    );

    const response = await service.handle({
      message: {
        type: 'tool-calls',
        call: {
          id: 'vapi-call-1',
          customer: { number: '+14155550101' },
        },
        toolCallList: [
          {
            id: 't1',
            function: { name: 'echo', arguments: { message: 'hi' } },
          },
        ],
      },
    });

    assert.deepEqual(response, { results: [{ toolCallId: 't1', result: 'ok' }] });
    assert.equal(tools.handleToolCalls.mock.calls.length, 1);
    const context = tools.handleToolCalls.mock.calls[0]?.arguments[1] as {
      callerPhone?: string;
    };
    assert.equal(context.callerPhone, '+14155550101');
  });
});
