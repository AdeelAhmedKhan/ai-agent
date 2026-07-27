import { NotFoundError } from '../lib/errors.js';
import type { ToolDefinition } from '../types/tools.js';
import type { IToolHandler } from './tool.interface.js';

export class ToolRegistry {
  private readonly handlers = new Map<string, IToolHandler>();

  register(handler: IToolHandler): void {
    this.handlers.set(handler.definition.name, handler);
  }

  registerMany(handlers: IToolHandler[]): void {
    for (const handler of handlers) {
      this.register(handler);
    }
  }

  unregister(name: string): boolean {
    return this.handlers.delete(name);
  }

  clear(): void {
    this.handlers.clear();
  }

  get(name: string): IToolHandler | undefined {
    return this.handlers.get(name);
  }

  require(name: string): IToolHandler {
    const handler = this.get(name);
    if (!handler) {
      throw new NotFoundError(`Tool not registered: ${name}`);
    }
    return handler;
  }

  listNames(): string[] {
    return [...this.handlers.keys()];
  }

  listDefinitions(names?: string[]): ToolDefinition[] {
    const handlers = names
      ? names.map((name) => this.get(name)).filter((h): h is IToolHandler => Boolean(h))
      : [...this.handlers.values()];
    return handlers.map((handler) => handler.definition);
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }
}
