import { eq } from "drizzle-orm";
import { db } from "./index";
import { mcpServers } from "../../utils/db/schema";

export async function deleteMcpServer(id: number): Promise<boolean> {
  const result = await db.delete(mcpServers).where(eq(mcpServers.id, id));
  return result.changes > 0;
}
