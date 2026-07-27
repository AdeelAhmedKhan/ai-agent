import type { Json } from './common.js';

export type VapiMessageType =
  | 'assistant-request'
  | 'tool-calls'
  | 'status-update'
  | 'transcript'
  | 'hang'
  | 'end-of-call-report'
  | 'speech-update'
  | 'conversation-update'
  | 'transfer-destination-request'
  | 'knowledge-base-request'
  | string;

export interface VapiCall {
  id: string;
  orgId?: string;
  type?: string;
  status?: string;
  phoneNumber?: {
    number?: string;
    id?: string;
  };
  customer?: {
    number?: string;
    name?: string;
  };
  assistantId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VapiToolCallFunction {
  name: string;
  arguments: string | Record<string, unknown>;
}

export interface VapiToolCall {
  id: string;
  type?: string;
  function: VapiToolCallFunction;
}

export interface VapiMessage {
  type: VapiMessageType;
  call?: VapiCall;
  toolCallList?: VapiToolCall[];
  toolCalls?: VapiToolCall[];
  toolWithToolCallList?: unknown[];
  transcript?: string;
  status?: string;
  endedReason?: string;
  artifact?: Json;
  [key: string]: unknown;
}

export interface VapiWebhookBody {
  message: VapiMessage;
}

export interface VapiToolCallResult {
  toolCallId: string;
  result: string;
}

export interface VapiAssistantResponse {
  assistant: Record<string, unknown>;
}

export interface VapiToolCallsResponse {
  results: VapiToolCallResult[];
}
