import type { Json } from './common.js';

export interface Agent {
  id: string;
  slug: string;
  name: string;
  system_prompt_key: string;
  model: string | null;
  voice_config: Json;
  metadata: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentTool {
  id: string;
  agent_id: string;
  tool_name: string;
  config: Json;
  is_enabled: boolean;
  created_at: string;
}

export interface CreateAgentInput {
  slug: string;
  name: string;
  system_prompt_key?: string;
  model?: string | null;
  voice_config?: Json;
  metadata?: Json;
  is_active?: boolean;
  tools?: string[];
}

export interface UpdateAgentInput {
  name?: string;
  system_prompt_key?: string;
  model?: string | null;
  voice_config?: Json;
  metadata?: Json;
  is_active?: boolean;
  tools?: string[];
}
