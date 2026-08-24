/**
 * Integration test: verifies that /api/articles/:slug exposes updatedAt
 * and that it is distinct from publishedAt.
 *
 * Run: node scripts/test-article-updated-at.mjs
 *
 * Expects the API server to be running on localhost:8080.
 */

const BASE = "http://localhost:8080/api";
const SLUG = "guide-complet-ppf-film-protection-peinture";

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function main() {
  console.log(`\nTesting GET ${BASE}/articles/${SLUG}\n`);

  const res = await fetch(`${BASE}/articles/${SLUG}`);
  assert(res.ok, `HTTP 200 (got ${res.status})`);

  const article = await res.json();

  // updatedAt must be present and a valid ISO date
  assert(typeof article.updatedAt === "string", "updatedAt is a string");
  const updatedDate = new Date(article.updatedAt);
  assert(!isNaN(updatedDate.getTime()), "updatedAt is a valid ISO date");

  // publishedAt must still be present
  assert(typeof article.publishedAt === "string", "publishedAt is a string");

  // updatedAt must differ from publishedAt — identical values signal
  // no editorial update has been tracked, defeating Google's re-crawl signal
  assert(
    article.updatedAt !== article.publishedAt,
    `updatedAt (${article.updatedAt}) !== publishedAt (${article.publishedAt})`
  );

  // Simulate SEO.tsx logic: dateModified only included when different
  const wouldIncludeDateModified =
    article.updatedAt && article.updatedAt !== article.publishedAt;
  assert(
    wouldIncludeDateModified,
    "JSON-LD dateModified would be injected (values differ)"
  );

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}\n`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Test error:", err.message);
  process.exit(1);
});
