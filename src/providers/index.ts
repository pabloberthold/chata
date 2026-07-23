import type { LLMProvider } from "./types";
import { OpenRouterProvider } from "./OpenRouterProvider";

let currentProvider: LLMProvider | null = null;

export function getProvider(): LLMProvider {
  if (!currentProvider) {
    currentProvider = new OpenRouterProvider();
  }
  return currentProvider;
}

export function resetProvider(): void {
  currentProvider?.abort();
  currentProvider = null;
}

export { OpenRouterProvider };
export type { LLMProvider, LLMModel, ChatRequest, StreamChunk, ChatMessage } from "./types";
