import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentBlocksTable = pgTable("content_blocks", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  section: text("section").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertContentBlockSchema = createInsertSchema(contentBlocksTable);
export type InsertContentBlock = z.infer<typeof insertContentBlockSchema>;
export type ContentBlock = typeof contentBlocksTable.$inferSelect;
