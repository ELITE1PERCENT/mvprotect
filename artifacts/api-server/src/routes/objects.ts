/**
 * Public object-serving route — no auth required.
 * Only serves files under the uploads/ prefix (realisation photos, etc.).
 *
 * GET /api/objects/uploads/:id
 */
import { Router } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage.js";

const router = Router();
const storage = new ObjectStorageService();

router.get("/objects/uploads/*path", async (req, res) => {
  try {
    // Express 5 named wildcard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (req.params as any)["path"];
    const rawPath = Array.isArray(raw) ? raw.join("/") : String(raw ?? "");
    // Restrict to uploads/ prefix — never expose other object prefixes publicly
    if (!rawPath || rawPath.includes("..")) {
      res.status(400).json({ error: "Chemin invalide" });
      return;
    }
    const objectPath = `/objects/uploads/${rawPath}`;
    const file = await storage.getObjectEntityFile(objectPath);
    const response = await storage.downloadObject(file, 86400); // 24h cache for public images
    const headers = Object.fromEntries(response.headers.entries());
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);
  } catch (err: unknown) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Image introuvable" });
    } else {
      res.status(500).json({ error: "Erreur serveur", detail: String(err) });
    }
  }
});

export default router;
