import type { DeepAgent } from "deepagents";
import { createAgent } from "../../utils/agent";
import { getSettings } from "../db/get-settings";
import type { AgentCacheEntry, AgentDeps } from "./agent-store.interface";
import { resolveMcpServers } from "./mcp-store";

const agentCache = new Map<string, AgentCacheEntry>();

function cacheKeyFor(ids: number[]): string {
  return JSON.stringify([...ids].sort((a, b) => a - b));
}

export async function getAgent(ids: number[]): Promise<DeepAgent> {
  const key = cacheKeyFor(ids);
  const cached = agentCache.get(key);
  if (cached?.agent) {
    return cached.agent;
  }

  const servers = await resolveMcpServers(ids);
  const settings = await getSettings();

  const entry: AgentCacheEntry = cached ?? {
    agent: undefined,
    buildPromise: undefined,
  };
  agentCache.set(key, entry);

  entry.buildPromise ??= buildAgent(entry, { servers, settings });
  return entry.buildPromise;
}

async function buildAgent(
  entry: AgentCacheEntry,
  deps: AgentDeps,
): Promise<DeepAgent> {
  const key = cacheKeyFor(deps.servers.map((server) => server.id));
  try {
    const agent = await createAgent(deps);
    entry.agent = agent;
    return agent;
  } catch (error) {
    agentCache.delete(key);
    console.error("failed to build agent", key, error);
    throw error;
  } finally {
    entry.buildPromise = undefined;
  }
}

export function invalidateAgents(): void {
  agentCache.clear();
}

export function invalidateAgent(ids: number[]): void {
  agentCache.delete(cacheKeyFor(ids));
}
