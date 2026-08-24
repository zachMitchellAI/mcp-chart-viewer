export const THEMES = ["", "dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_ICONS: Record<Theme, string> = {
  "": "mdi-theme-light-dark",
  dark: "mdi-weather-night",
  light: "mdi-weather-sunny",
} as const;
