import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NotFoundError } from '../lib/errors.js';
import type { PromptManager } from '../prompts/prompt.manager.js';
import type { PromptCatalog, PromptKind, PromptVariables } from '../prompts/types.js';
import type { Agent } from '../types/agent.js';

const PROMPT_KINDS: PromptKind[] = ['system', 'greeting', 'fallback', 'transfer', 'summary'];

export class PromptService {
  private catalogPromise: Promise<PromptCatalog> | null = null;

  constructor(
    private readonly promptManager: PromptManager,
    private readonly promptsDir: string,
  ) {}

  async getCatalog(): Promise<PromptCatalog> {
    if (!this.catalogPromise) {
      this.catalogPromise = this.loadCatalog();
    }
    return this.catalogPromise;
  }

  async composeKind(kind: PromptKind, variables: PromptVariables = {}): Promise<string> {
    const catalog = await this.getCatalog();
    const key = catalog[kind];
    if (!key) {
      throw new NotFoundError(`Prompt catalog missing kind: ${kind}`);
    }
    const composed = await this.promptManager.compose(key, variables);
    return composed.content;
  }

  async buildSystemPrompt(agent: Agent): Promise<string> {
    const catalog = await this.getCatalog();
    const key = agent.system_prompt_key?.trim() || catalog.system;
    const composed = await this.promptManager.compose(key, {
      agent_name: agent.name,
      agent_slug: agent.slug,
    });
    return composed.content;
  }

  async buildGreeting(agent: Agent, variables: PromptVariables = {}): Promise<string> {
    return this.composeKind('greeting', this.agentVariables(agent, variables));
  }

  async buildFallback(agent: Agent, variables: PromptVariables = {}): Promise<string> {
    return this.composeKind('fallback', this.agentVariables(agent, variables));
  }

  async buildTransfer(agent: Agent, variables: PromptVariables = {}): Promise<string> {
    return this.composeKind('transfer', this.agentVariables(agent, variables));
  }

  async buildSummary(agent: Agent, variables: PromptVariables = {}): Promise<string> {
    return this.composeKind('summary', this.agentVariables(agent, variables));
  }

  private agentVariables(agent: Agent, variables: PromptVariables): PromptVariables {
    return {
      agent_name: agent.name,
      agent_slug: agent.slug,
      ...variables,
    };
  }

  private async loadCatalog(): Promise<PromptCatalog> {
    const absolutePath = path.resolve(this.promptsDir, 'catalog.json');
    let raw: string;
    try {
      raw = await readFile(absolutePath, 'utf8');
    } catch {
      throw new NotFoundError(`Prompt catalog not found: ${absolutePath}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new NotFoundError(`Prompt catalog is invalid JSON: ${absolutePath}`, { cause: error });
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new NotFoundError(`Prompt catalog must be an object: ${absolutePath}`);
    }

    const record = parsed as Record<string, unknown>;
    const catalog = {} as PromptCatalog;
    for (const kind of PROMPT_KINDS) {
      const value = record[kind];
      if (typeof value !== 'string' || !value.trim()) {
        throw new NotFoundError(`Prompt catalog missing string key for kind: ${kind}`);
      }
      catalog[kind] = value.trim();
    }
    return catalog;
  }
}
