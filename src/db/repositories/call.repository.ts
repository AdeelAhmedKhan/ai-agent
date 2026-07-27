import { AppError } from '../../lib/errors.js';
import type { Json } from '../../types/common.js';
import type { Database } from '../../types/database.js';
import type { DbClient } from '../client.js';

type CallRow = Database['public']['Tables']['calls']['Row'];
type CallInsert = Database['public']['Tables']['calls']['Insert'];
type CallUpdate = Database['public']['Tables']['calls']['Update'];

export class CallRepository {
  constructor(private readonly db: DbClient) {}

  async findById(callId: string): Promise<CallRow | null> {
    const { data, error } = await this.db
      .from('calls')
      .select('*')
      .eq('id', callId)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch call', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async findByVapiCallId(vapiCallId: string): Promise<CallRow | null> {
    const { data, error } = await this.db
      .from('calls')
      .select('*')
      .eq('vapi_call_id', vapiCallId)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch call', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async upsertByVapiCallId(input: CallInsert): Promise<CallRow> {
    const { data, error } = await this.db
      .from('calls')
      .upsert(input, { onConflict: 'vapi_call_id' })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('Failed to upsert call', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async updateByVapiCallId(vapiCallId: string, patch: CallUpdate): Promise<CallRow | null> {
    const { data, error } = await this.db
      .from('calls')
      .update(patch)
      .eq('vapi_call_id', vapiCallId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to update call', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async ensureCall(params: {
    vapiCallId: string;
    agentId?: string | null;
    status?: string;
    direction?: string | null;
    phoneNumber?: string | null;
    customerNumber?: string | null;
    raw?: Json;
  }): Promise<CallRow> {
    const existing = await this.findByVapiCallId(params.vapiCallId);
    if (existing) {
      return existing;
    }
    return this.upsertByVapiCallId({
      vapi_call_id: params.vapiCallId,
      agent_id: params.agentId ?? null,
      status: params.status ?? 'queued',
      direction: params.direction ?? null,
      phone_number: params.phoneNumber ?? null,
      customer_number: params.customerNumber ?? null,
      raw: params.raw ?? {},
      started_at: new Date().toISOString(),
    });
  }
}
