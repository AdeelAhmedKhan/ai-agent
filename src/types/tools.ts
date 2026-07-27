import type { Json } from './common.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResult {
  toolCallId: string;
  result: string | Json;
  error?: string;
}
