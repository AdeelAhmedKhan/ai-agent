import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EchoTool } from '../../../src/tools/builtins/echo.tool.js';
import { HealthTool } from '../../../src/tools/builtins/health.tool.js';
import { ToolExecutor } from '../../../src/tools/tool.executor.js';
import { ToolRegistry } from '../../../src/tools/tool.registry.js';

describe('ToolExecutor', () => {
  const registry = new ToolRegistry();
  registry.register(new EchoTool());
  registry.register(new HealthTool());
  const executor = new ToolExecutor(registry);

  it('executes echo tool', async () => {
    const result = await executor.executeOne(
      { id: 'call_1', name: 'echo', arguments: { message: 'hello' } },
      {},
    );
    assert.equal(result.toolCallId, 'call_1');
    assert.equal(result.result, 'hello');
    assert.equal(result.error, undefined);
  });

  it('returns error for unknown tool', async () => {
    const result = await executor.executeOne(
      { id: 'call_2', name: 'missing', arguments: {} },
      {},
    );
    assert.match(result.error ?? '', /Unknown tool/);
  });

  it('executes multiple tools in parallel', async () => {
    const results = await executor.executeMany(
      [
        { id: 'a', name: 'echo', arguments: { message: 'one' } },
        { id: 'b', name: 'health', arguments: {} },
      ],
      { vapiCallId: 'vapi_1' },
    );
    assert.equal(results.length, 2);
    assert.equal(results[0]?.result, 'one');
    assert.match(String(results[1]?.result), /ok/);
  });
});
