import { z } from "zod";
import { getMcpServers } from "../db/get-mcp-servers";
import { addMcpServer } from "../db/add-mcp-server";
import { setMcpServer } from "../db/set-mcp-server";
import type { McpServerInput } from "../../utils/db/db.interface";

const envSchema = z
  .string()
  .transform((val, ctx) => {
    if (val.trim() === "") return null;
    try {
      return JSON.parse(val) as unknown;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "env must be valid JSON",
      });
      return z.NEVER;
    }
  })
  .pipe(
    z.union([
      z.record(z.string(), z.string()).transform((env) => JSON.stringify(env)),
      z.null(),
    ]),
  );

const baseFields = {
  name: z.string().min(1),
  env: envSchema.nullish(),
};

const remoteServerSchema = z.object({
  ...baseFields,
  isRemote: z.literal(true),
  url: z.string().min(1),
  command: z.string().nullish(),
});

const localServerSchema = z.object({
  ...baseFields,
  isRemote: z.literal(false),
  url: z.string().nullish(),
  command: z.string().min(1),
});

const addServerSchema = z.discriminatedUnion("isRemote", [
  remoteServerSchema,
  localServerSchema,
]);

const updateServerSchema = z.discriminatedUnion("isRemote", [
  remoteServerSchema.extend({ id: z.number().int().positive() }),
  localServerSchema.extend({ id: z.number().int().positive() }),
]);

type ServerPayload = z.output<typeof addServerSchema>;

function toInput(server: ServerPayload): McpServerInput {
  return {
    name: server.name,
    isRemote: server.isRemote,
    url: server.url ?? null,
    command: server.command ?? null,
    env: server.env ?? null,
  };
}

function badRequest(message: string): never {
  throw createError({ statusCode: 400, statusMessage: message });
}

export default defineEventHandler(async (event) => {
  if (event.method === "GET") {
    return getMcpServers();
  }

  const body = await readBody<unknown>(event);
  if (event.method === "POST") {
    const parsed = addServerSchema.safeParse(body);
    if (!parsed.success) {
      badRequest(
        `Invalid MCP server: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
    }
    try {
      return await addMcpServer(toInput(parsed.data));
    } catch (error) {
      throw createError({
        statusCode: 409,
        statusMessage: `MCP server name already exists: ${(error as Error).message}`,
      });
    }
  }

  if (event.method === "PATCH") {
    const parsed = updateServerSchema.safeParse(body);
    if (!parsed.success) {
      badRequest(
        `Invalid MCP server: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
    }
    const { id, ...rest } = parsed.data;
    const updated = await setMcpServer(id, toInput(rest));
    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: "MCP server not found",
      });
    }
    return { ok: true };
  }

  badRequest(`Method ${event.method} not allowed`);
});
