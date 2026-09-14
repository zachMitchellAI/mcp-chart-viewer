export type SettingsValue = {
  OPENROUTER_API_KEY: string;
  CHART_MODEL: string;
  CHART_SUBAGENT: string;
};

export type McpServerValue = {
  id: number;
  name: string;
  isRemote: boolean;
  url: string | null;
  command: string | null;
  env: string | null;
  headers: string | null;
  agentInstructions: string | null;
};

export type McpServerInput = Omit<McpServerValue, "id">;
