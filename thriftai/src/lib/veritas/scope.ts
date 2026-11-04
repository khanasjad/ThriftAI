/**
 * Who can see which products. A platform's imported catalog is private to its tenant (product plan:
 * brand-provided data stays private), marked isPrivate by the ingest. Public pages show only public products;
 * a Score API key sees public products plus its own tenant's private ones.
 */
import type { Prisma } from '@/generated/prisma/client'

export const PUBLIC_PRODUCTS = { isPrivate: false } satisfies Prisma.ClothingProductWhereInput

/** The private tenant holding licensed open datasets in development (CLAUDE.md: real open data in development). */
export const OPEN_DATA_TENANT = 'open-data-cc0'
export const OPEN_DATA_PRODUCTS = { tenant: { slug: OPEN_DATA_TENANT } } satisfies Prisma.ClothingProductWhereInput
/** Records from a licensed open dataset carry a source starting with "open-data:". */
export const isOpenData = (source: string | null | undefined) => !!source?.startsWith('open-data:')

export function visibleProducts(tenantId: string | null): Prisma.ClothingProductWhereInput {
  return tenantId ? { OR: [PUBLIC_PRODUCTS, { tenantId }] } : PUBLIC_PRODUCTS
}

/** Dashboard scope: a platform or brand user sees their own tenant's products; an admin without a tenant sees public ones. */
export function ownProducts(tenantId: string | null): Prisma.ClothingProductWhereInput {
  return tenantId ? { tenantId } : PUBLIC_PRODUCTS
}

/**
 * The products a viewer may open: shoppers see public ones, an organisation user also its own tenant's, admins all.
 * `openDataPublic` (development demo only) adds the open-data tenant for everyone; no other private tenant.
 */
export function scopeForViewer(u: { role: string; tenantId: string | null } | null, openDataPublic: boolean): Prisma.ClothingProductWhereInput {
  if (u?.role === 'ADMIN') return {}
  const own = u ? visibleProducts(u.tenantId) : PUBLIC_PRODUCTS
  return openDataPublic ? { OR: [own, OPEN_DATA_PRODUCTS] } : own
}
