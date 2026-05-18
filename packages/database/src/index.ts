import { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────
// Prisma Client Singleton
// Prevents multiple instances in development
// (Next.js hot reload creates new instances)
// ─────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}

export * from '@prisma/client'
