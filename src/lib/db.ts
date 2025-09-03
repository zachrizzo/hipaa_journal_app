import { PrismaClient } from '@prisma/client'

// Global prisma instance for development to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// During build time on Vercel, use a dummy URL if DATABASE_URL is not set
// This prevents build failures when collecting page data
const databaseUrl = process.env.DATABASE_URL || (
  process.env.VERCEL 
    ? 'postgresql://user:password@localhost:5432/mydb?schema=public'
    : undefined
)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: databaseUrl ? {
      db: {
        url: databaseUrl
      }
    } : undefined
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export default db