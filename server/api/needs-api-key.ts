import { getSettings } from "../db/get-settings";

export default defineEventHandler(async (_event) => {
  const settings = await getSettings();
  return {
    result: !(settings?.OPENROUTER_API_KEY || false),
  };
});
