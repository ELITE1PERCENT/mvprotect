/**
 * Admin CRUD for réalisations.
 * All routes protected by requireAdmin middleware.
 *
 * GET    /admin/realisations         — list all (incl. drafts)
 * POST   /admin/realisations         — create
 * PUT    /admin/realisations/:id     — update
 * DELETE /admin/realisations/:id     — delete
 *
 * POST   /admin/upload/request-url  — get presigned GCS upload URL
 */
import { Router } from "express";
import { db, pool } from "@workspace/db";
import { realisationsTable, realisationImagesTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "../../middleware/adminAuth.js";
import { ObjectStorageService } from "../../lib/objectStorage.js";

const router = Router();
router.use(requireAdmin);

const storage = new ObjectStorageService();

// Helper: attach images array to each réalisation
async function withImages(rows: typeof realisationsTable.$inferSelect[]) {
  if (rows.length === 0) return rows.map((r) => ({ ...r, images: [] }));
  const ids = rows.map((r) => r.id);
  const imgs = await db
    .select()
    .from(realisationImagesTable)
    .where(eq(realisationImagesTable.realisationId, ids[0]!)) // overridden below
    // Use raw pool for IN query
    .limit(0); // dummy — real query below
  void imgs; // unused, just importing drizzle types
  const result = await pool.query<{ id: number; realisation_id: number; url: string; sort_order: number }>(
    `SELECT id, realisation_id, url, sort_order
     FROM realisation_images
     WHERE realisation_id = ANY($1::int[])
     ORDER BY sort_order ASC, id ASC`,
    [ids],
  );
  const byId: Record<number, { id: number; url: string; sortOrder: number }[]> = {};
  for (const img of result.rows) {
    if (!byId[img.realisation_id]) byId[img.realisation_id] = [];
    byId[img.realisation_id]!.push({ id: img.id, url: img.url, sortOrder: img.sort_order });
  }
  return rows.map((r) => ({ ...r, images: byId[r.id] ?? [] }));
}

// ── List all réalisations (admin sees drafts too) ──────────────────────────
router.get("/admin/realisations", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(realisationsTable)
      .orderBy(asc(realisationsTable.sortOrder));
    res.json(await withImages(rows));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Create ─────────────────────────────────────────────────────────────────
router.post("/admin/realisations", async (req, res) => {
  try {
    const { title, service, imageUrl, description, vehicle, sortOrder, status, category, featuredHome } =
      req.body as Record<string, string | number | boolean | undefined>;

    if (!title || !imageUrl || !description) {
      res.status(400).json({ error: "Champs requis manquants (title, imageUrl, description)" });
      return;
    }

    const [created] = await db
      .insert(realisationsTable)
      .values({
        title: String(title),
        service: String(service ?? ""),
        imageUrl: String(imageUrl),
        description: String(description),
        vehicle: vehicle ? String(vehicle) : null,
        sortOrder: Number(sortOrder ?? 0),
        status: String(status ?? "published"),
        category: category ? String(category) : null,
        featuredHome: Boolean(featuredHome ?? false),
      })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Update ─────────────────────────────────────────────────────────────────
router.put("/admin/realisations/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

    const { title, service, imageUrl, description, vehicle, sortOrder, status, category, featuredHome } =
      req.body as Record<string, string | number | boolean | undefined>;

    const [updated] = await db
      .update(realisationsTable)
      .set({
        ...(title !== undefined && { title: String(title) }),
        ...(service !== undefined && { service: String(service) }),
        ...(imageUrl !== undefined && { imageUrl: String(imageUrl) }),
        ...(description !== undefined && { description: String(description) }),
        ...(vehicle !== undefined && { vehicle: vehicle ? String(vehicle) : null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(status !== undefined && { status: String(status) }),
        ...(category !== undefined && { category: category ? String(category) : null }),
        ...(featuredHome !== undefined && { featuredHome: Boolean(featuredHome) }),
      })
      .where(eq(realisationsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Réalisation introuvable" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Delete ─────────────────────────────────────────────────────────────────
router.delete("/admin/realisations/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

    await db.delete(realisationsTable).where(eq(realisationsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Add image to a réalisation ────────────────────────────────────────────
router.post("/admin/realisations/:id/images", async (req, res) => {
  try {
    const realisationId = Number(req.params["id"]);
    if (isNaN(realisationId)) { res.status(400).json({ error: "ID invalide" }); return; }
    const { url, sortOrder } = req.body as { url: string; sortOrder?: number };
    if (!url) { res.status(400).json({ error: "url requis" }); return; }
    const [img] = await db
      .insert(realisationImagesTable)
      .values({ realisationId, url, sortOrder: sortOrder ?? 0 })
      .returning();
    res.status(201).json(img);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Delete a specific image ───────────────────────────────────────────────
router.delete("/admin/realisations/:id/images/:imageId", async (req, res) => {
  try {
    const imageId = Number(req.params["imageId"]);
    if (isNaN(imageId)) { res.status(400).json({ error: "imageId invalide" }); return; }
    await db.delete(realisationImagesTable).where(eq(realisationImagesTable.id, imageId));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Reorder images ────────────────────────────────────────────────────────
router.put("/admin/realisations/:id/images/reorder", async (req, res) => {
  try {
    const { order } = req.body as { order: { id: number; sortOrder: number }[] };
    await Promise.all(
      order.map(({ id, sortOrder }) =>
        db.update(realisationImagesTable)
          .set({ sortOrder })
          .where(eq(realisationImagesTable.id, id)),
      ),
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Presigned URL for image upload ────────────────────────────────────────
router.post("/admin/upload/request-url", async (_req, res) => {
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    // normalizeObjectEntityPath converts the GCS signed URL → /objects/uploads/<uuid>
    const objectPath = storage.normalizeObjectEntityPath(uploadURL);
    // Serving URL via our admin proxy route
    const servingUrl = `/api/admin${objectPath}`;
    res.json({ uploadURL, objectPath, servingUrl });
  } catch (err) {
    res.status(500).json({ error: "Erreur upload", detail: String(err) });
  }
});

// ── Serve uploaded objects (admin uses /api/admin/objects/<path>) ─────────
router.get("/admin/objects/*path", async (req, res) => {
  try {
    // Express 5 named wildcard: req.params.path is string | string[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (req.params as any)["path"];
    const rawPath = Array.isArray(raw) ? raw.join("/") : String(raw ?? "");
    const objectPath = `/objects/${rawPath}`;
    const file = await storage.getObjectEntityFile(objectPath);
    const response = await storage.downloadObject(file, 3600);
    const headers = Object.fromEntries(response.headers.entries());
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);
  } catch (err: unknown) {
    res.status(404).json({ error: "Fichier introuvable", detail: String(err) });
  }
});

export default router;
