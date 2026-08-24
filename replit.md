# MV PROTECT

Site vitrine multi-pages en français pour MV PROTECT, atelier de detailing automobile haut de gamme (nettoyage, polissage/céramique, PPF, covering), avec demandes de devis, galerie de réalisations et blog.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- MV PROTECT frontend runs via the `artifacts/mv-protect: web` workflow (Vite, port 25590, previewPath "/")
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/mv-protect run typecheck` — frontend-only typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + wouter + framer-motion + TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract (quote-requests, realisations, articles, testimonials)
- `lib/db/src/schema/` — Drizzle schemas (quoteRequests, realisations, articles, testimonials)
- `artifacts/api-server/src/routes/` — Express routes (quotes, realisations, articles, testimonials)
- `artifacts/mv-protect/src/pages/` — all site pages (Home, Services, PPF, Tarifs, Realisations, News, Article, Contact, Legal, Privacy, Cookies, not-found)
- `artifacts/mv-protect/src/components/` — Layout, Header, Footer, CookieBanner, SEO helper
- `artifacts/mv-protect/public/images/` — AI-generated site imagery
- Theme: `artifacts/mv-protect/src/index.css` (dark theme, electric blue #0060B4→#36ADFF)

## Architecture decisions

- Contract-first: OpenAPI spec drives generated React Query hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`)
- Image URLs stored relative in DB (e.g. `images/realisation-1.png`); frontend prefixes `import.meta.env.BASE_URL`
- Images optimized as WebP twins: every PNG in `public/images/` has a `.webp` twin (generate via `magick img.png -resize "1200x1200>" -quality 82 img.webp`; 1920 max for hero). Visible `<img>`/backgrounds use `.webp` (DB paths rewritten at render time by `webpUrl()` in `src/lib/utils.ts`); OG/social meta and JSON-LD logo intentionally keep `.png` (scraper compatibility) — keep both files
- Tarifs page is quote-only — no public prices, by design
- Cookie consent stored in localStorage (`mvprotect-cookie-consent`), CNIL-style Accepter/Refuser/Personnaliser

## Product

- Pages FR : Accueil, Services, PPF, Tarifs (devis uniquement), Réalisations (galerie filtrable + lightbox), Actualités (blog + articles par slug), Contact (formulaire devis RGPD), Mentions légales, Politique de confidentialité, Politique cookies, 404
- Header fixe avec menu burger + bouton "Appeler" (tel: placeholder +33600000000)
- Infos légales : SAS MV PROTECT, dirigeant Maxime Viraud, SIREN 102 779 683, SIRET 102 779 683 00014, TVA FR20102779683, NAF 4520A

## User preferences

- Tout le contenu du site en français
- Pas de prix publics — devis uniquement
- Pour les artifacts HTML élaborés et multi-composants (gestion d'état, routing, composants shadcn/ui) → utiliser React + Tailwind + shadcn/ui
- Animations React : toujours installer et utiliser framer-motion automatiquement (transitions, gestes, layout, scroll, drag, modales, carrousels, effets fluides/springy) — ne pas redemander

## SEO

- Production URL (`https://asset-manager-advercetti57.replit.app`) is baked into: `index.html` (canonical, OG, JSON-LD), `src/components/SEO.tsx` (SITE_URL), `public/sitemap.xml`, `public/robots.txt` — update all four if a custom domain is added
- `index.html` contains hidden pre-rendered SEO content (`#seo-prerender`) + LocalBusiness JSON-LD (adresse : 4 Rue du Canal, 57970 Basse-Ham)
- SEO.tsx sets per-page canonical/OG/Twitter tags dynamically

## Gotchas

- `tel:+33600000000` and contact details (address, email) are placeholders — replace with real ones before go-live
- Hébergeur in mentions légales: Replit, Inc.
- Framer-motion variants need `as const` for `ease` string literals under strict TS
- `vite build` requires both `PORT` and `BASE_PATH` env vars (workflow/deploy provide them; set manually for local builds, e.g. `PORT=25590 BASE_PATH=/`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
