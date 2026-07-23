import { getAll, get, put, del } from "./db";
import type { AgentDefinition } from "../types/agent";
import { registry } from "../agents/registry";
import { loadBuiltinAgents } from "../agents/loader";

const STORE = "agents";

let loaded = false;
function ensureBuiltinLoaded() {
  if (!loaded) {
    loadBuiltinAgents();
    loaded = true;
  }
}

export async function listAgents(): Promise<AgentDefinition[]> {
  ensureBuiltinLoaded();
  const builtIn = registry.getAll();
  const userAgents = await getAll<AgentDefinition>(STORE);
  return [...builtIn, ...userAgents];
}

export async function getAgent(id: string): Promise<AgentDefinition | undefined> {
  ensureBuiltinLoaded();
  const builtIn = registry.get(id);
  if (builtIn) return builtIn;
  const user = await get<AgentDefinition>(STORE, id);
  return user ?? undefined;
}

export async function saveAgent(agent: AgentDefinition): Promise<void> {
  return put(STORE, agent);
}

export async function deleteAgent(id: string): Promise<void> {
  return del(STORE, id);
}
