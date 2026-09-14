import { db } from "./index";
import { mcpServers } from "../../utils/db/schema";
import type {
  McpServerInput,
  McpServerValue,
} from "../../utils/db/db.interface";

export async function addMcpServer(
  input: McpServerInput,
): Promise<McpServerValue | undefined> {
  const inserted = await db.insert(mcpServers).values(input).returning();
  return inserted[0];
}
