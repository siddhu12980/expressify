FROM node:lts-alpine AS pruner
WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm dlx turbo prune worker --docker

FROM node:lts-alpine AS installer
WORKDIR /app
RUN corepack enable pnpm
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

FROM node:lts-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=installer /app/node_modules ./node_modules
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build --filter=worker

FROM node:lts-slim AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodeuser
USER nodeuser
COPY --from=builder --chown=nodeuser:nodejs /app/apps/worker/dist ./
CMD ["node", "index.js"]
