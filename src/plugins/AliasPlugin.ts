import type { ChatPlugin, PluginInput, PluginOutput, PluginContext } from "./types";
import { listAliases } from "../storage/aliasStore";

export class AliasPlugin implements ChatPlugin {
  id = "alias";
  name = "Alias";
  enabled = true;
  order = 10;
  phase: "input" | "output" = "input";

  async process(input: PluginInput, _context: PluginContext): Promise<PluginOutput> {
    const aliases = await listAliases();
    let content = input.content;
    const appliedAliases: Array<{ alias: string; value: string }> = [];

    for (const entry of aliases) {
      const regex = new RegExp(`\\b${escapeRegex(entry.alias)}\\b`, "gi");
      if (regex.test(content)) {
        content = content.replace(regex, entry.value);
        appliedAliases.push({ alias: entry.alias, value: entry.value });
      }
    }

    return {
      content,
      metadata: { ...input.metadata, appliedAliases },
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
