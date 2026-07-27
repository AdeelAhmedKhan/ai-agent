import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { PromptManager } from '../../../src/prompts/prompt.manager.js';

describe('PromptManager', () => {
  const promptsDir = path.resolve(process.cwd(), 'prompts');
  const manager = new PromptManager(promptsDir);

  it('loads and interpolates the patient registration system prompt', async () => {
    const composed = await manager.compose('system/patient-registration', {
      agent_name: 'Test Agent',
    });
    assert.match(composed.content, /Test Agent/);
    assert.match(composed.content, /patient intake coordinator/i);
  });

  it('replaces missing variables with empty string', () => {
    assert.equal(manager.interpolate('Hello {{name}}', {}), 'Hello ');
  });

  it('loads greeting fallback transfer and summary templates', async () => {
    for (const key of [
      'greeting/default',
      'fallback/default',
      'transfer/default',
      'summary/default',
    ] as const) {
      const composed = await manager.compose(key, { agent_name: 'Test' });
      assert.ok(composed.content.length > 0);
    }
  });
});
