/**
 * Admin CRUD for content blocks (textes éditables du site).
 * All routes protected by requireAdmin middleware.
 *
 * GET /admin/content           — list all blocks
 * PUT /admin/content/:key      — update a block's value
 */
import { Router } from "express";
import { db } from "@workspace/db";
import { contentBlocksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../../middleware/adminAuth.js";

const router = Router();
router.use(requireAdmin);

router.get("/admin/content", async (_req, res) => {
  try {
    const blocks = await db
      .select()
      .from(contentBlocksTable)
      .orderBy(contentBlocksTable.section, contentBlocksTable.key);
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

router.put("/admin/content/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body as { value?: string };

    if (typeof value !== "string") {
      res.status(400).json({ error: "La valeur est requise" });
      return;
    }

    const [updated] = await db
      .update(contentBlocksTable)
      .set({ value, updatedAt: new Date() })
      .where(eq(contentBlocksTable.key, key))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Bloc introuvable" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", detail: String(err) });
  }
});

export default router;
