import { env } from '../config/index.js';
import type { AgentRepository } from '../db/repositories/agent.repository.js';
import { NotFoundError } from '../lib/errors.js';
import type { PromptService } from './prompt.service.js';
import type { ToolRegistry } from '../tools/tool.registry.js';
import type { Agent, CreateAgentInput, UpdateAgentInput } from '../types/agent.js';
import type { VapiCall } from '../types/vapi.js';

export class AgentService {
  constructor(
    private readonly agents: AgentRepository,
    private readonly prompts: PromptService,
    private readonly tools: ToolRegistry,
  ) {}

  list(includeInactive = false): Promise<Agent[]> {
    return this.agents.list(includeInactive);
  }

  async getById(id: string): Promise<Agent> {
    const agent = await this.agents.findById(id);
    if (!agent) {
      throw new NotFoundError(`Agent ${id} not found`);
    }
    return agent;
  }

  async getBySlug(slug: string): Promise<Agent> {
    const agent = await this.agents.findBySlug(slug);
    if (!agent) {
      throw new NotFoundError(`Agent slug "${slug}" not found`);
    }
    return agent;
  }

  create(input: CreateAgentInput): Promise<Agent> {
    return this.agents.create(input);
  }

  update(id: string, input: UpdateAgentInput): Promise<Agent> {
    return this.agents.update(id, input);
  }

  /**
   * Resolve an agent for an inbound Vapi call without industry-specific logic.
   * Resolution order: call.metadata.agentSlug → DEFAULT_AGENT_SLUG.
   */
  async resolveForCall(call?: VapiCall): Promise<Agent> {
    const metadataSlug =
      typeof call?.metadata?.agentSlug === 'string' ? call.metadata.agentSlug : undefined;
    const slug = metadataSlug || env.DEFAULT_AGENT_SLUG;
    const agent = await this.agents.findBySlug(slug);
    if (!agent || !agent.is_active) {
      throw new NotFoundError(`No active agent for slug "${slug}"`);
    }
    return agent;
  }

  async buildAssistantPayload(agent: Agent): Promise<Record<string, unknown>> {
    const systemPrompt = await this.prompts.buildSystemPrompt(agent);
    const agentTools = await this.agents.listTools(agent.id);
    const toolNames = agentTools.map((tool) => tool.tool_name);
    const definitions = this.tools.listDefinitions(toolNames);

    const model = agent.model || env.LLM_MODEL;
    const voiceConfig =
      agent.voice_config && typeof agent.voice_config === 'object' && !Array.isArray(agent.voice_config)
        ? (agent.voice_config as Record<string, unknown>)
        : {};

    return {
      name: agent.name,
      model: {
        provider: 'custom-llm',
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
        tools: definitions.map((definition) => ({
          type: 'function',
          function: {
            name: definition.name,
            description: definition.description,
            parameters: definition.parameters,
          },
        })),
      },
      ...(Object.keys(voiceConfig).length > 0 ? { voice: voiceConfig } : {}),
      metadata: {
        agentId: agent.id,
        agentSlug: agent.slug,
      },
    };
  }
}
