import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { env } from './env'
import { fail, rateLimit } from './http'

/**
 * Score API keys (B7). Only a SHA-256 hash is stored; the raw key is returned once at creation.
 * Format: vk_<env>_<32 random bytes, base64url>. The first 12 characters are kept as a display prefix.
 */
const hash = (key: string) => createHash('sha256').update(key).digest('hex')

export async function createApiKey(tenantId: string, name: string) {
  const raw = `vk_${env().APP_ENV === 'production' ? 'live' : 'dev'}_${randomBytes(32).toString('base64url')}`
  const row = await prisma.apiKey.create({ data: { tenantId, name, keyHash: hash(raw), prefix: raw.slice(0, 12) } })
  return { id: row.id, name: row.name, prefix: row.prefix, createdAt: row.createdAt, key: raw }
}

export async function listApiKeys(tenantId: string) {
  return prisma.apiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true, revokedAt: true },
  })
}

export async function revokeApiKey(tenantId: string, id: string) {
  const { count } = await prisma.apiKey.updateMany({ where: { id, tenantId, revokedAt: null }, data: { revokedAt: new Date() } })
  return count > 0
}

/** Rate limits per minute: anonymous callers by IP, key holders by key. */
export const ANON_LIMIT = 60
export const KEY_LIMIT = 600

/**
 * Gate for public Score API routes. No key → anonymous (lower limit). A key that is unknown or revoked → 401.
 * Returns a Response to send back, or the caller identity.
 */
export async function scoreApiGate(): Promise<Response | { tenantId: string | null; keyId: string | null }> {
  const auth = (await headers()).get('authorization') ?? ''
  const m = auth.match(/^Bearer\s+(vk_[a-z]+_[A-Za-z0-9_-]{20,})$/)
  if (!auth) {
    if (!(await rateLimit('score-api:anon', ANON_LIMIT, 60_000))) return fail(429, `Rate limit: ${ANON_LIMIT} requests per minute without an API key.`)
    return { tenantId: null, keyId: null }
  }
  if (!m) return fail(401, 'Malformed API key. Use: Authorization: Bearer vk_…')
  const h = hash(m[1])
  const row = await prisma.apiKey.findUnique({ where: { keyHash: h }, select: { id: true, tenantId: true, keyHash: true, revokedAt: true, lastUsedAt: true } })
  if (!row || row.revokedAt || !timingSafeEqual(Buffer.from(row.keyHash), Buffer.from(h))) return fail(401, 'Invalid or revoked API key')
  if (!(await rateLimit(`score-api:key:${row.id}`, KEY_LIMIT, 60_000))) return fail(429, `Rate limit: ${KEY_LIMIT} requests per minute per key.`)
  // Record use at most once a minute to avoid a write per request.
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) await prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
  return { tenantId: row.tenantId, keyId: row.id }
}
