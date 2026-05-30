FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @medicore/database exec prisma generate

EXPOSE 4000

CMD ["node", "--import", "tsx/esm", "apps/api/src/server.ts"]