# ============================================================================
# MV PROTECT — Dockerfile pour Fly.io
#
# Architecture:
#   - Stage "builder" : installe les deps, compile le frontend React (Vite)
#     et le backend Express (esbuild)
#   - Stage "production" : image légère avec uniquement les artefacts compilés
#     et les node_modules nécessaires en runtime
# ============================================================================

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

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

# Installer toutes les dépendances (frozen = reproductible)
# --ignore-scripts évite le blocage ERR_PNPM_IGNORED_BUILDS pour esbuild
RUN pnpm install --frozen-lockfile --ignore-scripts
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
COPY --from=builder /app/node_modules                        ./node_modules
COPY --from=builder /app/artifacts/api-server/node_modules   ./artifacts/api-server/node_modules

EXPOSE 8080

# Healthcheck pour Fly.io
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/healthz || exit 1

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
