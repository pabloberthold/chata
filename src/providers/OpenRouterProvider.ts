import type { LLMProvider, LLMModel, ChatRequest, StreamChunk } from "./types";
import { getApiKey } from "../storage/settingsStore";

export class OpenRouterProvider implements LLMProvider {
  id = "openrouter";
  name = "OpenRouter";
  private abortController: AbortController | null = null;
  private baseUrl = "https://openrouter.ai/api/v1";

  async listModels(): Promise<LLMModel[]> {
    const apiKey = await getApiKey();
    const res = await fetch(`${this.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Failed to fetch models: ${res.statusText}`);
    const json = await res.json();
    return (json.data || []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      name: (m.name as string) || (m.id as string),
      provider: ((m.id as string).split("/")[0] || "unknown") as string,
      description: (m.description as string) || "",
      contextLength: (m.context_length as number) || 4096,
      pricing: {
        prompt: ((m.pricing as Record<string, unknown>)?.prompt as number) || 0,
        completion: ((m.pricing as Record<string, unknown>)?.completion as number) || 0,
      },
      capabilities: (m.capabilities as string[]) || [],
      available: true,
    }));
  }

  async validateKey(): Promise<boolean> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) return false;
      const res = await fetch(`${this.baseUrl}/auth/key`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async *chat(request: ChatRequest): AsyncIterable<StreamChunk> {
    const apiKey = await getApiKey();
    this.abortController = new AbortController();

    const body: Record<string, unknown> = {
      model: request.model,
      messages: request.messages,
      stream: request.stream,
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.topP !== undefined) body.top_p = request.topP;
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "AI Workspace",
      },
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenRouter API error ${res.status}: ${errBody}`);
    }

    if (!res.body) {
      throw new Error("Response body is null");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            yield { content: "", done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            const finishReason = parsed.choices?.[0]?.finish_reason || null;
            const usage = parsed.usage
              ? {
                  promptTokens: parsed.usage.prompt_tokens || 0,
                  completionTokens: parsed.usage.completion_tokens || 0,
                  totalTokens: parsed.usage.total_tokens || 0,
                }
              : undefined;

            yield {
              content: delta,
              done: finishReason !== null,
              finishReason: finishReason || undefined,
              usage,
            };
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
      this.abortController = null;
    }
  }

  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}
