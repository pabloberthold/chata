import { getProvider } from "../providers/index";
import type { StreamChunk } from "../providers/types";
import { defaultPipeline } from "../plugins/Pipeline";
import type { PluginContext, PluginInput } from "../plugins/types";
import { saveConversation, getConversation } from "../storage/conversationStore";
import { getAgent } from "../storage/agentStore";
import type { Conversation, Message } from "../types";

const FREE_MODEL = "meta-llama/llama-3.2-3b-instruct:free";

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  modelId: string,
  agentId: string,
  onChunk: (chunk: string) => void,
  onDone: (fullContent: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  const provider = getProvider();
  const agent = await getAgent(agentId);
  const resolvedModel = modelId || FREE_MODEL;

  try {
    let conv = await getConversation(conversationId);
    if (!conv) {
      conv = {
        id: conversationId,
        title: content.slice(0, 60),
        messages: [],
        modelId: resolvedModel,
        agentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        estimatedTokens: 0,
        pinned: false,
      };
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
      agentId,
    };
    conv.messages.push(userMessage);
    await saveConversation(conv);

    const pluginContext: PluginContext = {
      conversationId,
      agentId,
      modelId: resolvedModel,
      messages: conv.messages.map((m) => ({ role: m.role, content: m.content })),
      metadata: {},
    };

    const pluginInput: PluginInput = {
      content,
      conversationId,
      agentId,
      modelId: resolvedModel,
      metadata: {
        systemPrompt: agent?.systemPrompt,
        initialPrompt: agent?.initialPrompt,
        includeHistory: true,
      },
    };

    const processedInput = await defaultPipeline.processInput(
      agent?.plugins || [],
      pluginInput,
      pluginContext
    );

    const apiMessages = [];
    if (agent?.systemPrompt) {
      apiMessages.push({ role: "system" as const, content: agent.systemPrompt });
    }
    for (const msg of conv.messages.slice(-10)) {
      if (msg.role !== "system") {
        apiMessages.push({ role: msg.role as "user" | "assistant", content: msg.content });
      }
    }
    apiMessages.push({ role: "user" as const, content: processedInput.content });

    const fullContent = await streamChat(
      provider,
      {
        model: resolvedModel,
        messages: apiMessages,
        temperature: agent?.temperature,
        topP: agent?.topP,
        stream: true,
      },
      onChunk
    );

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: fullContent,
      timestamp: Date.now(),
      agentId,
    };
    conv.messages.push(assistantMessage);
    conv.estimatedTokens += estimateTokens(fullContent);

    if (conv.title === content.slice(0, 60) && conv.messages.length > 2) {
      conv.title = await generateTitle(content);
    }

    await saveConversation(conv);
    onDone(fullContent);
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

async function streamChat(
  provider: ReturnType<typeof getProvider>,
  request: Parameters<typeof provider.chat>[0],
  onChunk: (chunk: string) => void
): Promise<string> {
  const chunks: string[] = [];
  const iterable = provider.chat(request);

  for await (const chunk of iterable) {
    if (chunk.content) {
      chunks.push(chunk.content);
      onChunk(chunk.content);
    }
  }

  return chunks.join("");
}

export async function regenerateMessage(
  conversationId: string,
  modelId: string,
  agentId: string,
  onChunk: (chunk: string) => void,
  onDone: (fullContent: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  const conv = await getConversation(conversationId);
  if (!conv || conv.messages.length === 0) {
    onError(new Error("No hay mensajes para regenerar"));
    return;
  }

  const lastUserMsg = [...conv.messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) {
    onError(new Error("No hay mensaje de usuario para regenerar"));
    return;
  }

  conv.messages = conv.messages.filter((m) => m.role !== "assistant" || m !== conv.messages[conv.messages.length - 1]);

  await saveConversation(conv);
  const resolvedModel = modelId || FREE_MODEL;
  await sendMessage(conversationId, lastUserMsg.content, resolvedModel, agentId, onChunk, onDone, onError);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function generateTitle(content: string): Promise<string> {
  const maxLen = 60;
  return content.length > maxLen ? `${content.slice(0, maxLen)}...` : content;
}

export function abortChat(): void {
  const provider = getProvider();
  provider.abort();
}
