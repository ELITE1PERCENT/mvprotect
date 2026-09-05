/**
 * Helper for admin API calls.
 * Uses credentials: 'include' so the httpOnly admin_token cookie is sent.
 * All routes go to /api/admin/...
 */

const BASE = "/api/admin";

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const adminLogin = (email: string, password: string) =>
  request<{ ok: boolean }>("POST", "/login".replace("/admin", "").replace("/api", ""), { email, password });

// Override: auth routes are at /api/admin/login etc.
async function authRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as Record<string, string>)?.error ?? `HTTP ${res.status}`);
  return data as T;
}

export const login = (email: string, password: string) =>
  authRequest<{ ok: boolean }>("POST", "/login", { email, password });

export const logout = () => authRequest<{ ok: boolean }>("POST", "/logout");

export const checkAuth = () =>
  authRequest<{ authenticated: boolean }>("GET", "/me");

// ── Réalisations ──────────────────────────────────────────────────────────────
export type RealisationImage = { id: number; url: string; sortOrder?: number };

export type AdminRealisation = {
  id: number;
  title: string;
  service: string;
  imageUrl: string;
  description: string;
  vehicle: string | null;
  sortOrder: number;
  status: string;
  category: string | null;
  featuredHome: boolean;
  images: RealisationImage[];
};

export const listRealisations = () =>
  request<AdminRealisation[]>("GET", "/realisations");

export const createRealisation = (data: Omit<AdminRealisation, "id">) =>
  request<AdminRealisation>("POST", "/realisations", data);

export const updateRealisation = (id: number, data: Partial<Omit<AdminRealisation, "id">>) =>
  request<AdminRealisation>("PUT", `/realisations/${id}`, data);

export const deleteRealisation = (id: number) =>
  request<{ ok: boolean }>("DELETE", `/realisations/${id}`);

export type AdminTestimonial = {
  id: number;
  name: string;
  rating: number;
  comment: string;
  vehicle: string | null;
  /** "google" = avis Google vérifié · "site" = témoignage recueilli directement */
  source: "google" | "site";
};

export const addRealisationImage = (realisationId: number, url: string) =>
  request<RealisationImage>("POST", `/realisations/${realisationId}/images`, { url, sortOrder: 0 });

export const deleteRealisationImage = (realisationId: number, imageId: number) =>
  request<{ ok: boolean }>("DELETE", `/realisations/${realisationId}/images/${imageId}`);

export const toggleFeaturedHome = (id: number, featuredHome: boolean) =>
  request<AdminRealisation>("PUT", `/realisations/${id}`, { featuredHome });

export const reorderRealisationImages = (
  realisationId: number,
  order: { id: number; sortOrder: number }[],
) =>
  request<{ ok: boolean }>("PUT", `/realisations/${realisationId}/images/reorder`, { order });
export type UploadUrlResponse = {
  uploadURL: string;
  objectPath: string;
  servingUrl: string;
};

export async function requestUploadUrl(): Promise<UploadUrlResponse> {
  return request<UploadUrlResponse>("POST", "/upload/request-url");
}

// ── Optimisation automatique des photos avant upload ───────────────────────────
// Le client (garage) importe souvent des photos issues d'un téléphone (plusieurs
// Mo, résolution capteur complète), ce qui ralentit fortement le chargement du
// site. On les recompresse donc en WebP et on plafonne leur plus grand côté
// avant l'envoi, directement dans le navigateur — aucune image originale n'est
// stockée telle quelle.
const MAX_IMAGE_DIMENSION = 2000; // px, plus grand côté
const WEBP_QUALITY = 0.82;

// Formats volontairement exclus de la recompression :
// - image/svg+xml : vectoriel, une conversion WebP le détruirait
// - image/gif     : potentiellement animé, WebP figerait l'animation
const SKIP_OPTIMIZATION_TYPES = new Set(["image/svg+xml", "image/gif"]);

/**
 * Recompresse une photo en WebP (et la redimensionne si besoin) côté navigateur.
 * Retourne le fichier tel quel si le type n'est pas concerné, si le navigateur
 * ne sait pas encoder du WebP, ou si la conversion échoue ou n'apporte rien —
 * on ne bloque jamais un upload à cause de l'optimisation.
 */
async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || SKIP_OPTIMIZATION_TYPES.has(file.type)) {
    return file;
  }
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    return file;
  }
}

export async function uploadFile(file: File): Promise<UploadUrlResponse> {
  const optimized = await optimizeImageForUpload(file);
  const { uploadURL, objectPath, servingUrl } = await requestUploadUrl();
  await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": optimized.type || "application/octet-stream" },
    body: optimized,
  });
  return { uploadURL, objectPath, servingUrl };
}

// ── Content blocks ─────────────────────────────────────────────────────────────
export type ContentBlock = {
  key: string;
  label: string;
  section: string;
  value: string;
  updatedAt: string;
};

/**
 * Section réservée aux images du hero d'accueil (image PC, image mobile) +
 * leur cadrage. Ces blocs sont gérés par un écran admin dédié (AdminHeroImage)
 * et donc exclus de l'éditeur de textes générique.
 */
export const HERO_IMAGE_SECTION = "hero-image";

export const HERO_IMAGE_KEYS = {
  bgImage: "home.hero.bgImage",
  bgImagePosition: "home.hero.bgImagePosition",
  mobileImage: "home.hero.mobileImage",
  mobileImagePosition: "home.hero.mobileImagePosition",
} as const;

export const listContentBlocks = () =>
  request<ContentBlock[]>("GET", "/content");

export const updateContentBlock = (key: string, value: string) =>
  request<ContentBlock>("PUT", `/content/${key}`, { value });

export const updateTestimonial = (id: number, data: Partial<Omit<AdminTestimonial, "id">>) =>
  request<AdminTestimonial>("PUT", `/testimonials/${id}`, data);

export const createTestimonial = (data: Omit<AdminTestimonial, "id">) =>
  request<AdminTestimonial>("POST", "/testimonials", data);

export const listTestimonials = () =>
  request<AdminTestimonial[]>("GET", "/testimonials");

export const deleteTestimonial = (id: number) =>
  request<{ ok: boolean }>("DELETE", `/testimonials/${id}`);
