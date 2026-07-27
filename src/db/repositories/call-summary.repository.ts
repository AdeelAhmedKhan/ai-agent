import { AppError } from '../../lib/errors.js';
import type { Json } from '../../types/common.js';
import type { Database } from '../../types/database.js';
import type { DbClient } from '../client.js';

type CallSummaryRow = Database['public']['Tables']['call_summary']['Row'];

export class CallSummaryRepository {
  constructor(private readonly db: DbClient) {}

  async upsertByCallId(params: {
    callId: string;
    summary: string;
    intent?: string | null;
    metadata?: Json;
  }): Promise<CallSummaryRow> {
    const { data, error } = await this.db
      .from('call_summary')
      .upsert(
        {
          call_id: params.callId,
          summary: params.summary,
          intent: params.intent ?? null,
          metadata: params.metadata ?? {},
        },
        { onConflict: 'call_id' },
      )
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('Failed to save call summary', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async findByCallId(callId: string): Promise<CallSummaryRow | null> {
    const { data, error } = await this.db
      .from('call_summary')
      .select('*')
      .eq('call_id', callId)
      .maybeSingle();

    if (error) {
      throw new AppError('Failed to fetch call summary', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }
}
