import { Router, type IRouter } from "express";
import { desc, eq, lt, ne, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { db, articlesTable, viewDedupTable } from "@workspace/db";
import {
  GetArticleParams,
  GetArticleResponse,
  ListArticlesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// View-count protection
// ---------------------------------------------------------------------------

/** Known bot/crawler User-Agent patterns — not counted as real views. */
const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discord|slack|preview|lighthouse|headless|puppeteer|playwright|selenium|chrome-lighthouse|adsbot|pingdom|uptimerobot|sitechecker|semrush|ahref|mj12bot|dotbot|yandex|baiduspider|sogou|exabot|ia_archiver/i;

const VIEW_DEDUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Returns true when this visit should increment the counter.
 *
 * Deduplication is stored in the `view_dedup` PostgreSQL table so the
 * 1-hour window survives server restarts, crashes, and deployments.
 * The IP is SHA-256 hashed before storage to avoid persisting raw addresses.
 */
async function shouldCountView(
  ip: string,
  articleId: number,
  ua: string,
): Promise<boolean> {
  if (BOT_UA_PATTERN.test(ua)) return false;

  const ipHash = createHash("sha256").update(ip).digest("hex");
  const key = `${ipHash}:${articleId}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - VIEW_DEDUP_WINDOW_MS);

  // Check whether a recent entry already exists for this key.
  const [existing] = await db
    .select({ viewedAt: viewDedupTable.viewedAt })
    .from(viewDedupTable)
    .where(eq(viewDedupTable.key, key));

  if (existing && existing.viewedAt >= windowStart) {
    // Already counted within the current 1-hour window.
    return false;
  }

  // Upsert: insert or refresh the timestamp.
  await db
    .insert(viewDedupTable)
    .values({ key, viewedAt: now })
    .onConflictDoUpdate({
      target: viewDedupTable.key,
      set: { viewedAt: now },
    });

  // Lazy eviction: delete stale rows older than the dedup window to keep the
  // table small. Runs on every counted view; cheap because the index on `key`
  // makes it a targeted delete.
  db.delete(viewDedupTable)
    .where(lt(viewDedupTable.viewedAt, windowStart))
    .execute()
    .catch(() => {/* ignore */});

  return true;
}

router.get("/articles", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(articlesTable)
    .orderBy(desc(articlesTable.publishedAt));

  res.json(
    ListArticlesResponse.parse(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        coverImageUrl: row.coverImageUrl,
        publishedAt: row.publishedAt.toISOString(),
        viewCount: row.viewCount,
      })),
    ),
  );
});

router.get("/articles/:slug", async (req, res): Promise<void> => {
  const params = GetArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.slug, params.data.slug));

  if (!article) {
    res.status(404).json({ error: "Article introuvable" });
    return;
  }

  // Increment view count only for real human visits (no bots, no duplicates within 1 h).
  // req.ip is resolved by Express using the trusted proxy chain (trust proxy = 1),
  // so clients cannot spoof it by injecting X-Forwarded-For headers.
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const ua = req.headers["user-agent"] ?? "";

  if (await shouldCountView(ip, article.id, ua)) {
    db.update(articlesTable)
      .set({ viewCount: sql`${articlesTable.viewCount} + 1` })
      .where(eq(articlesTable.id, article.id))
      .execute()
      .catch(() => {/* ignore */});
  }

  const candidates = await db
    .select()
    .from(articlesTable)
    .where(ne(articlesTable.id, article.id))
    .orderBy(desc(articlesTable.publishedAt));

  // Score by slug keyword overlap (thematic) + popularity (viewCount)
  const currentKeywords = new Set(
    article.slug.split("-").filter((w) => w.length > 3),
  );
  const maxViews = Math.max(1, ...candidates.map((c) => c.viewCount));
  const scored = candidates.map((c) => {
    const keywords = c.slug.split("-").filter((w) => w.length > 3);
    const thematicScore = keywords.filter((w) => currentKeywords.has(w)).length;
    // Popularity normalised to [0, 1] then weighted at 0.5 relative to each thematic point
    const popularityScore = (c.viewCount / maxViews) * 0.5;
    return { article: c, score: thematicScore + popularityScore };
  });
  scored.sort((a, b) => b.score - a.score);
  const related = scored.slice(0, 3).map((s) => s.article);

  res.json(
    GetArticleResponse.parse({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      coverImageUrl: article.coverImageUrl,
      publishedAt: article.publishedAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      viewCount: article.viewCount,
      content: article.content,
      related: related.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        coverImageUrl: row.coverImageUrl,
        publishedAt: row.publishedAt.toISOString(),
        viewCount: row.viewCount,
      })),
    }),
  );
});
export default router;
