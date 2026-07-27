export type PromptVariables = Record<string, string | number | boolean | undefined | null>;

export type PromptKind = 'system' | 'greeting' | 'fallback' | 'transfer' | 'summary';

export type PromptCatalog = Record<PromptKind, string>;

export interface ComposedPrompt {
  key: string;
  content: string;
}
