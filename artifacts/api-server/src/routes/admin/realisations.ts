/**
 * Admin CRUD for réalisations.
 * All routes protected by requireAdmin middleware.
 *
 * GET    /admin/realisations         — list all (incl. drafts)
 * POST   /admin/realisations         — create
 * PUT    /admin/realisations/:id     — update
 * DELETE /admin/realisations/:id     — delete
 *
 * POST   /admin/upload/request-url  — réserve un id et renvoie l'URL de PUT
 * PUT    /admin/upload/put/:id      — reçoit le fichier et l'envoie sur Tigris
 * GET    /admin/objects/uploads/:id — relit une image depuis Tigris
 */
import express, { Router } from "express";
import { db, pool } from "@workspace/db";
import { realisationsTable, realisationImagesTable } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "../../middleware/adminAuth.js";
import { ObjectStorageService, ObjectNotFoundError } from "../../lib/objectStorage.js";

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

// ── Réservation d'un emplacement d'upload ─────────────────────────────────
// On renvoie une URL RELATIVE, jamais une URL signée Tigris : le PUT doit
// repasser par notre API pour que le cookie httpOnly `admin_token` parte avec
// (une URL signée pointerait sur un autre domaine, sans cookie ni contrôle).
router.post("/admin/upload/request-url", (_req, res) => {
  const id = storage.newObjectId();
  res.json({
    uploadURL: `/api/admin/upload/put/${id}`,
    objectPath: `/objects/uploads/${id}`,
    // URL publique : c'est elle qui est stockée en base et rendue sur le site.
    servingUrl: storage.publicPath(id),
  });
});

// ── Réception du fichier et envoi vers Tigris ─────────────────────────────
// express.raw avec `type: () => true` court-circuite les parsers JSON/urlencoded
// globaux et donne le corps brut, quel que soit le Content-Type annoncé.
router.put(
  "/admin/upload/put/:id",
  express.raw({ type: () => true, limit: "25mb" }),
  async (req, res) => {
    try {
      const id = String(req.params["id"] ?? "");
      if (!storage.isValidObjectId(id)) {
        res.status(400).json({ error: "ID invalide" });
        return;
      }

      const contentType = (req.get("content-type") ?? "")
        .split(";")[0]!
        .trim()
        .toLowerCase();
      if (!contentType.startsWith("image/")) {
        res.status(415).json({ error: "Seules les images sont acceptées" });
        return;
      }

      const body: unknown = req.body;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        res.status(400).json({ error: "Fichier vide" });
        return;
      }

      await storage.uploadObject(id, body, contentType);
      res.status(200).json({ ok: true, servingUrl: storage.publicPath(id) });
    } catch (err) {
      res.status(500).json({ error: "Erreur upload", detail: String(err) });
    }
  },
);

// ── Relecture d'une image depuis l'admin ──────────────────────────────────
// Conservé pour les URLs /api/admin/objects/uploads/<id> déjà en base.
router.get("/admin/objects/uploads/:id", async (req, res) => {
  const id = String(req.params["id"] ?? "");
  if (!storage.isValidObjectId(id)) {
    res.status(404).json({ error: "Fichier introuvable" });
    return;
  }

  try {
    const object = await storage.getObject(id);

    res.setHeader("Content-Type", object.contentType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    if (object.contentLength !== undefined) {
      res.setHeader("Content-Length", String(object.contentLength));
    }
    if (object.etag) {
      res.setHeader("ETag", object.etag);
    }

    object.stream.on("error", () => {
      res.destroy();
    });
    object.stream.pipe(res);
  } catch (err: unknown) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Fichier introuvable" });
    } else {
      res.status(500).json({ error: "Erreur serveur", detail: String(err) });
    }
  }
});

export default router;
