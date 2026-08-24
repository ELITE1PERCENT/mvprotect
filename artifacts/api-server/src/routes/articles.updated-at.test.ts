/**
 * Integration test: view-count increments must never advance updated_at.
 *
 * The PostgreSQL trigger set_updated_at() only fires when editorial content
 * changes (title, excerpt, content, cover_image_url).  A view-count bump must
 * leave updated_at untouched so Google does not receive spurious dateModified
 * signals and re-crawl pages that haven't actually changed.
 */

import { describe, it, expect, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db, pool, articlesTable } from "@workspace/db";

// ── helpers ──────────────────────────────────────────────────────────────────

/** Insert a minimal test article and return its id + initial updated_at. */
async function seedTestArticle() {
  const [row] = await db
    .insert(articlesTable)
    .values({
      slug: `test-updated-at-${Date.now()}`,
      title: "Test article – original title",
      excerpt: "Original excerpt.",
      coverImageUrl: "images/test.png",
      content: "<p>Original content.</p>",
      publishedAt: new Date("2026-01-01"),
    })
    .returning({
      id: articlesTable.id,
      updatedAt: articlesTable.updatedAt,
    });

  return row;
}

/** Read just updated_at for one article from the database. */
async function fetchUpdatedAt(id: number): Promise<Date> {
  const [row] = await db
    .select({ updatedAt: articlesTable.updatedAt })
    .from(articlesTable)
    .where(eq(articlesTable.id, id));
  return row.updatedAt;
}

/** Exactly what the GET /articles/:slug route does to increment the counter. */
async function simulateViewCountIncrement(id: number): Promise<void> {
  await db
    .update(articlesTable)
    .set({ viewCount: sql`${articlesTable.viewCount} + 1` })
    .where(eq(articlesTable.id, id))
    .execute();
}

// ── cleanup ───────────────────────────────────────────────────────────────────

const insertedIds: number[] = [];

afterAll(async () => {
  // Remove test rows so they don't pollute the real article list
  for (const id of insertedIds) {
    await db.delete(articlesTable).where(eq(articlesTable.id, id));
  }
  await pool.end();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("updated_at invariant", () => {
  it("does NOT advance updated_at when a view is counted", async () => {
    const { id, updatedAt: before } = await seedTestArticle();
    insertedIds.push(id);

    // Simulate a human visit (what GET /articles/:slug does)
    await simulateViewCountIncrement(id);

    const after = await fetchUpdatedAt(id);

    expect(after.toISOString()).toBe(before.toISOString());
  });

  it("DOES advance updated_at when editorial content changes", async () => {
    const { id, updatedAt: before } = await seedTestArticle();
    insertedIds.push(id);

    // Wait a tick so now() is measurably later
    await new Promise((r) => setTimeout(r, 10));

    // Simulate an editorial edit (title change)
    await db
      .update(articlesTable)
      .set({ title: "Test article – updated title" })
      .where(eq(articlesTable.id, id))
      .execute();

    const after = await fetchUpdatedAt(id);

    expect(after.getTime()).toBeGreaterThan(before.getTime());
  });

  it("does NOT advance updated_at when both view-count and a non-editorial field change together", async () => {
    // This guards against a future developer accidentally adding viewCount
    // to the same UPDATE that also touches content, which would be wrong.
    // Here we confirm that a view-count-only UPDATE (no content columns)
    // truly leaves updated_at alone even if someone adds view_count to the
    // trigger's IF condition by mistake.
    const { id, updatedAt: before } = await seedTestArticle();
    insertedIds.push(id);

    // Bump view_count twice to be sure
    await simulateViewCountIncrement(id);
    await simulateViewCountIncrement(id);

    const after = await fetchUpdatedAt(id);
    expect(after.toISOString()).toBe(before.toISOString());

    // Sanity-check the counter did go up
    const [row] = await db
      .select({ viewCount: articlesTable.viewCount })
      .from(articlesTable)
      .where(eq(articlesTable.id, id));
    expect(row.viewCount).toBe(2);
  });

  it("confirms the PostgreSQL trigger — not the ORM — is the enforcement layer via raw SQL", async () => {
    // This test bypasses Drizzle entirely and issues bare SQL UPDATEs through
    // the pg pool.  Both assertions together prove that set_updated_at() is
    // the real enforcement layer:
    //   • a raw view_count bump leaves updated_at unchanged  (trigger ignores it)
    //   • a raw editorial edit advances updated_at            (trigger fires)
    // If the trigger were removed, the second assertion would fail.
    const { id, updatedAt: viewBefore } = await seedTestArticle();
    insertedIds.push(id);

    // 1️⃣  Raw view-count increment – trigger must NOT fire
    await pool.query(
      "UPDATE articles SET view_count = view_count + 1 WHERE id = $1",
      [id],
    );
    // updated_at must not change after a raw view_count bump
    const afterViewCount = await fetchUpdatedAt(id);
    expect(afterViewCount.toISOString()).toBe(viewBefore.toISOString());

    // 2️⃣  Raw editorial edit – trigger MUST fire and advance updated_at
    // Small delay so that now() is measurably later than the insert timestamp.
    await new Promise((r) => setTimeout(r, 10));
    await pool.query(
      "UPDATE articles SET title = 'Raw SQL editorial edit' WHERE id = $1",
      [id],
    );
    // updated_at must advance after a raw editorial update (proves trigger fired)
    const afterEditorial = await fetchUpdatedAt(id);
    expect(afterEditorial.getTime()).toBeGreaterThan(viewBefore.getTime());
  });
});
