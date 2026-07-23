export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  description: string;
  category: string;
  tags: string[];
  variables: PromptVariable[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PromptVariable {
  name: string;
  defaultValue: string;
  description: string;
}
