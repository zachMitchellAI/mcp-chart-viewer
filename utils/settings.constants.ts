export const SETTING_MODAL_WIDTH = 600;

export type SettingField = {
  key: string;
  title: string;
};

export const SETTING_FIELDS: SettingField[] = [
  { key: "OPENROUTER_API_KEY", title: "Api Key" },
  { key: "CHART_MODEL", title: "Chart Model (orchestrator)" },
  { key: "CHART_SUBAGENT", title: "Chart Subagent Models" },
];

export type SettingsTab = "api-settings" | "mcp-servers";

export const API_SETTINGS_TAB: SettingsTab = "api-settings";
export const MCP_SERVERS_TAB: SettingsTab = "mcp-servers";

export const MCP_SERVER_DRAFT_PANEL_ID = -1;
