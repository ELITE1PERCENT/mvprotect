import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const BOT_UA =
  /bot|crawler|spider|scraper|facebookexternalhit|Twitterbot|rogerbot|linkedinbot|embedly|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator/i;

router.post("/track", async (req, res): Promise<void> => {
  try {
    const ua = req.headers["user-agent"] ?? "";
    if (BOT_UA.test(ua)) { res.sendStatus(204); return; }

    const rawPath = (req.body?.path as string) ?? "/";
    const path = rawPath.replace(/[?#].*$/, "").slice(0, 200) || "/";

    await pool.query(
      `INSERT INTO page_views (path, date, count)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (path, date) DO UPDATE SET count = page_views.count + 1`,
      [path]
    );
  } catch {
    // Never fail the client for analytics
  }
  res.sendStatus(204);
});

export default router;
