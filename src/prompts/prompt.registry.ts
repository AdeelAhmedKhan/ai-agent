import type { ComposedPrompt } from './types.js';

export class PromptRegistry {
  private readonly prompts = new Map<string, ComposedPrompt>();

  register(prompt: ComposedPrompt): void {
    this.prompts.set(prompt.key, prompt);
  }

  get(key: string): ComposedPrompt | undefined {
    return this.prompts.get(key);
  }

  has(key: string): boolean {
    return this.prompts.has(key);
  }

  keys(): string[] {
    return [...this.prompts.keys()];
  }
}
