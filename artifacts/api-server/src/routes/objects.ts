/**
 * Service public des images — sans authentification.
 * Ne sert que les objets du préfixe uploads/ (photos de réalisations, etc.),
 * stockés sur Tigris.
 *
 * GET /api/objects/uploads/:id
 */
import { Router } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage.js";

const router = Router();
const storage = new ObjectStorageService();

router.get("/objects/uploads/:id", async (req, res) => {
  const id = String(req.params["id"] ?? "");
  if (!storage.isValidObjectId(id)) {
    res.status(404).json({ error: "Image introuvable" });
    return;
  }

  try {
    const object = await storage.getObject(id);

    res.setHeader("Content-Type", object.contentType);
    // 24 h de cache : l'identifiant est immuable, le contenu aussi.
    res.setHeader("Cache-Control", "public, max-age=86400");
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
      res.status(404).json({ error: "Image introuvable" });
    } else {
      res.status(500).json({ error: "Erreur serveur", detail: String(err) });
    }
  }
});

export default router;
