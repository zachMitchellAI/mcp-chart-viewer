import { eq } from "drizzle-orm";
import { db } from "../db";
import { mcpServers } from "../../utils/db/schema";
import { WOLFRAM_MCP_SERVER_NAME } from "../../utils/db/db.constants";
import { WOLFRAM_MCP_INSTRUCTIONS } from "../../utils/wolfram-agent.constants";

const WOLFRAM_MCP_URL = "https://agenttools.wolfram.com/mcp";

export default defineNitroPlugin(async () => {
  try {
    const existing = await db
      .select({ id: mcpServers.id })
      .from(mcpServers)
      .where(eq(mcpServers.name, WOLFRAM_MCP_SERVER_NAME));

    if (existing.length > 0) return;

    await db.insert(mcpServers).values({
      name: WOLFRAM_MCP_SERVER_NAME,
      isRemote: true,
      url: WOLFRAM_MCP_URL,
      command: null,
      env: null,
      agentInstructions: WOLFRAM_MCP_INSTRUCTIONS,
    });

    console.log("seeded default MCP server:", WOLFRAM_MCP_SERVER_NAME);
  } catch (e) {
    console.error("failed to seed default MCP servers", e);
  }
});
