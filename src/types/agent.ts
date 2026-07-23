export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  preferredModel: string;
  documents: string[];
  initialPrompt: string;
  aliases: string[];
  plugins: string[];
  category: string;
  builtIn: boolean;
}

export interface AgentCategory {
  id: string;
  name: string;
  icon: string;
}
