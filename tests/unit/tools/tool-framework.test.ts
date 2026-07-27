import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { businessTools } from '../../../src/tools/business/index.js';
import { formatToolError, formatToolSuccess, toVapiResults } from '../../../src/tools/tool.formatter.js';
import type { IToolHandler } from '../../../src/tools/tool.interface.js';
import { ToolExecutor } from '../../../src/tools/tool.executor.js';
import { ToolRegistry } from '../../../src/tools/tool.registry.js';
import { validateToolArgs } from '../../../src/tools/tool.validator.js';
import { registerAllTools } from '../../../src/tools/register-tools.js';

describe('Tool framework', () => {
  it('validates args with Zod inputSchema', () => {
    const handler: IToolHandler = {
      definition: {
        name: 'sample',
        description: 'sample',
        parameters: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] },
      },
      inputSchema: z.object({ q: z.string().min(1) }),
      async execute() {
        return { ok: true };
      },
    };

    const bad = validateToolArgs(handler, {});
    assert.equal(bad.ok, false);

    const good = validateToolArgs(handler, { q: 'hello' });
    assert.equal(good.ok, true);
    if (good.ok) {
      assert.equal(good.value.q, 'hello');
    }
  });

  it('formats success and error payloads', () => {
    assert.equal(formatToolSuccess('plain'), 'plain');
    assert.equal(formatToolSuccess({ a: 1 }), '{"a":1}');
    assert.match(formatToolError('boom', { code: 1 }), /boom/);
  });

  it('supports register, unregister, and listNames', () => {
    const registry = new ToolRegistry();
    registerAllTools(registry);
    assert.ok(registry.listNames().includes('get_business_hours'));
    assert.equal(registry.unregister('echo'), true);
    assert.equal(registry.has('echo'), false);
    assert.ok(registry.listNames().length > 0);
  });

  it('executor rejects invalid args without throwing', async () => {
    const registry = new ToolRegistry();
    registerAllTools(registry);
    const executor = new ToolExecutor(registry);
    const result = await executor.executeOne(
      { id: 'c1', name: 'lookup_knowledge', arguments: {} },
      {},
    );
    assert.ok(result.error);
    assert.match(String(result.result), /Invalid arguments/);
  });

  it('toVapiResults maps outcomes', () => {
    const results = toVapiResults([
      { toolCallId: '1', result: '{"ok":true}' },
      { toolCallId: '2', result: '', error: 'fail' },
    ]);
    assert.equal(results[0]?.toolCallId, '1');
    assert.match(results[1]?.result ?? '', /fail/);
  });

  it('all placeholder business tools return mocked: true', async () => {
    for (const tool of businessTools) {
      const args =
        tool.definition.name === 'lookup_knowledge'
          ? { query: 'hours' }
          : tool.definition.name === 'create_ticket'
            ? { subject: 'Help' }
            : tool.definition.name === 'schedule_appointment'
              ? { startsAt: '2026-08-01T10:00:00Z' }
              : tool.definition.name === 'cancel_appointment'
                ? { appointmentId: 'apt_1' }
                : tool.definition.name === 'save_lead'
                  ? { email: 'a@example.com' }
                  : {};

      const raw = await tool.execute(args, {});
      assert.equal(typeof raw, 'object');
      assert.equal((raw as { mocked?: boolean }).mocked, true);
    }
  });
});
