import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, pool, realisationsTable } from "@workspace/db";
import {
  ListRealisationsQueryParams,
  ListRealisationsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/** Converts admin-only image URLs to publicly accessible ones. */
function toPublicUrl(url: string): string {
  if (!url) return url;
  return url.replace(/^\/api\/admin\/objects\//, "/api/objects/");
}

router.get("/realisations", async (req, res): Promise<void> => {
  const parsed = ListRealisationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const service = parsed.data.service;
  const rows = await db
    .select()
    .from(realisationsTable)
    .where(and(
      eq(realisationsTable.status, "published"),
      service ? eq(realisationsTable.service, service) : undefined
    ))
    .orderBy(asc(realisationsTable.sortOrder), asc(realisationsTable.id));

  // Filter out rows with invalid enum values (resilient to admin-entered data)
  const valid = rows.filter((r) => ListRealisationsResponse.element.safeParse(r).success);

  // Enrich with additional images
  if (valid.length > 0) {
    const ids = valid.map((r) => r.id);
    const imgs = await pool.query<{ realisation_id: number; id: number; url: string; sort_order: number }>(
      `SELECT realisation_id, id, url, sort_order
       FROM realisation_images
       WHERE realisation_id = ANY($1::int[])
       ORDER BY sort_order ASC, id ASC`,
      [ids],
    );
    const byId: Record<number, { id: number; url: string }[]> = {};
    for (const img of imgs.rows) {
      if (!byId[img.realisation_id]) byId[img.realisation_id] = [];
      byId[img.realisation_id]!.push({ id: img.id, url: toPublicUrl(img.url) });
    }
    res.json(valid.map((r) => ({
      ...r,
      imageUrl: toPublicUrl(r.imageUrl as unknown as string),
      images: byId[r.id] ?? [],
    })));
    return;
  }

  res.json(valid);
});

export default router;
