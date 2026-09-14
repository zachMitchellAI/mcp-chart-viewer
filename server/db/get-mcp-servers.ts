import { db } from "./index";
import { mcpServers } from "../../utils/db/schema";
import type { McpServerValue } from "../../utils/db/db.interface";

export async function getMcpServers(): Promise<McpServerValue[]> {
  return db.select().from(mcpServers);
}
