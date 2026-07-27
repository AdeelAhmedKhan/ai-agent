import type { ChatMessage } from './llm.interface.js';

export interface GenerateResponseInput {
  /** Optional system instructions (domain-agnostic) */
  systemPrompt?: string;
  /** Latest user utterance or instruction */
  prompt: string;
  /** Prior turns, if any */
  history?: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface GenerateSummaryInput {
  /** Free-form text to summarize (transcript, notes, logs, etc.) */
  text: string;
  /** Optional focus hint, e.g. "key decisions" — keep generic */
  focus?: string;
  maxTokens?: number;
  model?: string;
}

export interface DetectIntentInput {
  /** User utterance to classify */
  text: string;
  /**
   * Optional allowed intent labels.
   * If omitted, the model proposes a short snake_case intent name.
   */
  candidateIntents?: string[];
  model?: string;
}

export interface DetectIntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  raw: string;
}
