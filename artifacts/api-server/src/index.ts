import app from "./app";
import { logger } from "./lib/logger";
import { runStartupSeed } from "./lib/startup-seed";
import { startWeeklyReportCron } from "./lib/weekly-report";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await runStartupSeed();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Démarre le cron du rapport hebdomadaire (mercredi 16h Paris)
  startWeeklyReportCron();
});
