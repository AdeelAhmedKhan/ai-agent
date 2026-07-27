import { AppError } from '../../lib/errors.js';
import type { Json } from '../../types/common.js';
import type { Database } from '../../types/database.js';
import type { DbClient } from '../client.js';

type CallEventRow = Database['public']['Tables']['call_events']['Row'];

export class EventRepository {
  constructor(private readonly db: DbClient) {}

  async append(params: {
    callId?: string | null;
    vapiCallId?: string | null;
    eventType: string;
    payload: Json;
  }): Promise<CallEventRow> {
    const { data, error } = await this.db
      .from('call_events')
      .insert({
        call_id: params.callId ?? null,
        vapi_call_id: params.vapiCallId ?? null,
        event_type: params.eventType,
        payload: params.payload,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('Failed to append call event', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }
}
