import type { DeepAgent } from "deepagents";
import type { SettingsValue } from "../../utils/db/db.interface";
import type { ResolvedMcpServer } from "./mcp-store.interface";

export type AgentCacheEntry = {
  agent: DeepAgent | undefined;
  buildPromise: Promise<DeepAgent> | undefined;
};

export type AgentDeps = {
  servers: ResolvedMcpServer[];
  settings: SettingsValue | undefined;
};
