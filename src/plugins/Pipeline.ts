import type { ChatPlugin, PluginInput, PluginOutput, PluginContext } from "./types";
import { AliasPlugin } from "./AliasPlugin";
import { MaskPlugin } from "./MaskPlugin";
import { VariablesPlugin } from "./VariablesPlugin";
import { PromptPlugin } from "./PromptPlugin";
import { MemoryPlugin } from "./MemoryPlugin";
import { MarkdownPlugin } from "./MarkdownPlugin";
import { HighlightPlugin } from "./HighlightPlugin";

const BUILTIN_PLUGINS: ChatPlugin[] = [
  new AliasPlugin(),
  new VariablesPlugin(),
  new MaskPlugin(),
  new PromptPlugin(),
  new MemoryPlugin(),
  new MarkdownPlugin(),
  new HighlightPlugin(),
];

export class Pipeline {
  private plugins: Map<string, ChatPlugin> = new Map();

  constructor(additionalPlugins: ChatPlugin[] = []) {
    for (const p of [...BUILTIN_PLUGINS, ...additionalPlugins]) {
      this.plugins.set(p.id, p);
    }
  }

  getPlugin(id: string): ChatPlugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): ChatPlugin[] {
    return Array.from(this.plugins.values());
  }

  setEnabled(id: string, enabled: boolean): void {
    const plugin = this.plugins.get(id);
    if (plugin) plugin.enabled = enabled;
  }

  async processInput(pluginIds: string[], input: PluginInput, context: PluginContext): Promise<PluginOutput> {
    let current: PluginOutput = { content: input.content, metadata: { ...input.metadata } };

    const enabledPlugins = Array.from(this.plugins.values())
      .filter((p) => p.enabled && p.phase === "input")
      .sort((a, b) => a.order - b.order);

    const orderedPlugins = pluginIds.length > 0
      ? enabledPlugins.filter((p) => pluginIds.includes(p.id))
      : enabledPlugins;

    for (const plugin of orderedPlugins) {
      if (!plugin.enabled) continue;
      try {
        current = await plugin.process(
          { ...input, content: current.content, metadata: current.metadata },
          context
        );
      } catch (err) {
        console.error(`Plugin ${plugin.id} error:`, err);
      }
    }

    return current;
  }

  async processOutput(pluginIds: string[], input: PluginInput, context: PluginContext): Promise<PluginOutput> {
    let current: PluginOutput = { content: input.content, metadata: { ...input.metadata } };

    const enabledPlugins = Array.from(this.plugins.values())
      .filter((p) => p.enabled && p.phase === "output")
      .sort((a, b) => a.order - b.order);

    const orderedPlugins = pluginIds.length > 0
      ? enabledPlugins.filter((p) => pluginIds.includes(p.id))
      : enabledPlugins;

    for (const plugin of orderedPlugins) {
      if (!plugin.enabled) continue;
      try {
        current = await plugin.process(
          { ...input, content: current.content, metadata: current.metadata },
          context
        );
      } catch (err) {
        console.error(`Plugin ${plugin.id} error:`, err);
      }
    }

    return current;
  }
}

export const defaultPipeline = new Pipeline();
