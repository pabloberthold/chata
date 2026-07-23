import type { ChatPlugin, PluginInput, PluginOutput, PluginContext } from "./types";

export class MemoryPlugin implements ChatPlugin {
  id = "memory";
  name = "Memoria";
  enabled = true;
  order = 40;
  phase: "input" | "output" = "input";

  async process(input: PluginInput, _context: PluginContext): Promise<PluginOutput> {
    const recentMessages = _context.messages.slice(-6);
    const historySummary = recentMessages
      .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content.slice(0, 200)}`)
      .join("\n");

    const content = input.metadata.includeHistory
      ? `${input.content}\n\n[Contexto de conversación reciente]:\n${historySummary}`
      : input.content;

    return { content, metadata: input.metadata };
  }
}
