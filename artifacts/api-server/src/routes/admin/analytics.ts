import { Router, type IRouter } from "express";
import { requireAdmin } from "../../middleware/adminAuth";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/analytics", requireAdmin, async (req, res): Promise<void> => {
  const period = (req.query.period as string) || "day";

  let rows: { date: string; total: number }[];

  if (period === "week") {
    const result = await pool.query<{ date: string; total: number }>(`
      SELECT date_trunc('week', date)::date::text AS date,
             SUM(count)::int                       AS total
      FROM   page_views
      WHERE  date >= CURRENT_DATE - INTERVAL '27 days'
      GROUP  BY 1
      ORDER  BY 1 ASC
    `);
    rows = result.rows;
  } else if (period === "month") {
    const result = await pool.query<{ date: string; total: number }>(`
      SELECT date_trunc('month', date)::date::text AS date,
             SUM(count)::int                        AS total
      FROM   page_views
      WHERE  date >= CURRENT_DATE - INTERVAL '5 months'
      GROUP  BY 1
      ORDER  BY 1 ASC
    `);
    rows = result.rows;
  } else {
    // default: day — last 7 days
    const result = await pool.query<{ date: string; total: number }>(`
      SELECT date::text  AS date,
             SUM(count)::int AS total
      FROM   page_views
      WHERE  date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP  BY 1
      ORDER  BY 1 ASC
    `);
    rows = result.rows;
  }

  res.json(rows);
});

export default router;
