import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves a site image path (e.g. "images/realisation-1.png" as stored in DB)
 * to its optimized WebP twin served from public/images/.
 * Keep original .png paths for OG/social meta tags — some scrapers don't read WebP.
 */
export function webpUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "").replace(/\.png$/i, ".webp")}`;
}

/**
 * Resolves an image path stored in a content block to a displayable URL.
 * Content blocks may hold either a static asset path (e.g. "images/hero-bg.jpg",
 * relative to BASE_URL, no generated .webp twin) or an uploaded file's
 * absolute serving path (e.g. "/api/objects/uploads/<uuid>"). Unlike
 * webpUrl(), this never rewrites the extension — uploaded images have none,
 * and the default static hero files (.jpg / .png) have no .webp twin.
 */
export function resolveContentImageUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  return `${import.meta.env.BASE_URL}${path}`;
}
