export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  tokenCount?: number;
  agentId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  agentId: string;
  createdAt: number;
  updatedAt: number;
  estimatedTokens: number;
  pinned: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  modelId: string;
  agentId: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  estimatedTokens: number;
  pinned: boolean;
}

export interface AppSettings {
  openRouterKey: string;
  theme: "dark" | "light";
  defaultModel: string;
  defaultAgent: string;
  fontSize: number;
  enterToSend: boolean;
}

export interface AliasEntry {
  alias: string;
  value: string;
  category: string;
}

export interface MaskEntry {
  original: string;
  masked: string;
  enabled: boolean;
}

export interface VariableEntry {
  name: string;
  value: string;
  category: string;
}
