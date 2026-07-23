import type { AgentDefinition } from "../types/agent";

const agents = new Map<string, AgentDefinition>();

function define(agent: AgentDefinition): void {
  agents.set(agent.id, agent);
}

export const registry = {
  getAll: (): AgentDefinition[] => Array.from(agents.values()),
  get: (id: string): AgentDefinition | undefined => agents.get(id),
  define,
};
