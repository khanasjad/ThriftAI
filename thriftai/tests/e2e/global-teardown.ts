import { PrismaClient } from '@prisma/client'
import { loadEnvConfig } from '@next/env'

/**
 * Removes anonymous search sessions created by this run (every /search?q= visit records one).
 * Local runs only: never touches a remote deployment's database.
 */
export default async function globalTeardown() {
  if (process.env.E2E_BASE_URL || !process.env.E2E_STARTED_AT) return
  loadEnvConfig(process.cwd(), true)
  if (process.env.APP_ENV === 'production' || !/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(process.env.DATABASE_URL ?? '')) return
  const prisma = new PrismaClient()
  try {
    const { count } = await prisma.searchSession.deleteMany({ where: { profileId: null, createdAt: { gte: new Date(process.env.E2E_STARTED_AT) } } })
    if (count) console.log(`e2e teardown: removed ${count} test search sessions`)
  } finally {
    await prisma.$disconnect()
  }
}
