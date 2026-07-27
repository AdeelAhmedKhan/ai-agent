export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface ILlmClient {
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}
