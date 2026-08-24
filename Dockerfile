# ============================================================================
# MV PROTECT — Dockerfile pour Fly.io
#
# Architecture:
#   - Stage "builder" : node:24 (Debian/glibc) — installe les deps, compile
#     le frontend React (Vite/rollup) et le backend Express (esbuild).
#     Debian évite les problèmes de binaires natifs musl (rollup, lightningcss)
#     que Vite nécessite au build. Les deps runtime importées sont pure-JS.
#   - Stage "production" : image légère node:24-alpine.
#
# RÉSOLUTION DES MODULES EXTERNALISÉS
# esbuild externalise @google-cloud/storage (seule dépendance externalisée
# réellement importée au runtime). Le serveur est donc lancé DEPUIS
# artifacts/api-server/dist/, avec les node_modules pnpm laissés en place
# (isolés, à symlinks) — exactement comme sur l'hôte de dev. Node résout
# alors `import "@google-cloud/storage"` via
# artifacts/api-server/node_modules/@google-cloud/storage (symlink vers le
# store .pnpm de /app/node_modules). Le store racine est donc aussi copié.
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

# Supprimer le lockfile (généré sous macOS, sans les binaires natifs linux)
# pour forcer une résolution fraîche sur Debian glibc, qui installera les
# bons binaires (@rollup/rollup-linux-x64-gnu, lightningcss gnu, etc.).
RUN rm pnpm-lock.yaml

# --ignore-scripts évite le blocage ERR_PNPM_IGNORED_BUILDS pour esbuild.
RUN pnpm install --ignore-scripts
# Reconstruire esbuild (son postinstall télécharge le binaire natif)
RUN pnpm rebuild esbuild

# ── Assertion : @google-cloud/storage DOIT être résolvable depuis api-server ──
# `test -d` suit le symlink : vrai uniquement si la cible (dans .pnpm) existe.
RUN test -d artifacts/api-server/node_modules/@google-cloud/storage \
      && echo "OK: @google-cloud/storage résolvable depuis artifacts/api-server" \
      || ( echo "ECHEC: @google-cloud/storage introuvable"; \
           ls -la artifacts/api-server/node_modules/@google-cloud/ 2>/dev/null; \
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

# Serveur compilé + ses node_modules (symlinks) laissés côte à côte, comme en
# dev, pour que la résolution de @google-cloud/storage fonctionne à l'identique.
COPY --from=builder /app/artifacts/api-server/dist           ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/api-server/node_modules   ./artifacts/api-server/node_modules

# Store pnpm racine (.pnpm) : cible des symlinks ci-dessus. Toutes les deps
# runtime importées sont pure-JS → aucun souci glibc/musl.
COPY --from=builder /app/node_modules                        ./node_modules

# Assets statiques du frontend : app.ts les sert depuis `<dossierServeur>/../public`
# soit /app/artifacts/api-server/dist/../public = /app/artifacts/api-server/public
COPY --from=builder /app/artifacts/mv-protect/dist/public    ./artifacts/api-server/public

EXPOSE 8080

# Healthcheck pour Fly.io
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/healthz || exit 1

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
