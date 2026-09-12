import {
  MultiServerMCPClient,
  type StdioConnection,
} from "@langchain/mcp-adapters";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { mcpServers } from "../../utils/db/schema";
import type { McpServerValue } from "../../utils/db/db.interface";
import type {
  McpServerCacheEntry,
  McpTools,
  ResolvedMcpServer,
} from "./mcp-store.interface";

const mcpCache = new Map<number, McpServerCacheEntry>();

function buildClient(row: McpServerValue): MultiServerMCPClient {
  if (row.isRemote) {
    if (!row.url) {
      throw new Error(`MCP server "${row.name}" is remote but has no url`);
    }
    return new MultiServerMCPClient({
      [row.name]: {
        transport: "http",
        url: row.url,
      },
    });
  }

  if (!row.command) {
    throw new Error(`MCP server "${row.name}" is local but has no command`);
  }

  let env: Record<string, string> | undefined;
  if (row.env) {
    const parsed: unknown = JSON.parse(row.env);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error(`MCP server "${row.name}" has malformed env JSON`);
    }
    env = parsed as Record<string, string>;
  }

  const commandPlusArgs = row.command.split(" ");

  const connection: StdioConnection = {
    transport: "stdio",
    command: commandPlusArgs[0]!,
    args: commandPlusArgs.slice(1),
    ...(env ? { env } : {}),
  };

  return new MultiServerMCPClient({
    [row.name]: connection,
  });
}

async function fetchServerRow(id: number): Promise<McpServerValue> {
  const rows = await db.select().from(mcpServers).where(eq(mcpServers.id, id));

  const row = rows[0];
  if (!row) {
    throw new Error(`MCP server id ${id} does not exist`);
  }
  return row;
}

async function connect(entry: McpServerCacheEntry): Promise<McpTools> {
  try {
    const tools = await entry.client.getTools();
    entry.tools = tools;
    return tools;
  } catch (error) {
    entry.connectPromise = undefined;
    throw error;
  }
}

async function resolveMcpServer(id: number): Promise<ResolvedMcpServer> {
  const cached = mcpCache.get(id);
  if (cached && cached.tools) {
    return {
      id,
      name: cached.name,
      tools: cached.tools,
      instructions: cached.instructions,
    };
  }

  let entry = cached;
  if (!entry) {
    const row = await fetchServerRow(id);
    entry = {
      name: row.name,
      client: buildClient(row),
      tools: undefined,
      connectPromise: undefined,
      instructions: row.agentInstructions,
    };
    mcpCache.set(id, entry);
  }

  entry.connectPromise ??= connect(entry);
  const tools = await entry.connectPromise;

  return {
    id,
    name: entry.name,
    tools,
    instructions: entry.instructions,
  };
}

export async function resolveMcpServers(
  ids: number[],
): Promise<ResolvedMcpServer[]> {
  const resolved: ResolvedMcpServer[] = [];
  const failed: string[] = [];

  await Promise.all(
    ids.map(async (id) => {
      try {
        resolved.push(await resolveMcpServer(id));
      } catch (error) {
        mcpCache.delete(id);
        console.error(`MCP server ${id} failed to connect; skipping it`, error);
        failed.push(String(id));
      }
    }),
  );

  if (failed.length > 0) {
    console.warn("connected MCP servers degraded; failed ids:", failed);
  }

  return resolved;
}

export function invalidateMcpServer(id: number): void {
  mcpCache.delete(id);
}

export function invalidateAllMcpServers(): void {
  mcpCache.clear();
}
