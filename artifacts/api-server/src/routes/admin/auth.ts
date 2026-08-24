/**
 * Admin authentication routes.
 * POST /admin/login  — verify credentials, set httpOnly cookie
 * POST /admin/logout — clear cookie
 * GET  /admin/me     — return auth status (for frontend guard)
 */
import { Router } from "express";
import bcrypt from "bcryptjs";
import { signAdminToken, requireAdmin } from "../../middleware/adminAuth.js";

const router = Router();

const COOKIE_NAME = "admin_token";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/",
};

router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    res.status(500).json({ error: "Admin non configuré" });
    return;
  }

  if (!email || !password) {
    res.status(400).json({ error: "Email et mot de passe requis" });
    return;
  }

  const emailOk = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
  const passwordOk = await bcrypt.compare(password, adminHash);

  if (!emailOk || !passwordOk) {
    // Uniform delay to thwart timing attacks
    await new Promise((r) => setTimeout(r, 500));
    res.status(401).json({ error: "Identifiants incorrects" });
    return;
  }

  const token = signAdminToken();
  res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
  res.json({ ok: true });
});

router.post("/admin/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get("/admin/me", requireAdmin, (_req, res) => {
  res.json({ authenticated: true });
});

export default router;
