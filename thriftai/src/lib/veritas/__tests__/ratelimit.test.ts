/** @jest-environment node */
import { existsSync, readFileSync } from 'node:fs'
import type { prisma as Prisma } from '@/lib/prisma'
import type { dbHit as DbHit } from '../http'

// Needs the local dev database (.env.development*); skipped where there is none. jest.setup plants a placeholder
// DATABASE_URL, so read the dev value from the env files directly.
const devUrl = ['.env.development.local', '.env.development']
  .filter((f) => existsSync(f))
  .map((f) => readFileSync(f, 'utf8').match(/^DATABASE_URL=["']?([^"'\n]+)/m)?.[1])
  .find(Boolean)
if (devUrl) process.env.DATABASE_URL = devUrl
const hasDb = !!devUrl && /localhost|127\.0\.0\.1/.test(devUrl)

jest.mock('next/headers', () => ({ headers: async () => new Map(), cookies: async () => new Map() }))
jest.mock('server-only', () => ({}))

const suite = hasDb ? describe : describe.skip
suite('shared rate limiter (Postgres)', () => {
  const key = `test:${Date.now()}`
  // Load after DATABASE_URL is set above: the Prisma 7 adapter reads the URL when the client is created.
  let prisma: typeof Prisma
  let dbHit: typeof DbHit
  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma
    dbHit = (await import('../http')).dbHit
  })
  afterAll(async () => {
    await prisma.rateLimitHit.deleteMany({ where: { key } })
    await prisma.$disconnect()
  })
  it('counts across calls in one window and blocks over the limit', async () => {
    const results = []
    for (let i = 0; i < 4; i++) results.push(await dbHit(key, 3, 60_000))
    expect(results).toEqual([true, true, true, false])
  })
})
