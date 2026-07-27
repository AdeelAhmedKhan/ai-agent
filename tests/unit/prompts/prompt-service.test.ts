import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { PromptManager } from '../../../src/prompts/prompt.manager.js';
import { PromptService } from '../../../src/services/prompt.service.js';
import type { Agent } from '../../../src/types/agent.js';

function sampleAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Front Desk',
    slug: 'front-desk',
    system_prompt_key: 'system/patient-registration',
    model: null,
    voice_config: {},
    metadata: {},
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('PromptService', () => {
  const promptsDir = path.resolve(process.cwd(), 'prompts');
  const service = new PromptService(new PromptManager(promptsDir), promptsDir);

  it('loads catalog with all prompt kinds', async () => {
    const catalog = await service.getCatalog();
    assert.equal(catalog.system, 'system/patient-registration');
    assert.equal(catalog.greeting, 'greeting/default');
    assert.equal(catalog.fallback, 'fallback/default');
    assert.equal(catalog.transfer, 'transfer/default');
    assert.equal(catalog.summary, 'summary/default');
  });

  it('composeKind loads greeting/fallback/transfer/summary templates', async () => {
    const greeting = await service.composeKind('greeting', { agent_name: 'Ada' });
    const fallback = await service.composeKind('fallback');
    const transfer = await service.composeKind('transfer');
    const summary = await service.composeKind('summary', { agent_name: 'Ada' });

    assert.match(greeting, /Ada/);
    assert.match(fallback, /rephrase/i);
    assert.match(transfer, /team member/i);
    assert.match(summary, /Ada/);
  });

  it('build helpers interpolate agent fields', async () => {
    const agent = sampleAgent();
    const greeting = await service.buildGreeting(agent);
    assert.match(greeting, /Front Desk/);
  });
});
