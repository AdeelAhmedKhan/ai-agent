import type { Env } from '../config/index.js';
import type { ILlmClient } from './llm.interface.js';
import { OpenAICompatibleClient } from './openai-compatible.client.js';
import { DASHSCOPE_DEFAULT_BASE_URL, DASHSCOPE_DEFAULT_MODEL } from './providers/dashscope.js';
import { GROQ_DEFAULT_BASE_URL, GROQ_DEFAULT_MODEL } from './providers/groq.js';

export function createLlmClient(env: Env): ILlmClient {
  const providerDefaults =
    env.LLM_PROVIDER === 'dashscope'
      ? { baseURL: DASHSCOPE_DEFAULT_BASE_URL, model: DASHSCOPE_DEFAULT_MODEL }
      : { baseURL: GROQ_DEFAULT_BASE_URL, model: GROQ_DEFAULT_MODEL };

  return new OpenAICompatibleClient({
    apiKey: env.LLM_API_KEY,
    baseURL: env.LLM_BASE_URL ?? providerDefaults.baseURL,
    defaultModel: env.LLM_MODEL || providerDefaults.model,
  });
}
