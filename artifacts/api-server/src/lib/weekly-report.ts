/**
 * Cron job hebdomadaire — Rapport de trafic chaque mercredi à 16h (heure Paris).
 */
import cron from "node-cron";
import { pool } from "@workspace/db";
import { sendWeeklyReport, type PageViewRow } from "./email";
import { logger } from "./logger";

export function startWeeklyReportCron(): void {
  // "0 16 * * 3" = tous les mercredis à 16h00
  cron.schedule(
    "0 16 * * 3",
    async () => {
      logger.info("Weekly report cron: starting");
      try {
        const result = await pool.query<PageViewRow>(`
          SELECT path, date::text, count
          FROM   page_views
          WHERE  date >= CURRENT_DATE - INTERVAL '6 days'
          ORDER  BY date DESC, count DESC
        `);

        await sendWeeklyReport(result.rows);
        logger.info(
          { rows: result.rowCount },
          "Weekly report cron: email sent",
        );
      } catch (err) {
        logger.error({ err }, "Weekly report cron: failed");
      }
    },
    { timezone: "Europe/Paris" },
  );

  logger.info("Weekly report cron registered (Wednesdays 16:00 Paris)");
}
