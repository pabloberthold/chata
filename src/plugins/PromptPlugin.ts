import type { ChatPlugin, PluginInput, PluginOutput, PluginContext } from "./types";

export class PromptPlugin implements ChatPlugin {
  id = "prompt";
  name = "Prompt Processor";
  enabled = true;
  order = 5;
  phase: "input" | "output" = "input";

  async process(input: PluginInput, context: PluginContext): Promise<PluginOutput> {
    let content = input.content;

    if (input.metadata.systemPrompt) {
      const systemIndex = context.messages.findIndex((m) => m.role === "system");
      if (systemIndex >= 0) {
        context.messages[systemIndex] = {
          ...context.messages[systemIndex],
          content: input.metadata.systemPrompt as string,
        };
      }
    }

    if (input.metadata.initialPrompt && context.messages.length <= 2) {
      content = `${input.metadata.initialPrompt as string}\n\n${content}`;
    }

    return { content, metadata: input.metadata };
  }
}
