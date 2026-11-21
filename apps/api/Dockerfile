FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter @onit/api...

COPY packages/core packages/core
COPY apps/api apps/api

RUN pnpm --filter @onit/core build && pnpm --filter @onit/api build

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
