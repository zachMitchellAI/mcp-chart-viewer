import type { DynamicStructuredTool } from "@langchain/core/tools";
import type { MultiServerMCPClient } from "@langchain/mcp-adapters";

export type McpTool = DynamicStructuredTool;
export type McpTools = McpTool[];

export type McpServerCacheEntry = {
  name: string;
  client: MultiServerMCPClient;
  tools: McpTools | undefined;
  connectPromise: Promise<McpTools> | undefined;
  instructions: string | null;
};

export type ResolvedMcpServer = {
  id: number;
  name: string;
  tools: McpTools;
  instructions: string | null;
};
