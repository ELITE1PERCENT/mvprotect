import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// Public endpoint — no auth required
router.get("/content", async (_req, res): Promise<void> => {
  const result = await pool.query(
    `SELECT key, label, section, value FROM content_blocks ORDER BY section, key`
  );
  res.json(result.rows);
});

export default router;
