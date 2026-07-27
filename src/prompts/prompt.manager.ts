import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NotFoundError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { PromptRegistry } from './prompt.registry.js';
import type { ComposedPrompt, PromptVariables } from './types.js';

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export class PromptManager {
  private readonly cache = new Map<string, string>();

  constructor(
    private readonly promptsDir: string,
    private readonly registry: PromptRegistry = new PromptRegistry(),
  ) {}

  getRegistry(): PromptRegistry {
    return this.registry;
  }

  async load(key: string): Promise<string> {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const registered = this.registry.get(key);
    if (registered) {
      this.cache.set(key, registered.content);
      return registered.content;
    }

    const relativePath = key.endsWith('.md') ? key : `${key}.md`;
    const absolutePath = path.resolve(this.promptsDir, relativePath);

    try {
      const content = await readFile(absolutePath, 'utf8');
      this.cache.set(key, content);
      return content;
    } catch (error) {
      logger.error({ err: error, key, absolutePath }, 'Prompt template not found');
      throw new NotFoundError(`Prompt template not found: ${key}`);
    }
  }

  interpolate(template: string, variables: PromptVariables = {}): string {
    return template.replace(VARIABLE_PATTERN, (_match, name: string) => {
      const value = variables[name];
      if (value === undefined || value === null) {
        return '';
      }
      return String(value);
    });
  }

  async compose(key: string, variables: PromptVariables = {}): Promise<ComposedPrompt> {
    const template = await this.load(key);
    return {
      key,
      content: this.interpolate(template, {
        date: new Date().toISOString().slice(0, 10),
        ...variables,
      }),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}
