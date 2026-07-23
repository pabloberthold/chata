import type { ChatPlugin, PluginInput, PluginOutput, PluginContext } from "./types";
import { listMasks } from "../storage/aliasStore";

export class MaskPlugin implements ChatPlugin {
  id = "mask";
  name = "Máscaras";
  enabled = true;
  order = 30;
  phase: "input" | "output" = "input";

  private currentMasks: Array<{ original: string; masked: string }> = [];

  async process(input: PluginInput, _context: PluginContext): Promise<PluginOutput> {
    const masks = await listMasks();
    this.currentMasks = [];

    if (this.phase === "input") {
      let content = input.content;
      for (const entry of masks) {
        if (!entry.enabled) continue;
        const regex = new RegExp(escapeRegex(entry.original), "gi");
        if (regex.test(content)) {
          content = content.replace(regex, entry.masked);
          this.currentMasks.push({ original: entry.original, masked: entry.masked });
        }
      }
      return { content, metadata: { ...input.metadata, appliedMasks: this.currentMasks } };
    }

    return { content: input.content, metadata: input.metadata };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
