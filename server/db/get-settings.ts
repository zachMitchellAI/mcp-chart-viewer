import { eq } from "drizzle-orm";
import { db } from "./index";
import { config } from "../../utils/db/schema";
import {
  CONFIG_KEY_SETTINGS,
  CONFIG_TYPE_SETTINGS,
} from "../../utils/db/db.constants";
import type { SettingsValue } from "../../utils/db/db.interface";

export async function getSettings(): Promise<SettingsValue | undefined> {
  const rows = await db
    .select()
    .from(config)
    .where(eq(config.key, CONFIG_KEY_SETTINGS))
    .limit(1);
  const row = rows[0];
  if (!row || row.type !== CONFIG_TYPE_SETTINGS) return undefined;
  try {
    return JSON.parse(row.value) as SettingsValue;
  } catch {
    console.warn("config row 'settings' contains invalid JSON");
    return;
  }
}
