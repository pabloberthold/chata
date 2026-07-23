export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  pricing: { prompt: number; completion: number };
  capabilities: string[];
  available: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  finishReason?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface LLMProvider {
  id: string;
  name: string;
  listModels(): Promise<LLMModel[]>;
  chat(request: ChatRequest): AsyncIterable<StreamChunk>;
  validateKey(): Promise<boolean>;
  abort(): void;
}
