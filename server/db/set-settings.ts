import { eq } from "drizzle-orm";
import { db } from "./index";
import { config } from "../../utils/db/schema";
import {
  CONFIG_KEY_SETTINGS,
  CONFIG_TYPE_SETTINGS,
} from "../../utils/db/db.constants";
import { rebuildAgent } from "../utils/agent-store";
import type { SettingsValue } from "../../utils/db/db.interface";

export async function setSettings(value: SettingsValue): Promise<boolean> {
  const result = await db
    .update(config)
    .set({ type: CONFIG_TYPE_SETTINGS, value: JSON.stringify(value) })
    .where(eq(config.key, CONFIG_KEY_SETTINGS));
  const updated = result.changes > 0;
  if (updated) {
    rebuildAgent();
  }
  return updated;
}
