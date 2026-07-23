export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  capabilities: string[];
  available: boolean;
}

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  config: ProviderConfig;
  listModels(): Promise<LLMModel[]>;
  chat(request: ChatCompletionRequest): Promise<AsyncIterable<StreamChunk>>;
  validateKey(): Promise<boolean>;
  abort(): void;
}
