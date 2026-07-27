import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import type { ILlmClient } from '../../../src/llm/llm.interface.js';
import { LlmService } from '../../../src/services/llm.service.js';

function createMockClient(content: string): ILlmClient {
  return {
    complete: mock.fn(async () => ({
      id: 'test',
      content,
      model: 'mock-model',
    })),
  };
}

describe('LlmService', () => {
  it('generateResponse returns trimmed model text', async () => {
    const client = createMockClient('  hello there  ');
    const service = new LlmService(client);
    const text = await service.generateResponse({ prompt: 'hi' });
    assert.equal(text, 'hello there');
    assert.equal((client.complete as ReturnType<typeof mock.fn>).mock.calls.length, 1);
  });

  it('generateSummary asks the model to summarize', async () => {
    const client = createMockClient('Short summary.');
    const service = new LlmService(client);
    const summary = await service.generateSummary({
      text: 'Long source text about many things.',
      focus: 'outcomes',
    });
    assert.equal(summary, 'Short summary.');
    const call = (client.complete as ReturnType<typeof mock.fn>).mock.calls[0];
    const messages = (call?.arguments[0] as { messages: Array<{ content: string }> }).messages;
    assert.match(messages.at(-1)?.content ?? '', /outcomes/);
    assert.match(messages.at(-1)?.content ?? '', /Long source text/);
  });

  it('detectIntent parses JSON intent payload', async () => {
    const client = createMockClient(
      JSON.stringify({
        intent: 'ask_question',
        confidence: 0.91,
        entities: { topic: 'billing' },
      }),
    );
    const service = new LlmService(client);
    const result = await service.detectIntent({
      text: 'I have a question about billing',
      candidateIntents: ['ask_question', 'other'],
    });
    assert.equal(result.intent, 'ask_question');
    assert.equal(result.confidence, 0.91);
    assert.equal(result.entities.topic, 'billing');
  });

  it('detectIntent prefers extractedEntities over entities', async () => {
    const client = createMockClient(
      JSON.stringify({
        intent: 'Support',
        confidence: 0.8,
        extractedEntities: { ticket: 'T-1' },
        entities: { ticket: 'ignored' },
      }),
    );
    const service = new LlmService(client);
    const result = await service.detectIntent({ text: 'I need help' });
    assert.equal(result.entities.ticket, 'T-1');
  });
});

