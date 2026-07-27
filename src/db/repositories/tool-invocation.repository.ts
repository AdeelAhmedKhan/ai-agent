import { AppError } from '../../lib/errors.js';
import type { Json } from '../../types/common.js';
import type { Database } from '../../types/database.js';
import type { DbClient } from '../client.js';

type ToolInvocationRow = Database['public']['Tables']['tool_invocations']['Row'];

export class ToolInvocationRepository {
  constructor(private readonly db: DbClient) {}

  async create(params: {
    callId?: string | null;
    vapiCallId?: string | null;
    toolName: string;
    toolCallId?: string | null;
    args: Json;
    result?: Json | null;
    status: string;
    latencyMs?: number | null;
    errorMessage?: string | null;
  }): Promise<ToolInvocationRow> {
    const { data, error } = await this.db
      .from('tool_invocations')
      .insert({
        call_id: params.callId ?? null,
        vapi_call_id: params.vapiCallId ?? null,
        tool_name: params.toolName,
        tool_call_id: params.toolCallId ?? null,
        args: params.args,
        result: params.result ?? null,
        status: params.status,
        latency_ms: params.latencyMs ?? null,
        error_message: params.errorMessage ?? null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('Failed to record tool invocation', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async listByCallId(callId: string): Promise<ToolInvocationRow[]> {
    const { data, error } = await this.db
      .from('tool_invocations')
      .select('*')
      .eq('call_id', callId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError('Failed to list tool invocations', { cause: error, code: 'DB_ERROR' });
    }
    return data ?? [];
  }
}
