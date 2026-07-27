import { AppError } from '../../lib/errors.js';
import type { Json } from '../../types/common.js';
import type { Database } from '../../types/database.js';
import type { DbClient } from '../client.js';

type MessageRow = Database['public']['Tables']['messages']['Row'];

export class MessageRepository {
  constructor(private readonly db: DbClient) {}

  async create(params: {
    callId: string;
    role: string;
    content: string;
    intent?: string | null;
    occurredAt?: string;
    metadata?: Json;
  }): Promise<MessageRow> {
    const { data, error } = await this.db
      .from('messages')
      .insert({
        call_id: params.callId,
        role: params.role,
        content: params.content,
        intent: params.intent ?? null,
        occurred_at: params.occurredAt,
        metadata: params.metadata ?? {},
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('Failed to save message', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async listByCallId(callId: string): Promise<MessageRow[]> {
    const { data, error } = await this.db
      .from('messages')
      .select('*')
      .eq('call_id', callId)
      .order('occurred_at', { ascending: true });

    if (error) {
      throw new AppError('Failed to list messages', { cause: error, code: 'DB_ERROR' });
    }
    return data ?? [];
  }
}
