import { z } from "zod";
import { getAgent } from "../utils/agent-store";
import { resolveMcpServers } from "../utils/mcp-store";
import { runWithToolCallCounting } from "../utils/tool-call-recorder";
import mockJson from "../../public/static-chart-data.json";

const filteredMock = mockJson.filter((e) => !e.loading);

const askSchema = z.object({
  query: z.string().min(1),
  mcpServerIds: z
    .array(z.number().int().positive())
    .default([])
    .transform((ids) => [...new Set(ids)]),
});

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed; POST { query, mcpServerIds }",
    });
  }

  const body = await readBody<unknown>(event);
  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    event.node.res.statusCode = 400;
    return {
      message: `invalid request body: ${parsed.error.issues
        .map((i) => i.message)
        .join("; ")}`,
    };
  }

  const { query, mcpServerIds } = parsed.data;

  console.log("query:", query, "| mcpServerIds:", mcpServerIds);

  // Mock the response given the query is `!mock`
  if (query === "!mock") {
    return filteredMock[Math.floor(Math.random() * filteredMock.length)];
  }

  const connectedServers = (await resolveMcpServers(mcpServerIds)).map(
    (server) => server.id,
  );

  if (mcpServerIds.length > 0 && connectedServers.length === 0) {
    event.node.res.statusCode = 502;
    return {
      message:
        "none of the requested MCP servers could be reached; no agent was built",
    };
  }

  // Create the agent (or reuse the cached one):
  const generatedAgent = await getAgent(connectedServers);

  // In a production environment, we'd need to sanitize this input for things like prompt-jacking.
  try {
    const { result: response, toolCallsUsed } = await runWithToolCallCounting(
      () =>
        generatedAgent.invoke({
          messages: [{ role: "user", content: query }],
        }),
    );

    if (!response) {
      return {
        message:
          "The model failed to produce a parsable output... drat. You might have to change the model for that to work.",
      };
    }

    // Print the response back to the console
    console.log(response);

    // The model's own `toolCallsUsed` value is unreliable (it hallucinates);
    // always overwrite it with the count recorded by the tool-call recorder.
    return { ...response.structuredResponse, toolCallsUsed, loading: false };
  } catch (e) {
    event.node.res.statusCode = 400;
    return { message: e };
  }
});
