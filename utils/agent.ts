import { createDeepAgent, type DeepAgent, type SubAgent } from "deepagents";
import { ChatOpenRouter } from "@langchain/openrouter";
import { toolStrategy } from "langchain";
import { AgentResponseSchema, createChartDataDTOSchema } from "./chart-schemas";
import { CHART_TYPES, type ChartTypeLiteral } from "./chart-types.interface";
import {
  CHART_TYPE_GUIDANCE,
  CHART_FORMATTER_BASE_PROMPT,
  DATA_DELEGATOR_PROMPT,
  DATA_SUBAGENT_PROMPT,
} from "./agent.constants";
import type { AgentDeps } from "../server/utils/agent-store.interface";
import { toolCallRecorder } from "../server/utils/tool-call-recorder";

function createSubagentModel(settings: AgentDeps["settings"]): ChatOpenRouter {
  return new ChatOpenRouter({
    model: settings?.CHART_SUBAGENT || "google/gemma-4-31b-it",
    apiKey: settings?.OPENROUTER_API_KEY,
  });
}

function createChartFormatterSubAgent(
  type: ChartTypeLiteral,
  model: ChatOpenRouter,
): SubAgent {
  const prompt = CHART_FORMATTER_BASE_PROMPT.replace("{TYPE}", type).replace(
    "{GUIDANCE}",
    CHART_TYPE_GUIDANCE[type],
  );
  const schema = createChartDataDTOSchema(type);
  return {
    name: `${type}-formatter`,
    description: `Format data as ${type} chart`,
    model,
    systemPrompt: prompt,
    responseFormat: toolStrategy<typeof schema>(schema, {
      handleError: true,
    }),
  };
}

function buildSubagentSystemPrompt(deps: AgentDeps): string {
  const instructions = deps.servers
    .map((server) => server.instructions?.trim())
    .filter((instructions): instructions is string => Boolean(instructions));

  if (instructions.length === 0) return DATA_SUBAGENT_PROMPT;

  return `${DATA_SUBAGENT_PROMPT}\n\n${instructions.join("\n\n")}`;
}

export async function createAgent(deps: AgentDeps): Promise<DeepAgent> {
  const { settings } = deps;

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
    createChartFormatterSubAgent(type, createSubagentModel(settings)),
  );

  const subagents: SubAgent[] = [...chartFormatters];

  const tools = deps.servers.flatMap((server) => server.tools);
  if (tools.length > 0) {
    subagents.push({
      name: "data-agent",
      description: "Run data-gathering queries based on user requests",
      model: createSubagentModel(settings),
      tools,
      middleware: [toolCallRecorder],
      systemPrompt: buildSubagentSystemPrompt(deps),
    } as SubAgent);
  } else {
    console.warn("no MCP tools connected; agent built without data subagent");
  }

  const agent = createDeepAgent({
    model,
    systemPrompt: DATA_DELEGATOR_PROMPT,
    permissions: [
      {
        operations: ["read", "write"],
        paths: ["/**"],
        mode: "deny",
      },
    ],
    // `providerStrategy` relies on provider-native JSON-schema output, which
    // GLM-flash/OpenRouter ignores (it returns prose), so use tool-call based
    // structured output with retry-on-validation-failure instead.
    responseFormat: toolStrategy(AgentResponseSchema, { handleError: true }),
    subagents,
  });

  return agent;
}
