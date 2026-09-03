import { getAgent } from "../utils/agent-store";
import mockJson from "../../public/static-chart-data.json";

const filteredMock = mockJson.filter((e) => !e.loading);

export default defineEventHandler(async (event) => {
  // Create the agent (or reuse the cached one):
  const generatedAgent = await getAgent();
  const query = new URL(
    "https://example.com" + event.node.req.url,
  ).searchParams.get("q");

  if (!query) {
    event.node.res.statusCode = 400;
    return {
      message: "invalid query! use ?q=my query is this!",
    };
  }

  console.log("query:", query);

  // Mock the response given the query is `!mock`
  if (query === "!mock") {
    return filteredMock[Math.floor(Math.random() * filteredMock.length)];
  }

  // In a production environment, we'd need to sanitize this input for things like prompt-jacking.
  try {
    const response = await generatedAgent.invoke({
      messages: [{ role: "user", content: query }],
    });

    if (!response) {
      return {
        message:
          "The model failed to produce a parsable output... drat. You might have to change the model for that to work.",
      };
    }

    // Print the response back to the console
    console.log(response);

    return response.structuredResponse;
  } catch (e) {
    event.node.res.statusCode = 400;
    return { message: e };
  }
});
