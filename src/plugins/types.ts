export interface PluginInput {
  content: string;
  conversationId: string;
  agentId: string;
  modelId: string;
  metadata: Record<string, unknown>;
}

export interface PluginOutput {
  content: string;
  metadata: Record<string, unknown>;
}

export interface PluginContext {
  conversationId: string;
  agentId: string;
  modelId: string;
  messages: Array<{ role: string; content: string }>;
  metadata: Record<string, unknown>;
}

export interface ChatPlugin {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  phase: "input" | "output";
  process(input: PluginInput, context: PluginContext): Promise<PluginOutput>;
}
