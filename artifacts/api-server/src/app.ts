import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust exactly one proxy hop (the Fly.io / Replit edge / load-balancer).
// This lets Express resolve req.ip from X-Forwarded-For correctly
// while preventing clients from injecting arbitrary forwarded IPs.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Production: serve the built React frontend static files.
// On Replit the frontend is served separately; in production (Fly.io) we
// bundle it here so a single process handles everything.
if (process.env.NODE_ENV === "production") {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(__dirname, "..", "public");

  app.use(express.static(publicDir));

  // SPA fallback — serve index.html for every non-API route so that
  // client-side routing (wouter) works on page refresh.
  app.get("*", (_req, res) => {
    res.sendFile(join(publicDir, "index.html"));
  });
}

export default app;
