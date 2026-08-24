import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testimonialsTable = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  vehicle: text("vehicle"),
  // "google" = avis Google vérifié · "site" = témoignage recueilli directement
  source: text("source").notNull().default("site"),
});

export const insertTestimonialSchema = createInsertSchema(
  testimonialsTable,
).omit({ id: true });
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonialsTable.$inferSelect;
