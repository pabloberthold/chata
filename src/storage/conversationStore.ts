import { getAll, get, put, del, getByIndex } from "./db";
import type { Conversation, ConversationSummary } from "../types";

const STORE = "conversations";

function toSummary(conv: Conversation): ConversationSummary {
  return {
    id: conv.id,
    title: conv.title,
    modelId: conv.modelId,
    agentId: conv.agentId,
    messageCount: conv.messages.length,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    estimatedTokens: conv.estimatedTokens,
    pinned: conv.pinned,
  };
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const all = await getAll<Conversation>(STORE);
  return all.sort((a, b) => b.updatedAt - a.updatedAt).map(toSummary);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  return get<Conversation>(STORE, id);
}

export async function saveConversation(conv: Conversation): Promise<void> {
  conv.updatedAt = Date.now();
  return put(STORE, conv);
}

export async function deleteConversation(id: string): Promise<void> {
  return del(STORE, id);
}

export async function searchConversations(query: string): Promise<ConversationSummary[]> {
  const all = await getAll<Conversation>(STORE);
  const lower = query.toLowerCase();
  return all
    .filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.messages.some((m) => m.content.toLowerCase().includes(lower))
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(toSummary);
}

export async function getConversationsByAgent(agentId: string): Promise<ConversationSummary[]> {
  const results = await getByIndex<Conversation>(STORE, "agentId", agentId);
  return results.sort((a, b) => b.updatedAt - a.updatedAt).map(toSummary);
}
