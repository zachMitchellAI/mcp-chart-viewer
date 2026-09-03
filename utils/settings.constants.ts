export const SETTING_MODAL_WIDTH = 400;

export type SettingField = {
  key: string;
  title: string;
};

export const SETTING_FIELDS: SettingField[] = [
  { key: "OPENROUTER_API_KEY", title: "Api Key" },
  { key: "CHART_MODEL", title: "Chart Model (orchestrator)" },
  { key: "CHART_SUBAGENT", title: "Chart Subagent Models" },
];
