import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const config = sqliteTable("config", {
  id: int().primaryKey({ autoIncrement: true }),
  key: text().notNull().unique(),
  type: text().notNull(),
  value: text().notNull(),
});
