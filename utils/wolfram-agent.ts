import { createDeepAgent, type DeepAgent, type SubAgent } from "deepagents";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenRouter } from "@langchain/openrouter";
import { providerStrategy, toolStrategy } from "langchain";
import { ChartDataDTOSchema, createChartDataDTOSchema } from "./chart-schemas";
import { CHART_TYPES, type ChartTypeLiteral } from "./chart-types.interface";
import { getSettings } from "../server/db/get-settings";
import {
  CHART_TYPE_GUIDANCE,
  CHART_FORMATTER_BASE_PROMPT,
  WOLFRAM_DELEGATOR_PROMPT,
  WOLFRAM_SUBAGENT_PROMPT,
} from "./wolfram-agent.constants";

function createChartFormatterSubAgent(
  type: ChartTypeLiteral,
  subagentModel: string | undefined,
): SubAgent {
  const prompt = CHART_FORMATTER_BASE_PROMPT.replace("{TYPE}", type).replace(
    "{GUIDANCE}",
    CHART_TYPE_GUIDANCE[type],
  );
  const schema = createChartDataDTOSchema(type);
  return {
    name: `${type}-formatter`,
    description: `Format data as ${type} chart`,
    model: subagentModel,
    systemPrompt: prompt,
    responseFormat: toolStrategy<typeof schema>(schema, {
      handleError: true,
    }),
  };
}

export async function createWolframAgent(): Promise<DeepAgent> {
  const settings = await getSettings();

  const wolfram = new MultiServerMCPClient({
    wolfram: {
      transport: "http",
      url: "https://agenttools.wolfram.com/mcp",
    },
  });

  let wolframTools: Awaited<ReturnType<typeof wolfram.getTools>> | undefined;

  async function getWolframTools() {
    if (!wolframTools) {
      wolframTools = await wolfram.getTools();
    }
    return wolframTools;
  }

  console.warn(
    "using:",
    settings?.CHART_MODEL,
    "and",
    settings?.CHART_SUBAGENT,
  );
  const model = new ChatOpenRouter({
    model: settings?.CHART_MODEL || "z-ai/glm-5.3-flash",
    apiKey: settings?.OPENROUTER_API_KEY,
  });

  const chartFormatters = CHART_TYPES.map((type) =>
    createChartFormatterSubAgent(
      type,
      settings?.CHART_SUBAGENT || "google/gemma-4-31b-it",
    ),
  );

  const subagents = [...chartFormatters];

  try {
    subagents.push({
      name: "wolfram-agent",
      description: "Run wolfram queries based on user requests",
      model: settings?.CHART_SUBAGENT,
      tools: await getWolframTools(),
      systemPrompt: WOLFRAM_SUBAGENT_PROMPT,
    } as SubAgent);
  } catch (e) {
    console.error(
      "Wolfram server failed to connect; unable to add-in the subagent until that works",
      e,
    );
  }

  const agent = createDeepAgent({
    model,
    systemPrompt: WOLFRAM_DELEGATOR_PROMPT,
    permissions: [
      {
        operations: ["read", "write"],
        paths: ["/**"],
        mode: "deny",
      },
    ],
    responseFormat: providerStrategy(ChartDataDTOSchema),
    subagents,
  });

  return agent;
}
