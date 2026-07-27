import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { NotFoundError } from '../../../src/lib/errors.js';
import { ConversationService } from '../../../src/services/conversation.service.js';
import type { Json } from '../../../src/types/common.js';

const callRow = {
  id: 'call-1',
  vapi_call_id: 'vapi-1',
  agent_id: null,
  status: 'in-progress',
  direction: null,
  phone_number: null,
  customer_number: null,
  started_at: '2026-07-26T12:00:00.000Z',
  ended_at: null,
  raw: {} as Json,
  created_at: '2026-07-26T12:00:00.000Z',
  updated_at: '2026-07-26T12:00:00.000Z',
};

const messageRow = {
  id: 'msg-1',
  call_id: 'call-1',
  role: 'user',
  content: 'Hello',
  intent: 'greeting',
  occurred_at: '2026-07-26T12:00:01.000Z',
  metadata: {} as Json,
  created_at: '2026-07-26T12:00:01.000Z',
};

const toolRow = {
  id: 'tool-1',
  call_id: 'call-1',
  vapi_call_id: 'vapi-1',
  tool_name: 'echo',
  tool_call_id: 'tc-1',
  args: { text: 'hi' } as Json,
  result: { ok: true } as Json,
  status: 'success',
  latency_ms: 12,
  error_message: null,
  created_at: '2026-07-26T12:00:02.000Z',
};

const summaryRow = {
  id: 'sum-1',
  call_id: 'call-1',
  summary: 'User said hello.',
  intent: 'greeting',
  metadata: {} as Json,
  created_at: '2026-07-26T12:00:03.000Z',
  updated_at: '2026-07-26T12:00:03.000Z',
};

describe('ConversationService', () => {
  it('saveCall delegates to CallRepository.ensureCall', async () => {
    const ensureCall = mock.fn(async () => callRow);
    const service = new ConversationService(
      { ensureCall, findById: mock.fn() } as never,
      { create: mock.fn(), listByCallId: mock.fn() } as never,
      { create: mock.fn(), listByCallId: mock.fn() } as never,
      { upsertByCallId: mock.fn(), findByCallId: mock.fn() } as never,
    );

    const result = await service.saveCall({ vapiCallId: 'vapi-1', status: 'queued' });
    assert.equal(result.id, 'call-1');
    assert.equal(ensureCall.mock.calls.length, 1);
    assert.deepEqual(ensureCall.mock.calls[0]?.arguments[0], {
      vapiCallId: 'vapi-1',
      status: 'queued',
    });
  });

  it('saveMessage / saveToolCall / saveSummary persist via repositories', async () => {
    const createMessage = mock.fn(async () => messageRow);
    const createTool = mock.fn(async () => toolRow);
    const upsertSummary = mock.fn(async () => summaryRow);

    const service = new ConversationService(
      { ensureCall: mock.fn(), findById: mock.fn() } as never,
      { create: createMessage, listByCallId: mock.fn() } as never,
      { create: createTool, listByCallId: mock.fn() } as never,
      { upsertByCallId: upsertSummary, findByCallId: mock.fn() } as never,
    );

    await service.saveMessage({
      callId: 'call-1',
      role: 'user',
      content: 'Hello',
      intent: 'greeting',
    });
    await service.saveToolCall({
      callId: 'call-1',
      toolName: 'echo',
      args: { text: 'hi' },
      status: 'success',
    });
    await service.saveSummary({
      callId: 'call-1',
      summary: 'User said hello.',
      intent: 'greeting',
    });

    assert.equal(createMessage.mock.calls.length, 1);
    assert.equal(createTool.mock.calls.length, 1);
    assert.equal(upsertSummary.mock.calls.length, 1);
  });

  it('fetchConversation assembles call, messages, toolCalls, and summary', async () => {
    const service = new ConversationService(
      { ensureCall: mock.fn(), findById: mock.fn(async () => callRow) } as never,
      { create: mock.fn(), listByCallId: mock.fn(async () => [messageRow]) } as never,
      { create: mock.fn(), listByCallId: mock.fn(async () => [toolRow]) } as never,
      { upsertByCallId: mock.fn(), findByCallId: mock.fn(async () => summaryRow) } as never,
    );

    const conversation = await service.fetchConversation('call-1');
    assert.equal(conversation.call.id, 'call-1');
    assert.equal(conversation.messages.length, 1);
    assert.equal(conversation.toolCalls[0]?.tool_name, 'echo');
    assert.equal(conversation.summary?.summary, 'User said hello.');
  });

  it('fetchConversation throws NotFoundError when call is missing', async () => {
    const service = new ConversationService(
      { ensureCall: mock.fn(), findById: mock.fn(async () => null) } as never,
      { create: mock.fn(), listByCallId: mock.fn() } as never,
      { create: mock.fn(), listByCallId: mock.fn() } as never,
      { upsertByCallId: mock.fn(), findByCallId: mock.fn() } as never,
    );

    await assert.rejects(
      () => service.fetchConversation('missing'),
      (err: unknown) => err instanceof NotFoundError,
    );
  });
});
