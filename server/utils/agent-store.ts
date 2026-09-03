import type { DeepAgent } from "deepagents";
import { createWolframAgent } from "../../utils/wolfram-agent";

let cachedAgent: DeepAgent | undefined;
let buildPromise: Promise<DeepAgent> | undefined;

async function buildAgent(): Promise<DeepAgent> {
  try {
    const agent = await createWolframAgent();
    cachedAgent = agent;
    return agent;
  } catch (error) {
    cachedAgent = undefined;
    console.error("Failed to build wolfram agent", error);
    throw error;
  } finally {
    buildPromise = undefined;
  }
}

export async function getAgent(): Promise<DeepAgent> {
  if (cachedAgent) {
    return cachedAgent;
  }
  buildPromise ??= buildAgent();
  return buildPromise;
}

export function rebuildAgent(): void {
  console.log("settings updated; rebuilding wolfram agent");
  cachedAgent = undefined;
  buildPromise ??= buildAgent();
  buildPromise.catch(() => undefined);
}
