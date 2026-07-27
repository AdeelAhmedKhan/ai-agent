import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it, mock } from 'node:test';
import type { ILlmClient } from '../../../src/llm/llm.interface.js';
import { IntentService } from '../../../src/services/intent.service.js';
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

describe('IntentService', () => {
  const intentsConfigPath = path.resolve(process.cwd(), 'config/intents.json');

  it('returns extractedEntities and catalog intent labels', async () => {
    const client = createMockClient(
      JSON.stringify({
        intent: 'Billing',
        confidence: 0.88,
        extractedEntities: { account: '123' },
      }),
    );
    const service = new IntentService(new LlmService(client), intentsConfigPath);
    const result = await service.detect('What do I owe this month?');

    assert.equal(result.intent, 'Billing');
    assert.equal(result.confidence, 0.88);
    assert.equal(result.extractedEntities.account, '123');
  });

  it('normalizes out-of-catalog labels to Unknown', async () => {
    const client = createMockClient(
      JSON.stringify({
        intent: 'not_a_real_intent',
        confidence: 0.95,
        entities: {},
      }),
    );
    const service = new IntentService(new LlmService(client), intentsConfigPath);
    const result = await service.detect('something odd');
    assert.equal(result.intent, 'Unknown');
  });

  it('normalizes low-confidence results to Unknown', async () => {
    const client = createMockClient(
      JSON.stringify({
        intent: 'Support',
        confidence: 0.2,
        entities: {},
      }),
    );
    const service = new IntentService(new LlmService(client), intentsConfigPath);
    const result = await service.detect('uhhh maybe');
    assert.equal(result.intent, 'Unknown');
  });

  it('loads intents from config', async () => {
    const client = createMockClient('{}');
    const service = new IntentService(new LlmService(client), intentsConfigPath);
    const intents = await service.getIntents();
    assert.ok(intents.includes('Appointment'));
    assert.ok(intents.includes('Unknown'));
  });
});
