import { getAll, get, put, del } from "./db";
import type { PromptTemplate } from "../types/prompt";

const STORE = "prompts";

export async function listPrompts(): Promise<PromptTemplate[]> {
  return getAll<PromptTemplate>(STORE);
}

export async function getPrompt(id: string): Promise<PromptTemplate | null> {
  return get<PromptTemplate>(STORE, id);
}

export async function savePrompt(prompt: PromptTemplate): Promise<void> {
  return put(STORE, prompt);
}

export async function deletePrompt(id: string): Promise<void> {
  return del(STORE, id);
}

export async function searchPrompts(query: string): Promise<PromptTemplate[]> {
  const all = await getAll<PromptTemplate>(STORE);
  const lower = query.toLowerCase();
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.content.toLowerCase().includes(lower) ||
      p.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

export async function getPromptsByCategory(category: string): Promise<PromptTemplate[]> {
  const all = await getAll<PromptTemplate>(STORE);
  return all.filter((p) => p.category === category);
}
