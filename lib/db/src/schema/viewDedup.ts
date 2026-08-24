import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Persistent deduplication store for article view counting.
 * Replaces the in-memory Map so restarts don't reset the 1-hour window.
 *
 * `key`       — `${hashedIp}:${articleId}` (IP is SHA-256 hashed for privacy)
 * `viewedAt`  — when the view was first recorded in the current window
 */
export const viewDedupTable = pgTable("view_dedup", {
  key: text("key").primaryKey(),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull(),
});
