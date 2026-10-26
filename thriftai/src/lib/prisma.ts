import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * Database client (Prisma 7, pg driver adapter). One client per process; reused across hot reloads in dev.
 * Pool: serverless instances keep it small (the Supabase pooler does the real pooling); 5 s connect timeout as in
 * Prisma 6. Connection string params Prisma 6 used (`pgbouncer`, `connection_limit`) are ignored by pg.
 */
/** A new client for a connection string (default DATABASE_URL). Scripts use this for a second database. */
export function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  const adapter = new PrismaPg({
    connectionString,
    max: process.env.VERCEL ? 1 : 10,
    connectionTimeoutMillis: 5_000,
  })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
