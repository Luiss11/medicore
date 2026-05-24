FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy packages
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared

# Copy API
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @medicore/database exec prisma generate

# Build API
RUN pnpm --filter @medicore/api build

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
