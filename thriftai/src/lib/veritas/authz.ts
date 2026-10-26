import 'server-only'
import type { UserRole } from '@/generated/prisma/client'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { fail } from './http'

/**
 * Authorization (B7). Middleware rejects anonymous requests early; these helpers do the real checks
 * (role + tenant scoping) next to the data, so a route is safe even if the middleware matcher misses it.
 */

export type SessionUser = { id: string; email: string; role: UserRole; tenantId: string | null }

async function currentUser(): Promise<SessionUser | null> {
  const s = await getSession()
  if (!s?.user?.id) return null
  return { id: s.user.id, email: s.user.email ?? '', role: s.user.role, tenantId: s.user.tenantId }
}

/** Server components / layouts: redirect to sign-in when not allowed. */
export async function requirePageRole(roles: UserRole[], next: string): Promise<SessionUser> {
  const u = await currentUser()
  if (!u) redirect(`/sign-in?next=${encodeURIComponent(next)}`)
  if (!roles.includes(u.role)) redirect(`/sign-in?next=${encodeURIComponent(next)}&error=forbidden`)
  return u
}

/** Route handlers: 401 when anonymous, 403 when the role doesn't fit. */
export async function requireApiRole(roles: UserRole[]): Promise<SessionUser | Response> {
  const u = await currentUser()
  if (!u) return fail(401, 'Sign in required')
  if (!roles.includes(u.role)) return fail(403, 'Not allowed')
  return u
}

/**
 * Which brand a user may see. Admins may pick any brand; brand users only brands of their own tenant.
 * Returns null when the user may not see the requested brand.
 */
export async function brandForUser(u: SessionUser, requestedSlug?: string | null) {
  if (u.role === 'ADMIN') {
    return requestedSlug
      ? prisma.brand.findUnique({ where: { slug: requestedSlug }, select: { id: true, slug: true, name: true, tenantId: true } })
      : prisma.brand.findFirst({ orderBy: { name: 'asc' }, select: { id: true, slug: true, name: true, tenantId: true } })
  }
  if (u.role !== 'BRAND' || !u.tenantId) return null
  return prisma.brand.findFirst({
    where: { tenantId: u.tenantId, ...(requestedSlug && { slug: requestedSlug }) },
    orderBy: { name: 'asc' },
    select: { id: true, slug: true, name: true, tenantId: true },
  })
}
