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
