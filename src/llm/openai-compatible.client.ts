import OpenAI, { type ClientOptions } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ILlmClient,
} from './llm.interface.js';

export class OpenAICompatibleClient implements ILlmClient {
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(options: { apiKey: string; baseURL: string; defaultModel: string }) {
    const clientOptions: ClientOptions = {
      apiKey: options.apiKey,
      baseURL: options.baseURL,
    };
    this.client = new OpenAI(clientOptions);
    this.defaultModel = options.defaultModel;
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = request.model ?? this.defaultModel;
    const messages: ChatCompletionMessageParam[] = request.messages.map((message) => {
      if (message.role === 'system') {
        return { role: 'system', content: message.content };
      }
      if (message.role === 'assistant') {
        return { role: 'assistant', content: message.content };
      }
      if (message.role === 'tool') {
        return {
          role: 'tool',
          content: message.content,
          tool_call_id: message.name ?? 'tool',
        };
      }
      return { role: 'user', content: message.content };
    });

    const completion = await this.client.chat.completions.create({
      model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    const choice = completion.choices[0];
    return {
      id: completion.id,
      content: choice?.message?.content ?? '',
      model: completion.model,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  }
}
