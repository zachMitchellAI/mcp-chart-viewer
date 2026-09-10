import { eq } from "drizzle-orm";
import { db } from "./index";
import { mcpServers } from "../../utils/db/schema";
import type { McpServerInput } from "../../utils/db/db.interface";

export async function setMcpServer(
  id: number,
  input: McpServerInput,
): Promise<boolean> {
  const result = await db
    .update(mcpServers)
    .set(input)
    .where(eq(mcpServers.id, id));
  return result.changes > 0;
}
