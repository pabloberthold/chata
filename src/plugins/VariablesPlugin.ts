import type { ChatPlugin, PluginInput, PluginOutput, PluginContext } from "./types";

interface VariableEntry {
  name: string;
  value: string;
}

const BUILTIN_VARIABLES: VariableEntry[] = [
  { name: "SERVER", value: "srv-prod-01" },
  { name: "CLIENTE", value: "Cliente Demo" },
  { name: "WEB", value: "web-prod-01" },
  { name: "NAS", value: "nas-principal" },
];

export class VariablesPlugin implements ChatPlugin {
  id = "variables";
  name = "Variables";
  enabled = true;
  order = 20;
  phase: "input" | "output" = "input";

  async process(input: PluginInput, _context: PluginContext): Promise<PluginOutput> {
    let content = input.content;
    const replacedVars: Array<{ name: string; value: string }> = [];

    const allVars = [...BUILTIN_VARIABLES];
    const customVars = (input.metadata.customVariables as VariableEntry[]) || [];
    allVars.push(...customVars);

    for (const v of allVars) {
      const pattern = `$${v.name}`;
      if (content.includes(pattern)) {
        content = content.replace(new RegExp(escapeRegex(pattern), "g"), v.value);
        replacedVars.push(v);
      }
    }

    return {
      content,
      metadata: { ...input.metadata, replacedVariables: replacedVars },
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
