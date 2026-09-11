import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const config = sqliteTable("config", {
  id: int().primaryKey({ autoIncrement: true }),
  key: text().notNull().unique(),
  type: text().notNull(),
  value: text().notNull(),
});

export const mcpServers = sqliteTable("mcp_servers", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  isRemote: int({ mode: "boolean" }).notNull(),
  url: text(),
  command: text(),
  env: text(),
  agentInstructions: text(),
});
