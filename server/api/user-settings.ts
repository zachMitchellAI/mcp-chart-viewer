import { getSettings } from "../db/get-settings";
import { setSettings } from "../db/set-settings";
import { invalidateAgents } from "../utils/agent-store";
import type { SettingsValue } from "../../utils/db/db.interface";

const EMPTY_SETTINGS: SettingsValue = {
  OPENROUTER_API_KEY: "",
  CHART_MODEL: "",
  CHART_SUBAGENT: "",
};

export default defineEventHandler(async (event) => {
  if (event.method === "POST") {
    const body = await readBody<Partial<SettingsValue>>(event);
    const current = (await getSettings()) ?? EMPTY_SETTINGS;
    const updated = await setSettings({ ...current, ...body });
    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: "Settings row not found",
      });
    }
    invalidateAgents();
    return { ok: true };
  }
  return { ...(await getSettings()) };
});
