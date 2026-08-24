# ============================================================================
# MV PROTECT — Dockerfile pour Fly.io
#
# Architecture:
#   - Stage "builder" : node:24 (Debian/glibc) — installe les deps, compile
#     le frontend React (Vite/rollup) et le backend Express (esbuild).
#     Debian évite les problèmes de binaires natifs musl (rollup, lightningcss)
#     que Vite nécessite au build. Les deps runtime importées sont pure-JS,
#     donc copier node_modules vers Alpine ne pose aucun problème.
#   - Stage "production" : image légère node:24-alpine avec uniquement les
#     artefacts compilés et les node_modules runtime.
#
# node-linker=hoisted : pnpm génère un node_modules PLAT (façon npm) au lieu
# de la structure isolée à symlinks. Indispensable ici car esbuild externalise
# @google-cloud/storage : le bundle dist/index.mjs fait `import
# "@google-cloud/storage"` au runtime et doit le résoudre depuis
# /app/node_modules — ce qui n'est possible qu'avec un node_modules hoisté.
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

# 1. node-linker=hoisted → node_modules plat, résolvable depuis /app/dist.
# 2. Supprimer le lockfile (généré sous macOS, sans les binaires natifs linux)
#    pour forcer une résolution fraîche sur Debian glibc, qui installera les
#    bons binaires (@rollup/rollup-linux-x64-gnu, lightningcss gnu, etc.).
RUN printf '\nnode-linker=hoisted\n' >> .npmrc && \
    rm pnpm-lock.yaml

# --ignore-scripts évite le blocage ERR_PNPM_IGNORED_BUILDS pour esbuild.
RUN pnpm install --ignore-scripts
# Reconstruire esbuild (son postinstall télécharge le binaire natif)
RUN pnpm rebuild esbuild

# ── Assertion : @google-cloud/storage DOIT être résolvable à la racine ────────
# Le bundle dist/index.mjs (dans /app/dist) fait `import "@google-cloud/storage"`
# au runtime. Avec node-linker=hoisted il doit exister à /app/node_modules.
# Si l'assertion échoue, le build s'arrête ici avec l'emplacement réel du package.
RUN test -d node_modules/@google-cloud/storage \
      && echo "OK: @google-cloud/storage hoisté à la racine node_modules" \
      || ( echo "ECHEC: @google-cloud/storage absent de la racine. Emplacements trouvés :"; \
           find . -maxdepth 5 -type d -path '*@google-cloud/storage' -not -path '*/.pnpm/*' 2>/dev/null; \
           exit 1 )

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

# node_modules plat (hoisted) : contient @google-cloud/storage et toutes les
# deps externalisées par esbuild, résolvables depuis /app/dist/index.mjs.
# Toutes les deps runtime importées sont pure-JS → aucun souci glibc/musl.
COPY --from=builder /app/node_modules                        ./node_modules

EXPOSE 8080

# Healthcheck pour Fly.io
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/healthz || exit 1

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
