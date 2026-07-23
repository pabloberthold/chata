import type { ConversationSummary } from "../types";

type Listener = (list: ConversationSummary[]) => void;
let listeners: Set<Listener> = new Set();
let currentList: ConversationSummary[] = [];

export function subscribeConvs(fn: Listener): () => void {
  listeners.add(fn);
  fn(currentList);
  return () => { listeners.delete(fn); };
}

export async function refreshConvs(): Promise<void> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return;
  try {
    const { listConversations } = await import("../storage/conversationStore");
    currentList = await listConversations();
  } catch {
    currentList = [];
  }
  for (const fn of listeners) {
    fn(currentList);
  }
}
