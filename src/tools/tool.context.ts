import type { Agent } from '../types/agent.js';
import type { Json } from '../types/common.js';

export interface ToolContext {
  callId?: string;
  vapiCallId?: string;
  agent?: Agent | null;
  /** Normalized or raw telephony caller ID when available */
  callerPhone?: string;
  metadata?: Record<string, unknown>;
  toolConfig?: Json;
}
