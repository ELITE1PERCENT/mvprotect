/**
 * Admin CRUD for testimonials.
 * All routes protected by requireAdmin middleware.
 *
 * GET    /admin/testimonials       — list all
 * POST   /admin/testimonials       — create
 * PUT    /admin/testimonials/:id   — update
 * DELETE /admin/testimonials/:id   — delete
 */
import { Router } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../middleware/adminAuth.js";

const router = Router();
router.use(requireAdmin);

// ── List all ───────────────────────────────────────────────────────────────
router.get("/admin/testimonials", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(testimonialsTable)
      .orderBy(testimonialsTable.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

const VALID_SOURCES = ["google", "site"] as const;

// ── Create ─────────────────────────────────────────────────────────────────
router.post("/admin/testimonials", async (req, res) => {
  try {
    const { name, rating, comment, vehicle, source } =
      req.body as Record<string, string | number | undefined>;

    if (!name || rating === undefined || !comment) {
      res.status(400).json({ error: "Champs requis manquants (name, rating, comment)" });
      return;
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ error: "La note doit être entre 1 et 5" });
      return;
    }

    const sourceVal = source === undefined ? "site" : String(source);
    if (!VALID_SOURCES.includes(sourceVal as (typeof VALID_SOURCES)[number])) {
      res.status(400).json({ error: "Source invalide (google ou site)" });
      return;
    }

    const [created] = await db
      .insert(testimonialsTable)
      .values({
        name: String(name),
        rating: ratingNum,
        comment: String(comment),
        vehicle: vehicle ? String(vehicle) : null,
        source: sourceVal,
      })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Update ─────────────────────────────────────────────────────────────────
router.put("/admin/testimonials/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

    const { name, rating, comment, vehicle, source } =
      req.body as Record<string, string | number | undefined>;

    if (rating !== undefined) {
      const ratingNum = Number(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        res.status(400).json({ error: "La note doit être entre 1 et 5" });
        return;
      }
    }

    if (
      source !== undefined &&
      !VALID_SOURCES.includes(String(source) as (typeof VALID_SOURCES)[number])
    ) {
      res.status(400).json({ error: "Source invalide (google ou site)" });
      return;
    }

    const [updated] = await db
      .update(testimonialsTable)
      .set({
        ...(name !== undefined && { name: String(name) }),
        ...(rating !== undefined && { rating: Number(rating) }),
        ...(comment !== undefined && { comment: String(comment) }),
        ...(vehicle !== undefined && { vehicle: vehicle ? String(vehicle) : null }),
        ...(source !== undefined && { source: String(source) }),
      })
      .where(eq(testimonialsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Témoignage introuvable" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

// ── Delete ─────────────────────────────────────────────────────────────────
router.delete("/admin/testimonials/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

export default router;
