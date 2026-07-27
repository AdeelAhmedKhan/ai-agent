import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { AppError, NotFoundError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import type { LlmService } from './llm.service.js';

const DEFAULT_UNKNOWN = 'Unknown';
const LOW_CONFIDENCE_THRESHOLD = 0.4;

export interface DetectIntentPublicResult {
  intent: string;
  confidence: number;
  extractedEntities: Record<string, string>;
}

export interface IntentCatalog {
  intents: string[];
}

export class IntentService {
  private catalogPromise: Promise<IntentCatalog> | null = null;

  constructor(
    private readonly llm: LlmService,
    private readonly intentsConfigPath: string,
  ) {}

  async getIntents(): Promise<string[]> {
    const catalog = await this.getCatalog();
    return [...catalog.intents];
  }

  async detect(text: string, model?: string): Promise<DetectIntentPublicResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        intent: DEFAULT_UNKNOWN,
        confidence: 0,
        extractedEntities: {},
      };
    }

    const candidateIntents = await this.getIntents();
    const result = await this.llm.detectIntent({
      text: trimmed,
      candidateIntents,
      model,
    });

    const intent = this.normalizeIntent(result.intent, result.confidence, candidateIntents);

    return {
      intent,
      confidence: result.confidence,
      extractedEntities: result.entities,
    };
  }

  private normalizeIntent(
    rawIntent: string,
    confidence: number,
    candidates: string[],
  ): string {
    const unknownLabel =
      candidates.find((label) => label.toLowerCase() === DEFAULT_UNKNOWN.toLowerCase()) ??
      DEFAULT_UNKNOWN;

    if (confidence < LOW_CONFIDENCE_THRESHOLD) {
      return unknownLabel;
    }

    const match = candidates.find(
      (label) => label.toLowerCase() === rawIntent.trim().toLowerCase(),
    );
    if (!match) {
      logger.debug({ rawIntent, candidates }, 'Intent not in catalog; using Unknown');
      return unknownLabel;
    }

    return match;
  }

  private async getCatalog(): Promise<IntentCatalog> {
    if (!this.catalogPromise) {
      this.catalogPromise = this.loadCatalog();
    }
    return this.catalogPromise;
  }

  private async loadCatalog(): Promise<IntentCatalog> {
    const absolutePath = path.resolve(this.intentsConfigPath);
    let raw: string;
    try {
      raw = await readFile(absolutePath, 'utf8');
    } catch {
      throw new NotFoundError(`Intent config not found: ${absolutePath}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new AppError('Intent config is invalid JSON', {
        statusCode: 500,
        code: 'INTENT_CONFIG_INVALID',
        details: { path: absolutePath },
        cause: error,
      });
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new AppError('Intent config must be an object with an intents array', {
        statusCode: 500,
        code: 'INTENT_CONFIG_INVALID',
        details: { path: absolutePath },
      });
    }

    const intentsRaw = (parsed as { intents?: unknown }).intents;
    if (!Array.isArray(intentsRaw) || intentsRaw.length === 0) {
      throw new AppError('Intent config must include a non-empty intents array', {
        statusCode: 500,
        code: 'INTENT_CONFIG_INVALID',
        details: { path: absolutePath },
      });
    }

    const intents = intentsRaw
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());

    if (intents.length === 0) {
      throw new AppError('Intent config intents array has no valid labels', {
        statusCode: 500,
        code: 'INTENT_CONFIG_INVALID',
        details: { path: absolutePath },
      });
    }

    return { intents };
  }
}
