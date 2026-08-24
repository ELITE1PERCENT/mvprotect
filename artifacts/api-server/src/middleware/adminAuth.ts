/**
 * Admin JWT authentication middleware.
 * Reads the signed `admin_token` httpOnly cookie and verifies it.
 * Attaches `req.isAdmin = true` on success; responds 401 otherwise.
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "fallback-secret";

/** Extend Express Request to carry isAdmin flag */
declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token =
    (req.cookies as Record<string, string> | undefined)?.["admin_token"];
  if (!token) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  try {
    jwt.verify(token, SECRET);
    req.isAdmin = true;
    next();
  } catch {
    res.status(401).json({ error: "Session expirée ou invalide" });
  }
}

/** Generate a signed admin JWT */
export function signAdminToken(): string {
  // Cast required: JWT types use branded StringValue, env var is plain string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ role: "admin" }, SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as any });
}
