# ============================================================================
# MV PROTECT — Dockerfile pour Fly.io
#
# Architecture:
#   - Stage "builder" : node:24 (Debian/glibc) — installe les deps, compile
#     le frontend React (Vite/rollup) et le backend Express (esbuild).
#     Debian évite les problèmes de binaires natifs musl (rollup, lightningcss)
#     que Vite nécessite au build. Les deps runtime sont toutes pure-JS, donc
#     copier node_modules vers Alpine ne pose aucun problème.
#   - Stage "production" : image légère node:24-alpine avec uniquement les
#     artefacts compilés et les node_modules runtime.
# ============================================================================

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:24 AS builder

# pnpm via corepack (même version que le lock file lockfileVersion 9)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copier uniquement les manifestes d'abord (cache Docker layer)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig*.json ./
COPY artifacts/api-server/package.json        artifacts/api-server/
COPY artifacts/mv-protect/package.json        artifacts/mv-protect/
COPY artifacts/mockup-sandbox/package.json    artifacts/mockup-sandbox/
COPY lib/db/package.json                      lib/db/
COPY lib/api-zod/package.json                 lib/api-zod/
COPY lib/api-client-react/package.json        lib/api-client-react/
COPY lib/api-spec/package.json                lib/api-spec/
COPY scripts/package.json                     scripts/

# Le lockfile a été généré sous macOS : les binaires natifs linux (rollup,
# lightningcss, etc.) sont absents. Supprimer le lockfile pour forcer une
# résolution fraîche sur Debian Linux (glibc), qui installera les bons
# binaires natifs gnu automatiquement.
RUN rm pnpm-lock.yaml

# --ignore-scripts évite le blocage ERR_PNPM_IGNORED_BUILDS pour esbuild.
RUN pnpm install --ignore-scripts
# Reconstruire esbuild (son postinstall télécharge le binaire natif)
RUN pnpm rebuild esbuild

# Copier le reste du code source
COPY . .

# ── Build du frontend React (Vite) ──────────────────────────────────────────
# PORT est requis par vite.config.ts à la lecture de la config (pas au runtime)
# BASE_PATH=/ → tous les assets servis depuis la racine
RUN PORT=8080 BASE_PATH=/ NODE_ENV=production \
    pnpm --filter @workspace/mv-protect run build
# Sortie : artifacts/mv-protect/dist/public/

# ── Build du serveur API (esbuild) ──────────────────────────────────────────
RUN NODE_ENV=production \
    pnpm --filter @workspace/api-server run build
# Sortie : artifacts/api-server/dist/index.mjs

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:24-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# Copier les artefacts compilés
COPY --from=builder /app/artifacts/api-server/dist           ./dist
COPY --from=builder /app/artifacts/mv-protect/dist/public    ./public

# Copier les node_modules : nécessaires pour les packages externalisés
# (@google-cloud/storage, pino workers, etc.)
# Tous les packages runtime sont pure-JS : pas de problème de compatibilité
# glibc/musl pour les node_modules copiés depuis le builder Debian.
COPY --from=builder /app/node_modules                        ./node_modules
COPY --from=builder /app/artifacts/api-server/node_modules   ./artifacts/api-server/node_modules

EXPOSE 8080

# Healthcheck pour Fly.io
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/healthz || exit 1

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
