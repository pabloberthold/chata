import type { ChatPlugin, PluginInput, PluginOutput, PluginContext } from "./types";

export class MarkdownPlugin implements ChatPlugin {
  id = "markdown";
  name = "Markdown Renderer";
  enabled = true;
  order = 100;
  phase: "output" = "output";

  async process(input: PluginInput, _context: PluginContext): Promise<PluginOutput> {
    const content = input.content;
    return { content, metadata: { ...input.metadata, rendered: true } };
  }
}
