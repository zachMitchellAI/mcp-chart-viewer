import { z } from "zod";
import { getMcpServers } from "../db/get-mcp-servers";
import { addMcpServer } from "../db/add-mcp-server";
import { setMcpServer } from "../db/set-mcp-server";
import { deleteMcpServer } from "../db/delete-mcp-server";
import { invalidateAgents } from "../utils/agent-store";
import { invalidateMcpServer } from "../utils/mcp-store";
import type { McpServerInput } from "../../utils/db/db.interface";

const jsonRecordSchema = z
  .string()
  .transform((val, ctx) => {
    if (val.trim() === "") return null;
    try {
      return JSON.parse(val) as unknown;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "must be valid JSON",
      });
      return z.NEVER;
    }
  })
  .pipe(
    z.union([
      z
        .record(z.string(), z.string())
        .transform((record) => JSON.stringify(record)),
      z.null(),
    ]),
  );

const remoteServerSchema = z.object({
  name: z.string().min(1),
  isRemote: z.literal(true),
  url: z.string().min(1),
  headers: jsonRecordSchema.nullish(),
  command: z.string().nullish(),
  agentInstructions: z.string().nullish(),
});

const localServerSchema = z.object({
  name: z.string().min(1),
  isRemote: z.literal(false),
  url: z.string().nullish(),
  env: jsonRecordSchema.nullish(),
  command: z.string().min(1),
  agentInstructions: z.string().nullish(),
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

const deleteServerSchema = z.object({
  id: z.number().int().positive(),
});

function toInput(server: ServerPayload): McpServerInput {
  if (server.isRemote) {
    return {
      name: server.name,
      isRemote: true,
      url: server.url,
      command: null,
      env: null,
      headers: server.headers ?? null,
      agentInstructions: server.agentInstructions ?? null,
    };
  }
  return {
    name: server.name,
    isRemote: false,
    url: null,
    command: server.command,
    env: server.env ?? null,
    headers: null,
    agentInstructions: server.agentInstructions ?? null,
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
    invalidateMcpServer(id);
    invalidateAgents();
    return { ok: true };
  }

  if (event.method === "DELETE") {
    const parsed = deleteServerSchema.safeParse(body);
    if (!parsed.success) {
      badRequest(
        `Invalid MCP server id: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
      );
    }
    const deleted = await deleteMcpServer(parsed.data.id);
    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: "MCP server not found",
      });
    }
    invalidateMcpServer(parsed.data.id);
    invalidateAgents();
    return { ok: true };
  }

  badRequest(`Method ${event.method} not allowed`);
});
