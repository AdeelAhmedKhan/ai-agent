import type { ILlmClient } from '../llm/llm.interface.js';
import type {
  DetectIntentInput,
  DetectIntentResult,
  GenerateResponseInput,
  GenerateSummaryInput,
} from '../llm/llm.types.js';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/**
 * Generic LLM application service.
 * Provider-agnostic (Groq, Dashscope/Qwen, or any OpenAI-compatible backend).
 * No industry-specific (healthcare, appointments, etc.) knowledge.
 */
export class LlmService {
  constructor(private readonly client: ILlmClient) {}

  async generateResponse(input: GenerateResponseInput): Promise<string> {
    const messages = [
      ...(input.systemPrompt
        ? [{ role: 'system' as const, content: input.systemPrompt }]
        : [
            {
              role: 'system' as const,
              content:
                'You are a helpful assistant. Reply clearly and concisely. Do not invent domain-specific policies.',
            },
          ]),
      ...(input.history ?? []),
      { role: 'user' as const, content: input.prompt },
    ];

    const result = await this.client.complete({
      model: input.model,
      messages,
      temperature: input.temperature ?? 0.7,
      maxTokens: input.maxTokens,
    });

    return result.content.trim();
  }

  async generateSummary(input: GenerateSummaryInput): Promise<string> {
    const focusLine = input.focus
      ? `Focus on: ${input.focus}`
      : 'Focus on the main points and outcomes.';

    const result = await this.client.complete({
      model: input.model,
      temperature: 0.3,
      maxTokens: input.maxTokens ?? 512,
      messages: [
        {
          role: 'system',
          content:
            'You summarize text accurately and neutrally. Keep summaries concise. Do not add facts that are not present in the source.',
        },
        {
          role: 'user',
          content: `${focusLine}\n\nText to summarize:\n\n${input.text}`,
        },
      ],
    });

    return result.content.trim();
  }

  async detectIntent(input: DetectIntentInput): Promise<DetectIntentResult> {
    const candidates =
      input.candidateIntents && input.candidateIntents.length > 0
        ? `Choose intent from this list only: ${input.candidateIntents.join(', ')}.`
        : 'Propose a short snake_case intent label that best fits the text.';

    const result = await this.client.complete({
      model: input.model,
      temperature: 0,
      maxTokens: 256,
      messages: [
        {
          role: 'system',
          content: [
            'You classify user intent for a generic conversational agent.',
            'Respond with JSON only, no markdown, matching this shape:',
            '{"intent":"string","confidence":0.0,"extractedEntities":{"key":"value"}}',
            'confidence is between 0 and 1. extractedEntities may be empty.',
            'You may also use "entities" as an alias for extractedEntities.',
            'Do not assume any industry (healthcare, finance, etc.).',
            candidates,
          ].join(' '),

        },
        {
          role: 'user',
          content: input.text,
        },
      ],
    });

    return this.parseIntentResult(result.content);
  }

  private parseIntentResult(raw: string): DetectIntentResult {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');

    try {
      const parsed: unknown = JSON.parse(cleaned);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Intent payload is not an object');
      }

      const record = parsed as Record<string, unknown>;
      const intent = typeof record.intent === 'string' ? record.intent : 'unknown';
      const confidenceRaw = record.confidence;
      const confidence =
        typeof confidenceRaw === 'number'
          ? Math.min(1, Math.max(0, confidenceRaw))
          : 0;

      const entitiesSource =
        record.extractedEntities &&
        typeof record.extractedEntities === 'object' &&
        !Array.isArray(record.extractedEntities)
          ? (record.extractedEntities as Record<string, unknown>)
          : record.entities && typeof record.entities === 'object' && !Array.isArray(record.entities)
            ? (record.entities as Record<string, unknown>)
            : {};

      const entities: Record<string, string> = {};
      for (const [key, value] of Object.entries(entitiesSource)) {
        if (value !== undefined && value !== null) {
          entities[key] = String(value);
        }
      }

      return { intent, confidence, entities, raw: cleaned };
    } catch (error) {
      logger.warn({ err: error, raw }, 'Failed to parse intent JSON; using fallback');
      throw new AppError('Failed to parse intent detection response', {
        statusCode: 502,
        code: 'LLM_INTENT_PARSE_ERROR',
        details: { raw },
        cause: error,
      });
    }
  }
}
