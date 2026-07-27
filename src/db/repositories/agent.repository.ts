import { AppError, NotFoundError } from '../../lib/errors.js';
import type { Agent, AgentTool, CreateAgentInput, UpdateAgentInput } from '../../types/agent.js';
import type { Json } from '../../types/common.js';
import type { Database } from '../../types/database.js';
import type { DbClient } from '../client.js';

type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export class AgentRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string): Promise<Agent | null> {
    const { data, error } = await this.db.from('agents').select('*').eq('id', id).maybeSingle();
    if (error) {
      throw new AppError('Failed to fetch agent', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async findBySlug(slug: string): Promise<Agent | null> {
    const { data, error } = await this.db.from('agents').select('*').eq('slug', slug).maybeSingle();
    if (error) {
      throw new AppError('Failed to fetch agent by slug', { cause: error, code: 'DB_ERROR' });
    }
    return data;
  }

  async list(includeInactive = false): Promise<Agent[]> {
    let query = this.db.from('agents').select('*').order('created_at', { ascending: false });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) {
      throw new AppError('Failed to list agents', { cause: error, code: 'DB_ERROR' });
    }
    return data ?? [];
  }

  async create(input: CreateAgentInput): Promise<Agent> {
    const { data, error } = await this.db
      .from('agents')
      .insert({
        slug: input.slug,
        name: input.name,
        system_prompt_key: input.system_prompt_key ?? 'system/default',
        model: input.model ?? null,
        voice_config: (input.voice_config ?? {}) as Json,
        metadata: (input.metadata ?? {}) as Json,
        is_active: input.is_active ?? true,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('Failed to create agent', { cause: error, code: 'DB_ERROR' });
    }

    if (input.tools?.length) {
      await this.replaceTools(data.id, input.tools);
    }

    return data;
  }

  async update(id: string, input: UpdateAgentInput): Promise<Agent> {
    const patch: AgentUpdate = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.system_prompt_key !== undefined) patch.system_prompt_key = input.system_prompt_key;
    if (input.model !== undefined) patch.model = input.model;
    if (input.voice_config !== undefined) patch.voice_config = input.voice_config as Json;
    if (input.metadata !== undefined) patch.metadata = input.metadata as Json;
    if (input.is_active !== undefined) patch.is_active = input.is_active;

    if (Object.keys(patch).length > 0) {
      const { data, error } = await this.db
        .from('agents')
        .update(patch)
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (error) {
        throw new AppError('Failed to update agent', { cause: error, code: 'DB_ERROR' });
      }
      if (!data) {
        throw new NotFoundError(`Agent ${id} not found`);
      }

      if (input.tools) {
        await this.replaceTools(id, input.tools);
      }
      return data;
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Agent ${id} not found`);
    }
    if (input.tools) {
      await this.replaceTools(id, input.tools);
    }
    return existing;
  }

  async listTools(agentId: string): Promise<AgentTool[]> {
    const { data, error } = await this.db
      .from('agent_tools')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_enabled', true);

    if (error) {
      throw new AppError('Failed to list agent tools', { cause: error, code: 'DB_ERROR' });
    }
    return data ?? [];
  }

  async replaceTools(agentId: string, toolNames: string[]): Promise<void> {
    const { error: deleteError } = await this.db
      .from('agent_tools')
      .delete()
      .eq('agent_id', agentId);

    if (deleteError) {
      throw new AppError('Failed to clear agent tools', { cause: deleteError, code: 'DB_ERROR' });
    }

    if (toolNames.length === 0) {
      return;
    }

    const rows = toolNames.map((tool_name) => ({
      agent_id: agentId,
      tool_name,
      config: {} as Json,
      is_enabled: true,
    }));

    const { error: insertError } = await this.db.from('agent_tools').insert(rows);
    if (insertError) {
      throw new AppError('Failed to insert agent tools', { cause: insertError, code: 'DB_ERROR' });
    }
  }
}
