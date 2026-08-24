import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const realisationsTable = pgTable("realisations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  service: text("service").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  vehicle: text("vehicle"),
  sortOrder: integer("sort_order").notNull().default(0),
  // Admin additions
  status: text("status").notNull().default("published"), // 'published' | 'draft'
  category: text("category"),                            // 'Nettoyage' | 'Polissage & Céramique' | 'PPF' | 'Covering'
  featuredHome: boolean("featured_home").notNull().default(false), // affiché en page d'accueil
});

export const insertRealisationSchema = createInsertSchema(
  realisationsTable,
).omit({ id: true });
export type InsertRealisation = z.infer<typeof insertRealisationSchema>;
export type Realisation = typeof realisationsTable.$inferSelect;
