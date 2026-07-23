import { getProvider } from "../providers/index";
import type { LLMModel } from "../providers/types";

let cachedModels: LLMModel[] = [];
let lastFetch = 0;
const CACHE_TTL = 3 * 60 * 60 * 1000;

export async function fetchModels(force = false): Promise<LLMModel[]> {
  const now = Date.now();
  if (!force && cachedModels.length > 0 && now - lastFetch < CACHE_TTL) {
    return cachedModels;
  }

  try {
    const provider = getProvider();
    const models = await provider.listModels();
    cachedModels = models;
    lastFetch = now;
    return models;
  } catch (err) {
    if (cachedModels.length > 0) return cachedModels;
    throw err;
  }
}

export function getCachedModels(): LLMModel[] {
  return cachedModels;
}

export function getModelById(id: string): LLMModel | undefined {
  return cachedModels.find((m) => m.id === id);
}

export function getModelsByProvider(provider: string): LLMModel[] {
  return cachedModels.filter((m) => m.provider === provider);
}
