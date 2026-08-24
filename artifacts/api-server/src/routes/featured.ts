/**
 * Public routes for homepage featured réalisations.
 *
 * GET /api/realisations/featured  — up to 6 featured (featured_home = true),
 *                                   falls back to first 6 published by sort_order
 * GET /api/realisations/photo-count — total published photo count (main + extra images)
 */
import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

/** Converts admin-only image URLs to publicly accessible ones. */
function toPublicUrl(url: string): string {
  if (!url) return url;
  // /api/admin/objects/uploads/<uuid> → /api/objects/uploads/<uuid>
  return url.replace(/^\/api\/admin\/objects\//, "/api/objects/");
}

router.get("/realisations/featured", async (_req, res) => {
  try {
    // Featured items first, then fallback
    const { rows: featured } = await pool.query<{
      id: number;
      title: string;
      service: string;
      image_url: string;
      description: string;
      vehicle: string | null;
      sort_order: number;
      category: string | null;
      featured_home: boolean;
    }>(
      `SELECT id, title, service, image_url, description, vehicle, sort_order, category, featured_home
       FROM realisations
       WHERE status = 'published' AND featured_home = true
       ORDER BY sort_order ASC
       LIMIT 6`,
    );

    const items =
      featured.length >= 1
        ? featured
        : // fallback: first 6 published
          (
            await pool.query<typeof featured[number]>(
              `SELECT id, title, service, image_url, description, vehicle, sort_order, category, featured_home
               FROM realisations
               WHERE status = 'published'
               ORDER BY sort_order ASC
               LIMIT 6`,
            )
          ).rows;

    // Enrich with extra images
    const ids = items.map((r) => r.id);
    let imagesByRealId: Record<number, { id: number; url: string }[]> = {};
    if (ids.length > 0) {
      const { rows: imgs } = await pool.query<{ realisation_id: number; id: number; url: string }>(
        `SELECT realisation_id, id, url FROM realisation_images
         WHERE realisation_id = ANY($1::int[])
         ORDER BY sort_order ASC, id ASC`,
        [ids],
      );
      for (const img of imgs) {
        if (!imagesByRealId[img.realisation_id]) imagesByRealId[img.realisation_id] = [];
        imagesByRealId[img.realisation_id]!.push({ id: img.id, url: img.url });
      }
    }

    res.json(
      items.map((r) => ({
        id: r.id,
        title: r.title,
        service: r.service,
        imageUrl: toPublicUrl(r.image_url),
        description: r.description,
        vehicle: r.vehicle,
        sortOrder: r.sort_order,
        category: r.category,
        featuredHome: r.featured_home,
        images: (imagesByRealId[r.id] ?? []).map((img) => ({
          ...img,
          url: toPublicUrl(img.url),
        })),
      })),
    );
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

router.get("/realisations/photo-count", async (_req, res) => {
  try {
    const { rows: main } = await pool.query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM realisations WHERE status = 'published'`,
    );
    const { rows: extra } = await pool.query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM realisation_images ri
       JOIN realisations r ON r.id = ri.realisation_id
       WHERE r.status = 'published'`,
    );
    const total = Number(main[0]?.n ?? 0) + Number(extra[0]?.n ?? 0);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

export default router;
