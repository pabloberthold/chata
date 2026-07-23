import type { ChatPlugin, PluginInput, PluginOutput, PluginContext } from "./types";
import hljs from "highlight.js";

export class HighlightPlugin implements ChatPlugin {
  id = "highlight";
  name = "Syntax Highlight";
  enabled = true;
  order = 110;
  phase: "output" = "output";

  async process(input: PluginInput, _context: PluginContext): Promise<PluginOutput> {
    const content = input.content;
    const highlighted = content.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (_match, lang, code) => {
        const language = lang || "plaintext";
        try {
          const result = hljs.highlight(code.trim(), { language });
          return `\`\`\`${language}\n${result.value}\n\`\`\``;
        } catch {
          return _match;
        }
      }
    );
    return { content: highlighted, metadata: { ...input.metadata, highlighted: true } };
  }
}
