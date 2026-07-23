import { registry } from "./registry";
import type { AgentDefinition } from "../types/agent";

import linuxDef from "./definitions/linux.json";
import devopsDef from "./definitions/devops.json";
import astroDef from "./definitions/astro.json";
import programmerDef from "./definitions/programmer.json";
import writerDef from "./definitions/writer.json";
import homeAssistantDef from "./definitions/home-assistant.json";
import haproxyDef from "./definitions/haproxy.json";
import openshiftDef from "./definitions/openshift.json";

export function loadBuiltinAgents(): void {
  const defs: AgentDefinition[] = [
    linuxDef as AgentDefinition,
    devopsDef as AgentDefinition,
    astroDef as AgentDefinition,
    programmerDef as AgentDefinition,
    writerDef as AgentDefinition,
    homeAssistantDef as AgentDefinition,
    haproxyDef as AgentDefinition,
    openshiftDef as AgentDefinition,
  ];

  for (const def of defs) {
    registry.define(def);
  }
}
