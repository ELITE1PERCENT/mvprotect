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

export async function uploadFile(file: File): Promise<UploadUrlResponse> {
  const { uploadURL, objectPath, servingUrl } = await requestUploadUrl();
  await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
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
 * Section réservée aux images du hero d'accueil (fond PC, calque voiture PC,
 * image mobile) + leur cadrage. Ces blocs sont gérés par un écran admin dédié
 * (AdminHeroImage) et donc exclus de l'éditeur de textes générique.
 */
export const HERO_IMAGE_SECTION = "hero-image";

export const HERO_IMAGE_KEYS = {
  bgImage: "home.hero.bgImage",
  bgImagePosition: "home.hero.bgImagePosition",
  carImage: "home.hero.carImage",
  carImagePosition: "home.hero.carImagePosition",
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
