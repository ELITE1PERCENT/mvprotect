import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { realisationsTable } from "./realisations";

export const realisationImagesTable = pgTable("realisation_images", {
  id: serial("id").primaryKey(),
  realisationId: integer("realisation_id")
    .notNull()
    .references(() => realisationsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertRealisationImageSchema = createInsertSchema(
  realisationImagesTable,
).omit({ id: true });
export type InsertRealisationImage = z.infer<typeof insertRealisationImageSchema>;
export type RealisationImage = typeof realisationImagesTable.$inferSelect;
