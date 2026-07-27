import { NotFoundError } from '../lib/errors.js';
import type { CallRepository } from '../db/repositories/call.repository.js';
import type { CallSummaryRepository } from '../db/repositories/call-summary.repository.js';
import type { MessageRepository } from '../db/repositories/message.repository.js';
import type { ToolInvocationRepository } from '../db/repositories/tool-invocation.repository.js';
import type { Json } from '../types/common.js';
import type { Database } from '../types/database.js';

type CallRow = Database['public']['Tables']['calls']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type ToolInvocationRow = Database['public']['Tables']['tool_invocations']['Row'];
type CallSummaryRow = Database['public']['Tables']['call_summary']['Row'];

export interface Conversation {
  call: CallRow;
  messages: MessageRow[];
  toolCalls: ToolInvocationRow[];
  summary: CallSummaryRow | null;
}

/**
 * Generic conversation persistence over Supabase.
 * No domain/healthcare logic — callers supply roles, intent, and summary text.
 */
export class ConversationService {
  constructor(
    private readonly calls: CallRepository,
    private readonly messages: MessageRepository,
    private readonly toolInvocations: ToolInvocationRepository,
    private readonly summaries: CallSummaryRepository,
  ) {}

  async saveCall(input: {
    vapiCallId: string;
    agentId?: string | null;
    status?: string;
    direction?: string | null;
    phoneNumber?: string | null;
    customerNumber?: string | null;
    raw?: Json;
  }): Promise<CallRow> {
    return this.calls.ensureCall(input);
  }

  async saveMessage(input: {
    callId: string;
    role: string;
    content: string;
    intent?: string | null;
    occurredAt?: string;
    metadata?: Json;
  }): Promise<MessageRow> {
    return this.messages.create(input);
  }

  async saveToolCall(input: {
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
    return this.toolInvocations.create(input);
  }

  async saveSummary(input: {
    callId: string;
    summary: string;
    intent?: string | null;
    metadata?: Json;
  }): Promise<CallSummaryRow> {
    return this.summaries.upsertByCallId(input);
  }

  async fetchConversation(callId: string): Promise<Conversation> {
    const call = await this.calls.findById(callId);
    if (!call) {
      throw new NotFoundError('Call not found', { callId });
    }

    const [messages, toolCalls, summary] = await Promise.all([
      this.messages.listByCallId(callId),
      this.toolInvocations.listByCallId(callId),
      this.summaries.findByCallId(callId),
    ]);

    return { call, messages, toolCalls, summary };
  }
}
